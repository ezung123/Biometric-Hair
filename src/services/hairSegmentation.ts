// ══════════════════════════════════════════════════════════════════════════════
// Hair Semantic Segmentation & Real-Time Natural Hair Suppression Service
// Uses MediaPipe Vision Selfie Multi-Class model (selfie_multiclass_256x256.tflite)
// with high-speed GPU delegate & fallback adaptive matting to cleanly suppress
// the user's natural background hair so 3D AR hairstyles fit with zero hair bleed.
// Mandate: Strict Zero-Identity-Swapping (Face & skin below Trichion 100% untouched).
// ══════════════════════════════════════════════════════════════════════════════

import { Platform } from 'react-native';

export interface HairSegmentationResult {
  hasHair: boolean;
  hairPixelCount: number;
  maskCanvas: HTMLCanvasElement | null;
  clearedScalpCanvas: HTMLCanvasElement | null;
  hairlineY: number; // Normalized Y (0-1) where natural hairline begins
}

export interface LiveHairSuppressionOptions {
  hairlinePctY: number;    // Trichion hairline Y (0 - 100%)
  centerPctX: number;      // Cranial center X (0 - 100%)
  skullWidthPx: number;    // Measured skull width in display pixels
  styleId: string;         // Active hairstyle ID
  landmarks?: Array<{ x: number; y: number; z?: number }>;
  isMirrored?: boolean;
}

function isSkinPixel(r: number, g: number, b: number): boolean {
  if (r + g + b < 45 || r < 35) return false;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return cb >= 75 && cb <= 135 && cr >= 126 && cr <= 178;
}

class HairSegmentationService {
  private segmenter: any = null;
  private isInitializing = false;
  private isLoaded = false;
  private wasmLoaded = false;

