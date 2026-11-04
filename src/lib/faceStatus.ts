// ══════════════════════════════════════════════════════════════════════════════
// src/lib/faceStatus.ts
// SINGLE SOURCE OF TRUTH: FACE TRACKING STATE MACHINE & CAPTURE GATE
// ══════════════════════════════════════════════════════════════════════════════
// Reconciles live tracking, the HUD pill, the visual guide oval, and the capture
// gate so they ALWAYS read the same value and never contradict each other.
//
// States:
//   - NO_FACE: No face detected in frame (HARD FAIL on capture)
//   - TOO_FAR: Face width < 22% of container width (SOFT WARNING)
//   - TOO_CLOSE: Face width > 75% of container width (SOFT WARNING)
//   - OFF_CENTER: Face center outside ±18% Wc / ±22% Hc of oval center (SOFT WARNING)
//   - BAD_POSE: Head turned or tilted beyond ±25° yaw / ±20° pitch / ±20° roll (SOFT WARNING)
//   - TOO_DARK: Mean face luminance < 60 (SOFT WARNING)
//   - TOO_BRIGHT: Mean face luminance > 215 (SOFT WARNING)
//   - OK: All criteria met (PERFECT / READY TO CAPTURE)
// ══════════════════════════════════════════════════════════════════════════════

import { DEBUG_CAPTURE } from '@/constants/flags';
import type { CoverTransform } from './coverTransform';

export type FaceStatusCode =
  | 'NO_FACE'
  | 'TOO_FAR'
  | 'TOO_CLOSE'
  | 'OFF_CENTER'
  | 'BAD_POSE'
  | 'TOO_DARK'
  | 'TOO_BRIGHT'
  | 'OK';

export interface GuideOvalGeometry {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface ContainerBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface DiagnosticMetrics {
  source: 'mediapipe_video' | 'mediapipe_image' | 'mediapipe_local' | 'browser_facedetector' | 'pure_js_anatomical';
  isRealLandmarks: boolean;
  isEstimated: boolean;
  videoNormalizedBBox: { uMin: number; vMin: number; uMax: number; vMax: number };
  containerBBox: ContainerBBox;
  ovalGeometry: GuideOvalGeometry;
  faceWidthPct: number;   // % of container width
  faceHeightPct: number;  // % of container height
  centerDeltaXPx: number;
  centerDeltaYPx: number;
  maxAllowedDeltaXPx: number;
  maxAllowedDeltaYPx: number;
  yawDeg: number;
  pitchDeg: number;
  rollDeg: number;
  meanLuminance: number;
  failingRule: string | null;
}

export interface FaceStatusEvaluation {
  code: FaceStatusCode;
  isOk: boolean;
  isSoftWarning: boolean;
  statusPillText: string;
  guidanceText: string;
  ovalColor: string;
  ovalStrokeDasharray?: string;
  ovalStrokeWidth: number;
  metrics: DiagnosticMetrics;
}

/**
 * Computes canonical guide oval coordinates in container CSS pixels.
 * Oval is centered at ~46% of container height, width ~62% of container width.
 */
export function getGuideOvalGeometry(
  containerWidth: number,
  containerHeight: number
): GuideOvalGeometry {
  const Wc = Math.max(1, containerWidth);
  const Hc = Math.max(1, containerHeight);

  const centerX = Wc * 0.5;
  const centerY = Hc * 0.46;
  const width = Math.min(Wc * 0.62, 280);
  const height = width * 1.35; // Aspect ratio ~1:1.35 (natural head proportion)

  const left = centerX - width * 0.5;
  const top = centerY - height * 0.5;

  return {
    centerX,
    centerY,
    width,
    height,
    left,
    top,
    right: left + width,
    bottom: top + height,
  };
}

export class FaceStatusTracker {
  private consecutiveOkCount = 0;
  private consecutiveFailCount = 0;
  private smoothedBBox: ContainerBBox | null = null;
  private currentLatchedStatus: FaceStatusCode = 'NO_FACE';

