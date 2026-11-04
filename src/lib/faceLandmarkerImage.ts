// ══════════════════════════════════════════════════════════════════════════════
// src/lib/faceLandmarkerImage.ts
// STEP 1: LOCAL MEDIAPIPE IMAGE-MODE LANDMARKER
// ══════════════════════════════════════════════════════════════════════════════
// Runs FaceLandmarker in IMAGE mode on frozen capture frames using local WASM
// assets from /mediapipe/wasm. Zero external CDN dependencies.
// Seamless fallback to pure-JS anatomical locator (<5ms).
// ══════════════════════════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import { locateFaceAnatomical } from '@/services/anatomicalFaceLocator';

export interface ImageDetectionResult {
  detected: boolean;
  landmarks: Array<{ x: number; y: number; z?: number }>;
  pixelData?: Uint8ClampedArray;
  width: number;
  height: number;
  source: 'mediapipe_local' | 'browser_facedetector' | 'pure_js_anatomical';
  latencyMs: number;
}

let imageLandmarkerInstance: any = null;
let isInitializing = false;

async function getImageLandmarker() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  if (imageLandmarkerInstance) return imageLandmarkerInstance;
  if (isInitializing) return null;

  isInitializing = true;
  try {
    const vision = await import('@mediapipe/tasks-vision');
    const FilesetResolver = vision.FilesetResolver;
    const FaceLandmarker = vision.FaceLandmarker;

    const filesetResolver = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
    imageLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: '/mediapipe/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: true,
    });
    isInitializing = false;
    return imageLandmarkerInstance;
  } catch (err) {
    console.warn('[FaceLandmarkerImage] Local MediaPipe init error (will use anatomical fallback):', err);
    isInitializing = false;
    return null;
  }
}

/**
 * Detects 468 landmarks on a static image URI or Canvas buffer in IMAGE mode.
 * If initial full-frame detection fails but live landmarks are provided,
 * retries once on a padded crop around the live bbox before falling back.
 */
export async function detectLandmarksOnFrozenFrame(
  imageUri: string,
  liveLandmarksFallback?: Array<{ x: number; y: number; z?: number }>
): Promise<ImageDetectionResult> {
  const t0 = Date.now();

  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      const fallback = locateFaceAnatomical(new Uint8ClampedArray(96 * 72 * 4), 96, 72);
      resolve({
        detected: false,
        landmarks: fallback.landmarks,
        width: 800,
        height: 1000,
        source: 'pure_js_anatomical',
        latencyMs: 1,
      });
      return;
    }

    const img = new (window as any).Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      const w = img.naturalWidth || img.width || 800;
      const h = img.naturalHeight || img.height || 1000;

      // Extract pixel data via offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      let pixelData: Uint8ClampedArray | undefined;

      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        try {
          const imgData = ctx.getImageData(0, 0, w, h);
          pixelData = imgData.data;
        } catch {
          // CORS safety
        }
      }

      // Tier 1: Try Local MediaPipe FaceLandmarker in IMAGE mode
      try {
        const landmarker = await getImageLandmarker();
        if (landmarker) {
          const results = landmarker.detect(img);
          if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
            resolve({
              detected: true,
              landmarks: results.faceLandmarks[0],
              pixelData,
              width: w,
              height: h,
              source: 'mediapipe_local',
              latencyMs: Date.now() - t0,
            });
            return;
          }

          // Retry on padded crop around live landmarks bbox if full-frame detection was ambiguous
          if (liveLandmarksFallback && liveLandmarksFallback.length >= 10 && ctx) {
            try {
              const uCoords = liveLandmarksFallback.map((p) => p.x);
              const vCoords = liveLandmarksFallback.map((p) => p.y);
              const minU = Math.max(0, Math.min(...uCoords) - 0.10);
              const maxU = Math.min(1, Math.max(...uCoords) + 0.10);
              const minV = Math.max(0, Math.min(...vCoords) - 0.15);
              const maxV = Math.min(1, Math.max(...vCoords) + 0.10);

              const cropX = Math.floor(minU * w);
              const cropY = Math.floor(minV * h);
              const cropW = Math.max(10, Math.floor((maxU - minU) * w));
              const cropH = Math.max(10, Math.floor((maxV - minV) * h));

              const cropCanvas = document.createElement('canvas');
              cropCanvas.width = cropW;
              cropCanvas.height = cropH;
              const cropCtx = cropCanvas.getContext('2d');
              if (cropCtx) {
                cropCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
                const cropResults = landmarker.detect(cropCanvas);
                if (cropResults && cropResults.faceLandmarks && cropResults.faceLandmarks.length > 0) {
                  // Map crop-relative landmarks back to full frame
                  const cropLm = cropResults.faceLandmarks[0];
                  const remappedLm = cropLm.map((p: any) => ({
                    x: minU + p.x * (cropW / w),
                    y: minV + p.y * (cropH / h),
                    z: p.z,
                  }));

                  resolve({
                    detected: true,
                    landmarks: remappedLm,
                    pixelData,
                    width: w,
                    height: h,
                    source: 'mediapipe_local',
                    latencyMs: Date.now() - t0,
                  });
                  return;
                }
              }
            } catch (cropErr) {
              console.warn('[FaceLandmarkerImage] Crop retry error:', cropErr);
            }
          }
        }
      } catch (e) {
        console.warn('[FaceLandmarkerImage] MediaPipe detection error, using fallback:', e);
      }

      // If live landmarks were verified right before shutter, use them directly
      if (liveLandmarksFallback && liveLandmarksFallback.length >= 10) {
        resolve({
          detected: true,
          landmarks: liveLandmarksFallback,
          pixelData,
          width: w,
          height: h,
          source: 'mediapipe_local',
          latencyMs: Date.now() - t0,
        });
        return;
      }

      // Tier 2: Pure-JS Anatomical Locator (<5ms)
      if (pixelData) {
        const anatomical = locateFaceAnatomical(pixelData, w, h);
        if (anatomical.detected) {
          resolve({
            detected: true,
            landmarks: anatomical.landmarks,
            pixelData,
            width: w,
            height: h,
            source: 'pure_js_anatomical',
            latencyMs: Date.now() - t0,
          });
          return;
        }
      }

      // Not detected
      const defaultAnatomical = locateFaceAnatomical(new Uint8ClampedArray(96 * 72 * 4), 96, 72);
      resolve({
        detected: false,
        landmarks: defaultAnatomical.landmarks,
        pixelData,
        width: w,
        height: h,
        source: 'pure_js_anatomical',
        latencyMs: Date.now() - t0,
      });
    };

    img.onerror = () => {
      const defaultAnatomical = locateFaceAnatomical(new Uint8ClampedArray(96 * 72 * 4), 96, 72);
      resolve({
        detected: false,
        landmarks: defaultAnatomical.landmarks,
        width: 800,
        height: 1000,
        source: 'pure_js_anatomical',
        latencyMs: Date.now() - t0,
      });
    };

    img.src = imageUri;
  });
}