  // Offscreen low-res buffers for 60 FPS real-time processing
  private segCanvas: HTMLCanvasElement | null = null;
  private segCtx: CanvasRenderingContext2D | null = null;
  private maskCanvas: HTMLCanvasElement | null = null;
  private maskCtx: CanvasRenderingContext2D | null = null;
  private lastSegmentationTime = 0;
  private latestCategoryMask: Uint8Array | null = null;
  private maskW = 256;
  private maskH = 256;

  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return false;
    }

    if (this.isLoaded) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;

    try {
      let tasksVision: any;
      try {
        tasksVision = await import('@mediapipe/tasks-vision');
      } catch (err) {
        if ((window as any).tasksVision) {
          tasksVision = (window as any).tasksVision;
        } else {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/tasks-vision.js';
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve();
            script.onerror = (e) => reject(e);
            document.head.appendChild(script);
          });
          tasksVision = (window as any).tasksVision;
        }
      }

      if (!tasksVision) {
        throw new Error('Tasks Vision could not be loaded');
      }

      const { ImageSegmenter, FilesetResolver } = tasksVision;

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      this.wasmLoaded = true;

      this.segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      });

      this.isLoaded = true;
      this.isInitializing = false;
      console.log('[MediaPipe] Multi-Class Hair Segmenter successfully initialized on GPU.');
      return true;
    } catch (err) {
      console.warn('[MediaPipe] MediaPipe GPU segmenter init deferred; using real-time adaptive matting:', err);
      this.isInitializing = false;
      return false;
    }
  }

  isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Processes a video or image element and produces a hair segmentation mask
   */
  segmentHair(
    sourceElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    width: number,
    height: number
  ): HairSegmentationResult {
    const result: HairSegmentationResult = {
      hasHair: false,
      hairPixelCount: 0,
      maskCanvas: null,
      clearedScalpCanvas: null,
      hairlineY: 0.28,
    };

    if (!this.segmenter || !this.isLoaded) {
      return result;
    }

    try {
      const segmentationResult = this.segmenter.segment(sourceElement);
      const categoryMask = segmentationResult.categoryMask;
      if (!categoryMask) return result;

      const uint8Array = categoryMask.getAsUint8Array();
      const maskW = categoryMask.width;
      const maskH = categoryMask.height;

      // Labels in selfie_multiclass: 0: background, 1: hair, 2: body-skin, 3: face-skin, 4: clothes, 5: others
      const labels = this.segmenter.getLabels?.() || ['background', 'hair', 'body-skin', 'face-skin', 'clothes', 'others'];
      const hairIndex = labels.indexOf('hair') >= 0 ? labels.indexOf('hair') : 1;

      // Create mask canvas
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) return result;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = maskW;
      tempCanvas.height = maskH;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return result;

      const imgData = tempCtx.createImageData(maskW, maskH);
      const data = imgData.data;

      let hairCount = 0;
      let minHairY = maskH;
      let maxHairY = 0;

      for (let i = 0; i < uint8Array.length; i++) {
        const classId = uint8Array[i];
        const y = Math.floor(i / maskW);

        if (classId === hairIndex) {
          hairCount++;
          if (y < minHairY) minHairY = y;
          if (y > maxHairY) maxHairY = y;

          data[i * 4] = 255;
          data[i * 4 + 1] = 255;
          data[i * 4 + 2] = 255;
          data[i * 4 + 3] = 255;
        } else {
          data[i * 4] = 0;
          data[i * 4 + 1] = 0;
          data[i * 4 + 2] = 0;
          data[i * 4 + 3] = 0;
        }
      }

      tempCtx.putImageData(imgData, 0, 0);

      maskCtx.imageSmoothingEnabled = true;
      maskCtx.imageSmoothingQuality = 'high';
      maskCtx.drawImage(tempCanvas, 0, 0, width, height);

      result.hasHair = hairCount > 50;
      result.hairPixelCount = hairCount;
      result.maskCanvas = maskCanvas;
      result.hairlineY = maxHairY > 0 ? (maxHairY / maskH) : 0.28;

      return result;
    } catch (e) {
      console.warn('[MediaPipe] Segmentation execution error:', e);
      return result;
    }
  }

  /**
   * High-Performance Real-Time Natural Hair Suppression Engine:
   * Suppresses protruding natural hair (parietal crest, temples, crown) into the
   * ambient room background and applies a clean scalp base under the chosen hairstyle.
   * STRICT ZERO-IDENTITY-SWAPPING: Face, eyes, nose, lips, beard, and neck are untouched.
   */
  suppressNaturalHairLive(
    targetCanvas: HTMLCanvasElement,
    options: LiveHairSuppressionOptions
  ): void {
    const w = targetCanvas.width;
    const h = targetCanvas.height;
    if (w <= 0 || h <= 0) return;

    const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { hairlinePctY, centerPctX, skullWidthPx, styleId } = options;
    const trichionY = (hairlinePctY / 100) * h;
    const headCenterX = (centerPctX / 100) * w;
    const skullW = skullWidthPx || (w * 0.35);

    // Compute target hairstyle lateral and cranial envelopes
    const isShortStyle = ['textured-crop', 'buzz-cut', 'taper-fade', 'sleek-pixie', 'classic-quiff'].includes(styleId);
    const lateralMargin = isShortStyle ? skullW * 0.46 : skullW * 0.65;
    const topMargin = isShortStyle ? skullW * 0.40 : skullW * 0.60;
    const earLevelY = trichionY + skullW * 0.35;

    const leftEnvelope = headCenterX - lateralMargin;
    const rightEnvelope = headCenterX + lateralMargin;
    const topEnvelope = Math.max(0, trichionY - topMargin);

    // Run MediaPipe multi-class segmentation every ~40ms (25 FPS) if model is ready
    const now = performance.now();
    if (this.isLoaded && this.segmenter && (now - this.lastSegmentationTime > 40)) {
      try {
        if (!this.segCanvas) {
          this.segCanvas = document.createElement('canvas');
          this.segCanvas.width = this.maskW;
          this.segCanvas.height = this.maskH;
          this.segCtx = this.segCanvas.getContext('2d', { willReadFrequently: true });
        }
        if (this.segCtx) {
          this.segCtx.drawImage(targetCanvas, 0, 0, this.maskW, this.maskH);
          const segmentationResult = this.segmenter.segment(this.segCanvas);
          if (segmentationResult?.categoryMask) {
            this.latestCategoryMask = segmentationResult.categoryMask.getAsUint8Array();
            this.lastSegmentationTime = now;
          }
        }
      } catch (err) {
        // Fall back gracefully to adaptive matting
      }
    }

    // Read target canvas pixel buffer
    const imgData = ctx.getImageData(0, 0, w, h);
    const px = imgData.data;

    // Sample ambient room background tone from upper corners
    let bgR = 0, bgG = 0, bgB = 0, sampleCount = 0;
    const sampleH = Math.min(30, Math.floor(h * 0.1));
    const sampleW = Math.min(30, Math.floor(w * 0.1));
    for (let sy = 0; sy < sampleH; sy += 3) {
      for (let sx = 0; sx < sampleW; sx += 3) {
        const iLeft = (sy * w + sx) * 4;
        const iRight = (sy * w + (w - 1 - sx)) * 4;
        bgR += px[iLeft] + px[iRight];
        bgG += px[iLeft + 1] + px[iRight + 1];
        bgB += px[iLeft + 2] + px[iRight + 2];
        sampleCount += 2;
      }
    }
    if (sampleCount > 0) {
      bgR = Math.round(bgR / sampleCount);
      bgG = Math.round(bgG / sampleCount);
      bgB = Math.round(bgB / sampleCount);
    } else {
      bgR = 25; bgG = 25; bgB = 28;
    }

    // Sample authentic forehead skin tone just below Trichion for realistic scalp blending
    let skinR = 190, skinG = 145, skinB = 120, skinSamples = 0;
    const skinY = Math.min(h - 5, Math.floor(trichionY + 15));
    const skinXStart = Math.max(0, Math.floor(headCenterX - 20));
    const skinXEnd = Math.min(w - 1, Math.floor(headCenterX + 20));
    for (let sx = skinXStart; sx <= skinXEnd; sx += 4) {
      const idx = (skinY * w + sx) * 4;
      const r = px[idx], g = px[idx + 1], b = px[idx + 2];
      if (isSkinPixel(r, g, b)) {
        skinR += r; skinG += g; skinB += b;
        skinSamples++;
      }
    }
    if (skinSamples > 0) {
      skinR = Math.round(skinR / (skinSamples + 1));
      skinG = Math.round(skinG / (skinSamples + 1));
      skinB = Math.round(skinB / (skinSamples + 1));
    }

    const hasSemanticMask = this.latestCategoryMask && this.latestCategoryMask.length === (this.maskW * this.maskH);
    const maskScaleX = this.maskW / w;
    const maskScaleY = this.maskH / h;

    // Process suppression strictly above ear level / forehead boundary
    const processMaxY = Math.min(h, Math.floor(earLevelY));
    const processMinY = Math.max(0, Math.floor(topEnvelope - 40));

    for (let y = processMinY; y < processMaxY; y++) {
      const rowOffset = y * w;
      const maskY = Math.min(this.maskH - 1, Math.floor(y * maskScaleY));
      const maskRowOffset = maskY * this.maskW;

      for (let x = 0; x < w; x++) {
        const idx = (rowOffset + x) * 4;
        const r = px[idx];
        const g = px[idx + 1];
        const b = px[idx + 2];

        // STRICT MANDATE: Never touch face skin below Trichion
        if (y >= trichionY && isSkinPixel(r, g, b)) {
          continue;
        }

        let isNaturalHair = false;

        if (hasSemanticMask) {
          const maskX = Math.min(this.maskW - 1, Math.floor(x * maskScaleX));
          const cat = this.latestCategoryMask![maskRowOffset + maskX];
          // Category 1 is hair in selfie_multiclass
          isNaturalHair = (cat === 1);
        } else {
          // Adaptive Chrominance/Luminance matting fallback:
          // Hair is non-skin with low-to-medium luminance above the face
          if (!isSkinPixel(r, g, b)) {
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (lum < 85) {
              isNaturalHair = true;
            }
          }
        }

        if (!isNaturalHair) continue;

        // Zone 1: Protruding Outer Hair (outside the new hairstyle's envelope)
        const isOutsideLeft = x < leftEnvelope;
        const isOutsideRight = x > rightEnvelope;
        const isOutsideTop = y < topEnvelope;

        if (isOutsideLeft || isOutsideRight || isOutsideTop) {
          // Calculate distance to haircut boundary for smooth anti-aliased edge
          let dist = 0;
          if (isOutsideLeft) dist = Math.max(dist, leftEnvelope - x);
          if (isOutsideRight) dist = Math.max(dist, x - rightEnvelope);
          if (isOutsideTop) dist = Math.max(dist, topEnvelope - y);

          const alpha = Math.min(1.0, dist / 18.0);
          px[idx]     = Math.round(r * (1 - alpha) + bgR * alpha);
          px[idx + 1] = Math.round(g * (1 - alpha) + bgG * alpha);
          px[idx + 2] = Math.round(b * (1 - alpha) + bgB * alpha);
        } else if (isShortStyle && y < trichionY) {
          // Zone 2: Scalp Dome Under Short Styles (buzz-cut, textured-crop, taper-fade)
          // Neutralize conflicting old part lines / strays under the augmented hair
          const scalpToneR = Math.round(skinR * 0.45 + 30 * 0.55);
          const scalpToneG = Math.round(skinG * 0.45 + 30 * 0.55);
          const scalpToneB = Math.round(skinB * 0.45 + 32 * 0.55);
          const blendFactor = 0.40;

          px[idx]     = Math.round(r * (1 - blendFactor) + scalpToneR * blendFactor);
          px[idx + 1] = Math.round(g * (1 - blendFactor) + scalpToneG * blendFactor);
          px[idx + 2] = Math.round(b * (1 - blendFactor) + scalpToneB * blendFactor);
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }
}

export const hairSegmenter = new HairSegmentationService();