  reset() {
    this.consecutiveOkCount = 0;
    this.consecutiveFailCount = 0;
    this.smoothedBBox = null;
    this.currentLatchedStatus = 'NO_FACE';
  }

  evaluate(
    landmarks: Array<{ x: number; y: number; z?: number }> | null | undefined,
    transform: CoverTransform,
    source: 'mediapipe_video' | 'mediapipe_image' | 'mediapipe_local' | 'browser_facedetector' | 'pure_js_anatomical' = 'mediapipe_video',
    pixelData?: Uint8ClampedArray | Uint8Array,
    frameWidth?: number,
    frameHeight?: number
  ): FaceStatusEvaluation {
    const Wc = transform.containerWidth;
    const Hc = transform.containerHeight;
    const oval = getGuideOvalGeometry(Wc, Hc);

    const hasLandmarks = Boolean(landmarks && Array.isArray(landmarks) && landmarks.length >= 10);
    const isRealLandmarks = source !== 'pure_js_anatomical';

    if (!hasLandmarks || !landmarks) {
      this.consecutiveOkCount = 0;
      this.consecutiveFailCount++;
      this.currentLatchedStatus = 'NO_FACE';

      const defaultMetrics: DiagnosticMetrics = {
        source,
        isRealLandmarks: false,
        isEstimated: true,
        videoNormalizedBBox: { uMin: 0, vMin: 0, uMax: 0, vMax: 0 },
        containerBBox: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 },
        ovalGeometry: oval,
        faceWidthPct: 0,
        faceHeightPct: 0,
        centerDeltaXPx: 0,
        centerDeltaYPx: 0,
        maxAllowedDeltaXPx: Wc * 0.18,
        maxAllowedDeltaYPx: Hc * 0.22,
        yawDeg: 0,
        pitchDeg: 0,
        rollDeg: 0,
        meanLuminance: 128,
        failingRule: 'NO_FACE',
      };

      return {
        code: 'NO_FACE',
        isOk: false,
        isSoftWarning: false,
        statusPillText: 'ALIGN FACE IN GOLDEN OVAL',
        guidanceText: 'Position your face in front of the camera',
        ovalColor: 'rgba(255, 255, 255, 0.70)',
        ovalStrokeDasharray: '4 6',
        ovalStrokeWidth: 1.5,
        metrics: defaultMetrics,
      };
    }

    // ── 1. Map key landmarks to container CSS px via CoverTransform ──
    const pt10  = landmarks[10]  || landmarks[0];
    const pt152 = landmarks[152] || landmarks[Math.min(152, landmarks.length - 1)];
    const pt234 = landmarks[234] || landmarks[Math.min(234, landmarks.length - 1)];
    const pt454 = landmarks[454] || landmarks[Math.min(454, landmarks.length - 1)];
    const pt1   = landmarks[1]   || landmarks[Math.min(1, landmarks.length - 1)];
    const pt127 = landmarks[127] || pt234;
    const pt356 = landmarks[356] || pt454;
    const pt151 = landmarks[151] || pt1;
    const pt33  = landmarks[33]  || pt127;
    const pt263 = landmarks[263] || pt356;

    // Transform points to container CSS pixels
    const p10  = transform.transformPoint(pt10.x, pt10.y);
    const p152 = transform.transformPoint(pt152.x, pt152.y);
    const p234 = transform.transformPoint(pt234.x, pt234.y);
    const p454 = transform.transformPoint(pt454.x, pt454.y);
    const p1   = transform.transformPoint(pt1.x, pt1.y);
    const p127 = transform.transformPoint(pt127.x, pt127.y);
    const p356 = transform.transformPoint(pt356.x, pt356.y);
    const p151 = transform.transformPoint(pt151.x, pt151.y);
    const p33  = transform.transformPoint(pt33.x, pt33.y);
    const p263 = transform.transformPoint(pt263.x, pt263.y);

    // Compute raw container bounding box
    const xCoords = [p10.x, p152.x, p234.x, p454.x, p1.x, p127.x, p356.x];
    const yCoords = [p10.y, p152.y, p234.y, p454.y, p1.y, p127.y, p356.y];

