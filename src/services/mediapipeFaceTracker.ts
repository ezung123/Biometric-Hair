// ==============================================================================
// mediapipeFaceTracker: Production 3D Head Tracking Engine
// Bypasses Metro dynamic-import limitation by loading MediaPipe FaceMesh
// via browser script injection, while providing synchronous YCbCr fallback.
// - 468 3D Facial Landmarks (Hairline, Temples, Nose, Chin)
// - 6-DOF Real-Time Head Rotations (Pitch, Yaw, Roll, Depth Z)
// ==============================================================================

import { detectHairlineDecisionBoundary } from './hairlineDetector';

export interface FaceTracking3D {
  detected: boolean;
  centerPctX: number;    // 0 - 100%
  hairlinePctY: number;  // 0 - 100%
  skullWidthPx: number;  // Screen pixels
  pitchRad: number;      // Pitch (looking up/down in radians)
  yawRad: number;        // Yaw (turning left/right in radians)
  rollRad: number;       // Roll (tilting ear-to-shoulder in radians)
  depthZ: number;        // 3D relative depth
  confidence: number;
  landmarks?: any;
}

let faceMeshInstance: any = null;
let isInitializing = false;
let lastMediaPipeResult: FaceTracking3D | null = null;
let isProcessingFrame = false;

export async function initMediaPipe(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (faceMeshInstance) return true;
  if (isInitializing) return false;

  isInitializing = true;

  try {
    let FaceMeshClass = (window as any).FaceMesh;

    if (!FaceMeshClass) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js';
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
      });
      FaceMeshClass = (window as any).FaceMesh;
    }

    if (!FaceMeshClass) {
      console.warn('[FaceTracker] FaceMesh class not found on window');
      isInitializing = false;
      return false;
    }

    const faceMesh = new FaceMeshClass({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results: any) => {
      isProcessingFrame = false;
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Landmark 10  = Trichion (hairline center)
        // Landmark 151 = Forehead glabella
        // Landmark 152 = Gnathion (chin base)
        // Landmark 103 = Subject right frontotemporal crest (cranial pivot anchor)
        // Landmark 332 = Subject left frontotemporal crest (cranial pivot anchor)
        // Landmark 127 = Subject right zygomatic/bitemporal boundary
        // Landmark 356 = Subject left zygomatic/bitemporal boundary
        // Landmark 1   = Nose tip
        const ptHairline = landmarks[10];
        const ptChin = landmarks[152];
        const ptRightCrest = landmarks[103] || landmarks[127];
        const ptLeftCrest = landmarks[332] || landmarks[356];
        const ptLeftTemple = landmarks[127];
        const ptRightTemple = landmarks[356];
        const ptNose = landmarks[1];

        // 1. True Cranial Vault Center anchored to frontotemporal crest midpoint (prevents yaw detachment)
        const cranialCenterX = (ptRightCrest.x + ptLeftCrest.x) * 0.5;
        // In mirrored front camera view:
        const mirroredCenterX = (1 - cranialCenterX) * 100;

        // 2. Anatomical Hairline Line
        const hairlineY = ptHairline.y * 100;

        // 3. Dynamic Bitemporal / Bizygomatic Skull Width Normalization
        // Distance between Landmark 127 and Landmark 356
        const bitemporalDist = Math.hypot(ptRightTemple.x - ptLeftTemple.x, ptRightTemple.y - ptLeftTemple.y);
        const skullWidthPx = Math.max(160, Math.min(520, bitemporalDist * (window.innerWidth || 1200) * 1.35));

        // 4. 3D Yaw Rotation (Turn Left/Right in mirrored coordinates)
        const midCrestX = (ptRightCrest.x + ptLeftCrest.x) * 0.5;
        const yawDisplacement = (ptNose.x - midCrestX) / (bitemporalDist || 0.1);
        const yawRad = Math.max(-0.75, Math.min(0.75, yawDisplacement * 1.35));

        // 5. 3D Pitch Rotation (Tilt Up/Down)
        const faceHeightNorm = Math.abs(ptChin.y - ptHairline.y) || 0.3;
        const midCrestY = (ptRightCrest.y + ptLeftCrest.y) * 0.5;
        const pitchOffset = (ptNose.y - midCrestY) / faceHeightNorm;
        const pitchRad = Math.max(-0.60, Math.min(0.60, (pitchOffset - 0.42) * 1.50));

        // 6. 3D Roll Rotation (Tilt ear-to-shoulder)
        const rollRad = Math.atan2(ptLeftCrest.y - ptRightCrest.y, ptLeftCrest.x - ptRightCrest.x);

        lastMediaPipeResult = {
          detected: true,
          centerPctX: mirroredCenterX,
          hairlinePctY: hairlineY,
          skullWidthPx,
          pitchRad,
          yawRad,
          rollRad,
          depthZ: -ptNose.z * 100,
          confidence: 0.98,
          landmarks,
        };
      }
    });

    faceMeshInstance = faceMesh;
    isInitializing = false;
    return true;
  } catch (err) {
    console.warn('[FaceTracker] MediaPipe script initialization error (using fallback):', err);
    isInitializing = false;
    return false;
  }
}

export function trackHeadPose3D(
  video: HTMLVideoElement,
  fallbackCanvas: HTMLCanvasElement,
  viewportWidth: number
): FaceTracking3D {
  const defaultResult: FaceTracking3D = {
    detected: false,
    centerPctX: 50.0,
    hairlinePctY: 28.0,
    skullWidthPx: 270,
    pitchRad: 0,
    yawRad: 0,
    rollRad: 0,
    depthZ: 0,
    confidence: 0,
  };

  if (!video || video.paused || video.ended || video.videoWidth === 0) {
    return defaultResult;
  }

  // Send video frame to MediaPipe if ready
  if (faceMeshInstance && !isProcessingFrame) {
    try {
      isProcessingFrame = true;
      faceMeshInstance.send({ image: video });
    } catch (e) {
      isProcessingFrame = false;
    }
  }

  // If recent MediaPipe result is available, return it
  if (lastMediaPipeResult && lastMediaPipeResult.detected) {
    return lastMediaPipeResult;
  }

  // Synchronous YCbCr Biometric Fallback (only invoked if MediaPipe has no ready result)
  const ctx = fallbackCanvas.getContext('2d', { willReadFrequently: true });
  if (ctx) {
    // If canvas already has frame drawn by caller, directly run detection
    const result = detectHairlineDecisionBoundary(fallbackCanvas);
    if (result.detected) {
      return {
        detected: true,
        centerPctX: result.centerPctX,
        hairlinePctY: result.hairlinePctY,
        skullWidthPx: (result.skullWidthPct / 100) * viewportWidth * 1.30,
        pitchRad: result.pitchRad,
        yawRad: result.yawRad,
        rollRad: result.rollRad,
        depthZ: 0,
        confidence: result.confidence,
        landmarks: result.landmarks,
      };
    }
  }

  return defaultResult;
}
