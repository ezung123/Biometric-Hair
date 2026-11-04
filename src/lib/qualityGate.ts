// ══════════════════════════════════════════════════════════════════════════════
// src/lib/qualityGate.ts
// CAPTURE QUALITY GATE — DELEGATES TO UNIFIED FACE STATUS ENGINE
// ══════════════════════════════════════════════════════════════════════════════
// Ensures that the capture gate and the live HUD/oval always share the exact
// same source of truth and lenient criteria.
//
// Invariants:
// 1. Never blocks with a modal over the face.
// 2. Soft rule failures (TOO_FAR, TOO_CLOSE, OFF_CENTER, BAD_POSE, TOO_DARK, TOO_BRIGHT)
//    do NOT block capture: they return passed: true with isSoftWarning: true.
// 3. Only NO_FACE results in passed: false (hard fail).
// ══════════════════════════════════════════════════════════════════════════════

import {
  globalFaceStatusTracker,
  type FaceStatusEvaluation,
  type FaceStatusCode,
  type DiagnosticMetrics,
} from './faceStatus';
import { createCoverTransform, CoverTransform } from './coverTransform';

export type QualityGateFailureReason = FaceStatusCode;

export interface QualityGateResult {
  passed: boolean;
  isSoftWarning: boolean;
  code: FaceStatusCode;
  reason?: QualityGateFailureReason;
  guidanceTitle: string;
  guidanceMessage: string;
  actionLabel: string;
  evaluation: FaceStatusEvaluation;
  metrics: DiagnosticMetrics;
}

/**
 * Validates a captured frame using the single source of truth faceStatus engine.
 */
export function evaluateCaptureQuality(
  landmarks: Array<{ x: number; y: number; z?: number }> | null | undefined,
  frameWidth: number,
  frameHeight: number,
  pixelData?: Uint8ClampedArray | Uint8Array,
  containerWidth?: number,
  containerHeight?: number,
  isMirrored = false,
  source: 'mediapipe_video' | 'mediapipe_image' | 'mediapipe_local' | 'browser_facedetector' | 'pure_js_anatomical' = 'mediapipe_image'
): QualityGateResult {
  const cWidth = containerWidth || frameWidth || 800;
  const cHeight = containerHeight || frameHeight || 1000;

  const transform = createCoverTransform({
    videoWidth: frameWidth || 640,
    videoHeight: frameHeight || 480,
    containerWidth: cWidth,
    containerHeight: cHeight,
    isMirrored,
  });

  const evaluation = globalFaceStatusTracker.evaluate(
    landmarks,
    transform,
    source,
    pixelData,
    frameWidth,
    frameHeight
  );

  // Soft rules do NOT block capture — only NO_FACE is a hard failure
  const isHardFail = evaluation.code === 'NO_FACE';
  const passed = !isHardFail;
  const isSoftWarning = evaluation.isSoftWarning;

  let guidanceTitle = 'Frame Qualified';
  let guidanceMessage = 'Capture quality meets clinical standards.';
  let actionLabel = 'Proceed';

  switch (evaluation.code) {
    case 'NO_FACE':
      guidanceTitle = 'No Face Detected';
      guidanceMessage = 'Please position yourself in front of the camera with good lighting.';
      actionLabel = 'Retake Photo';
      break;
    case 'TOO_FAR':
      guidanceTitle = 'Move Closer';
      guidanceMessage = 'Your face is a bit far from the camera. Move closer for optimal biometric precision.';
      actionLabel = 'Retake';
      break;
    case 'TOO_CLOSE':
      guidanceTitle = 'Move Back';
      guidanceMessage = 'Your face fills too much of the frame. Move back slightly to capture your shoulder line.';
      actionLabel = 'Retake';
      break;
    case 'OFF_CENTER':
      guidanceTitle = 'Center Face';
      guidanceMessage = 'Align your head closer to the center guide oval for symmetrical styling.';
      actionLabel = 'Retake';
      break;
    case 'BAD_POSE':
      guidanceTitle = 'Face Forward';
      guidanceMessage = 'Looking straight at the lens gives the most accurate cephalometric proportions.';
      actionLabel = 'Retake';
      break;
    case 'TOO_DARK':
      guidanceTitle = 'More Light Needed';
      guidanceMessage = 'The scene is slightly dim. A well-lit room produces the most photorealistic hair.';
      actionLabel = 'Retake';
      break;
    case 'TOO_BRIGHT':
      guidanceTitle = 'Reduce Glare';
      guidanceMessage = 'Strong glare or backlighting detected.';
      actionLabel = 'Retake';
      break;
    case 'OK':
    default:
      guidanceTitle = 'Frame Qualified';
      guidanceMessage = 'Capture quality meets clinical standards.';
      actionLabel = 'Proceed';
      break;
  }

  return {
    passed,
    isSoftWarning,
    code: evaluation.code,
    reason: isHardFail ? 'NO_FACE' : undefined,
    guidanceTitle,
    guidanceMessage,
    actionLabel,
    evaluation,
    metrics: evaluation.metrics,
  };
}