    const rawMinX = Math.min(...xCoords);
    const rawMaxX = Math.max(...xCoords);
    const rawMinY = Math.min(...yCoords);
    const rawMaxY = Math.max(...yCoords);

    // Apply EMA smoothing (alpha = 0.35)
    let bbox: ContainerBBox;
    if (!this.smoothedBBox) {
      bbox = {
        minX: rawMinX,
        minY: rawMinY,
        maxX: rawMaxX,
        maxY: rawMaxY,
        width: rawMaxX - rawMinX,
        height: rawMaxY - rawMinY,
        centerX: (rawMinX + rawMaxX) * 0.5,
        centerY: (rawMinY + rawMaxY) * 0.5,
      };
    } else {
      const a = 0.35;
      const sMinX = this.smoothedBBox.minX * (1 - a) + rawMinX * a;
      const sMaxX = this.smoothedBBox.maxX * (1 - a) + rawMaxX * a;
      const sMinY = this.smoothedBBox.minY * (1 - a) + rawMinY * a;
      const sMaxY = this.smoothedBBox.maxY * (1 - a) + rawMaxY * a;
      bbox = {
        minX: sMinX,
        minY: sMinY,
        maxX: sMaxX,
        maxY: sMaxY,
        width: sMaxX - sMinX,
        height: sMaxY - sMinY,
        centerX: (sMinX + sMaxX) * 0.5,
        centerY: (sMinY + sMaxY) * 0.5,
      };
    }
    this.smoothedBBox = bbox;

    // ── 2. Calculate angles and scale in container space ──
    const faceWidthPct = Math.round((bbox.width / Wc) * 100);
    const faceHeightPct = Math.round((bbox.height / Hc) * 100);

    const centerDeltaXPx = Math.abs(bbox.centerX - oval.centerX);
    const centerDeltaYPx = Math.abs(bbox.centerY - oval.centerY);
    // Relaxed centering tolerance: ±25% width / ±30% height from oval center
    const maxAllowedDeltaXPx = Wc * 0.25;
    const maxAllowedDeltaYPx = Hc * 0.30;

    // Roll angle: inter-ocular line (landmarks 33 -> 263), accounting for mirroring and wrapped to [-90, 90]
    let dxEyes = p263.x - p33.x;
    const dyEyes = p263.y - p33.y;
    if (transform.isMirrored) {
      dxEyes = -dxEyes;
    }
    const rollRad = Math.atan2(dyEyes, dxEyes);
    let rawRollDeg = (rollRad * 180) / Math.PI;
    while (rawRollDeg > 90) rawRollDeg -= 180;
    while (rawRollDeg < -90) rawRollDeg += 180;
    const rollDeg = Math.round(rawRollDeg);

    // Yaw angle
    const distCheekL = Math.abs(p454.x - p1.x);
    const distCheekR = Math.abs(p1.x - p234.x);
    const cheekSum = distCheekL + distCheekR || 0.001;
    const yawDeg = Math.round(((distCheekL - distCheekR) / cheekSum) * 45);

    // Pitch angle
    const distBrowNose = Math.abs(p1.y - p151.y);
    const distNoseChin = Math.abs(p152.y - p1.y);
    const pitchDeg = Math.round(((distBrowNose - distNoseChin * 0.70) / (bbox.height || 1)) * 35);

