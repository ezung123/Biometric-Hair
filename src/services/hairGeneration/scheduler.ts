// ══════════════════════════════════════════════════════════════════════════════
// src/services/hairGeneration/scheduler.ts
// STEP 3: CONCURRENCY-CONSTRAINED LAZY JOB SCHEDULER (MAX 2 CONCURRENT)
// ══════════════════════════════════════════════════════════════════════════════
// 1. Immediately triggers top 2 styles (hero + primary card).
// 2. Lazily processes additional styles on viewport entry or card tap.
// 3. Strict max concurrency: 2 jobs.
// 4. Instant job cancellation when user navigates away or retakes photo.
// ══════════════════════════════════════════════════════════════════════════════

import {
  generateHairstylePreview,
  type HairstylePreviewResult,
  type PipelineProgressUpdate,
} from './pipeline';

export interface GenerationJob {
  styleId: string;
  imageUri: string;
  landmarks: Array<{ x: number; y: number; z?: number }>;
  audience: 'masculine' | 'feminine' | 'all';
  selectedColour: 'natural' | 'darker' | 'lighter' | 'warm' | 'cool';
  isMirrored?: boolean;
  priority: 'high' | 'normal';
  controller: AbortController;
  onProgress?: (update: PipelineProgressUpdate) => void;
  onComplete?: (result: HairstylePreviewResult) => void;
  onError?: (err: any) => void;
}

export class GenerationScheduler {
  private queue: GenerationJob[] = [];
  private activeJobs = new Map<string, GenerationJob>();
  private maxConcurrency = 2;
  private results = new Map<string, HairstylePreviewResult>();

  /**
   * Enqueues a style for generation. If high priority, placed at front of queue.
   */
  enqueue(job: Omit<GenerationJob, 'controller'>): void {
    // Avoid re-enqueuing already completed or active jobs
    if (this.results.has(job.styleId) || this.activeJobs.has(job.styleId)) {
      if (this.results.has(job.styleId) && job.onComplete) {
        job.onComplete(this.results.get(job.styleId)!);
      }
      return;
    }

    const controller = new AbortController();
    const fullJob: GenerationJob = { ...job, controller };

    if (job.priority === 'high') {
      this.queue.unshift(fullJob);
    } else {
      this.queue.push(fullJob);
    }

    this.processNext();
  }

  /**
   * Schedules immediate generation of the top 2 styles.
   */
  scheduleTopStyles(
    topStyleIds: string[],
    imageUri: string,
    landmarks: Array<{ x: number; y: number; z?: number }>,
    audience: 'masculine' | 'feminine' | 'all',
    selectedColour: 'natural' | 'darker' | 'lighter' | 'warm' | 'cool',
    onStyleComplete?: (styleId: string, result: HairstylePreviewResult) => void,
    onStyleProgress?: (styleId: string, update: PipelineProgressUpdate) => void,
    onStyleError?: (styleId: string, err: any) => void
  ): void {
    topStyleIds.slice(0, 2).forEach((styleId) => {
      this.enqueue({
        styleId,
        imageUri,
        landmarks,
        audience,
        selectedColour,
        priority: 'high',
        onProgress: (upd) => onStyleProgress?.(styleId, upd),
        onComplete: (res) => onStyleComplete?.(styleId, res),
        onError: (err) => onStyleError?.(styleId, err),
      });
    });
  }

  private async processNext(): Promise<void> {
    if (this.activeJobs.size >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    this.activeJobs.set(job.styleId, job);

    try {
      const result = await generateHairstylePreview({
        imageUri: job.imageUri,
        styleId: job.styleId,
        landmarks: job.landmarks,
        audience: job.audience,
        selectedColour: job.selectedColour,
        isMirrored: job.isMirrored,
        onProgress: job.onProgress,
        signal: job.controller.signal,
      });

      this.results.set(job.styleId, result);
      job.onComplete?.(result);
    } catch (err: any) {
      if (!job.controller.signal.aborted) {
        console.warn(`[Scheduler] Generation error on ${job.styleId}:`, err);
        job.onError?.(err);
      }
    } finally {
      this.activeJobs.delete(job.styleId);
      this.processNext();
    }
  }

  /**
   * Cancels all queued and active generation jobs immediately.
   */
  cancelAll(): void {
    // Abort active jobs
    this.activeJobs.forEach((job) => {
      job.controller.abort();
    });
    this.activeJobs.clear();
    this.queue = [];
  }

  getResult(styleId: string): HairstylePreviewResult | undefined {
    return this.results.get(styleId);
  }

  hasResult(styleId: string): boolean {
    return this.results.has(styleId);
  }

  isWorking(styleId: string): boolean {
    return this.activeJobs.has(styleId);
  }

  clearResults(): void {
    this.cancelAll();
    this.results.clear();
  }
}

export const globalGenerationScheduler = new GenerationScheduler();