    // Luminance
    let meanLuminance = 128;
    if (pixelData && frameWidth && frameHeight && pixelData.length >= frameWidth * frameHeight * 4) {
      // Sample video-normalized rect
      const u1 = Math.max(0, Math.min(1, pt234.x));
      const u2 = Math.max(0, Math.min(1, pt454.x));
      const v1 = Math.max(0, Math.min(1, pt10.y));
      const v2 = Math.max(0, Math.min(1, pt152.y));

      const px1 = Math.floor(Math.min(u1, u2) * frameWidth);
      const px2 = Math.floor(Math.max(u1, u2) * frameWidth);
      const py1 = Math.floor(Math.min(v1, v2) * frameHeight);
      const py2 = Math.floor(Math.max(v1, v2) * frameHeight);

      let sum = 0;
      let count = 0;
      const step = Math.max(2, Math.floor((px2 - px1) / 16));
      for (let y = py1; y <= py2; y += step) {
        for (let x = px1; x <= px2; x += step) {
          const idx = (y * frameWidth + x) * 4;
          sum += 0.299 * pixelData[idx] + 0.587 * pixelData[idx + 1] + 0.114 * pixelData[idx + 2];
          count++;
        }
      }
      if (count > 0) meanLuminance = Math.round(sum / count);
    }

    // ── 3. Rule Evaluation (Lenient & Stable) ──
    let rawCode: FaceStatusCode = 'OK';
    let failingRule: string | null = null;

    if (faceWidthPct < 22) {
      rawCode = 'TOO_FAR';
      failingRule = `Face width ${faceWidthPct}% < 22% Wc`;
    } else if (faceWidthPct > 75) {
      rawCode = 'TOO_CLOSE';
      failingRule = `Face width ${faceWidthPct}% > 75% Wc`;
    } else if (centerDeltaXPx > maxAllowedDeltaXPx || centerDeltaYPx > maxAllowedDeltaYPx) {
      rawCode = 'OFF_CENTER';
      failingRule = `Center delta (${Math.round(centerDeltaXPx)}px, ${Math.round(centerDeltaYPx)}px) exceeds allowed (${Math.round(maxAllowedDeltaXPx)}px, ${Math.round(maxAllowedDeltaYPx)}px)`;
    } else if (Math.abs(yawDeg) > 25 || Math.abs(pitchDeg) > 20 || Math.abs(rollDeg) > 20) {
      rawCode = 'BAD_POSE';
      failingRule = `Pose angles (|yaw|=${Math.abs(yawDeg)}°, |pitch|=${Math.abs(pitchDeg)}°, |roll|=${Math.abs(rollDeg)}°) exceed limit`;
    } else if (meanLuminance < 60) {
      rawCode = 'TOO_DARK';
      failingRule = `Luminance ${meanLuminance} < 60`;
    } else if (meanLuminance > 215) {
      rawCode = 'TOO_BRIGHT';
      failingRule = `Luminance ${meanLuminance} > 215`;
    }

    // ── 4. Hysteresis (for live video tracking; immediate for static capture) ──
    const isStaticEvaluation = source === 'mediapipe_image' || source === 'mediapipe_local' || source === 'pure_js_anatomical';
    let finalCode: FaceStatusCode;
    if (isStaticEvaluation) {
      finalCode = rawCode;
      this.currentLatchedStatus = rawCode;
    } else if (rawCode === 'OK') {
      this.consecutiveOkCount++;
      this.consecutiveFailCount = 0;
      if (this.consecutiveOkCount >= 4) {
        this.currentLatchedStatus = 'OK';
      }
      finalCode = this.currentLatchedStatus;
    } else {
      this.consecutiveFailCount++;
      this.consecutiveOkCount = 0;
      if (this.consecutiveFailCount >= 6 || this.currentLatchedStatus === 'NO_FACE') {
        this.currentLatchedStatus = rawCode;
      }
      finalCode = this.currentLatchedStatus;
    }

    const isOk = finalCode === 'OK';
    const isSoftWarning = !isOk && finalCode !== 'NO_FACE';

    const rawU = [pt10.x, pt152.x, pt234.x, pt454.x];
    const rawV = [pt10.y, pt152.y, pt234.y, pt454.y];
    const metrics: DiagnosticMetrics = {
      source,
      isRealLandmarks,
      isEstimated: !isRealLandmarks,
      videoNormalizedBBox: {
        uMin: Math.min(...rawU),
        vMin: Math.min(...rawV),
        uMax: Math.max(...rawU),
        vMax: Math.max(...rawV),
      },
      containerBBox: bbox,
      ovalGeometry: oval,
      faceWidthPct,
      faceHeightPct,
      centerDeltaXPx: Math.round(centerDeltaXPx),
      centerDeltaYPx: Math.round(centerDeltaYPx),
      maxAllowedDeltaXPx: Math.round(maxAllowedDeltaXPx),
      maxAllowedDeltaYPx: Math.round(maxAllowedDeltaYPx),
      yawDeg,
      pitchDeg,
      rollDeg,
      meanLuminance,
      failingRule,
    };

    if (DEBUG_CAPTURE) {
      console.log(
        `[FaceStatus] ${finalCode} (raw: ${rawCode}) | W=${faceWidthPct}% [22..75] | dX=${Math.round(centerDeltaXPx)}/${Math.round(maxAllowedDeltaXPx)} dY=${Math.round(centerDeltaYPx)}/${Math.round(maxAllowedDeltaYPx)} | Y=${yawDeg}° P=${pitchDeg}° R=${rollDeg}° | Lum=${meanLuminance} | ${source}`
      );
    }

    // Guidance and presentation strings
    let statusPillText = 'FACE LOCKED · READY TO SCAN';
    let guidanceText = 'Perfect alignment — Tap capture';
    let ovalColor = '#10B981'; // Green solid
    let ovalStrokeDasharray: string | undefined = undefined;
    let ovalStrokeWidth = 2.0;

    switch (finalCode) {
      case 'TOO_FAR':
        statusPillText = 'MOVE A LITTLE CLOSER';
        guidanceText = 'Move a little closer to frame';
        ovalColor = 'rgba(255, 255, 255, 0.85)';
        ovalStrokeDasharray = '4 6';
        ovalStrokeWidth = 1.5;
        break;
      case 'TOO_CLOSE':
        statusPillText = 'MOVE BACK A LITTLE';
        guidanceText = 'Move back slightly to fit shoulders';
        ovalColor = 'rgba(255, 255, 255, 0.85)';
        ovalStrokeDasharray = '4 6';
        ovalStrokeWidth = 1.5;
        break;
      case 'OFF_CENTER':
        statusPillText = 'CENTER YOUR FACE';
        guidanceText = 'Center your face within the oval';
        ovalColor = 'rgba(255, 255, 255, 0.85)';
        ovalStrokeDasharray = '4 6';
        ovalStrokeWidth = 1.5;
        break;
      case 'BAD_POSE':
        statusPillText = 'LOOK DIRECTLY AT CAMERA';
        guidanceText = 'Face the camera directly';
        ovalColor = 'rgba(255, 255, 255, 0.85)';
        ovalStrokeDasharray = '4 6';
        ovalStrokeWidth = 1.5;
        break;
      case 'TOO_DARK':
        statusPillText = 'MORE LIGHT NEEDED';
        guidanceText = 'Move into better lighting';
        ovalColor = 'rgba(255, 255, 255, 0.85)';
        ovalStrokeDasharray = '4 6';
        ovalStrokeWidth = 1.5;
        break;
      case 'TOO_BRIGHT':
        statusPillText = 'REDUCE GLARE';
        guidanceText = 'Avoid strong backlighting';
        ovalColor = 'rgba(255, 255, 255, 0.85)';
        ovalStrokeDasharray = '4 6';
        ovalStrokeWidth = 1.5;
        break;
      case 'OK':
      default:
        statusPillText = 'FACE LOCKED · READY TO SCAN';
        guidanceText = 'Ready to scan — Press capture';
        ovalColor = '#10B981'; // Green solid
        ovalStrokeDasharray = undefined;
        ovalStrokeWidth = 2.2;
        break;
    }

    return {
      code: finalCode,
      isOk,
      isSoftWarning,
      statusPillText,
      guidanceText,
      ovalColor,
      ovalStrokeDasharray,
      ovalStrokeWidth,
      metrics,
    };
  }
}

// Global shared singleton for tracking hysteresis across renders
export const globalFaceStatusTracker = new FaceStatusTracker();
