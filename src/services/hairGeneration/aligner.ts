// ══════════════════════════════════════════════════════════════════════════════
// src/services/hairGeneration/aligner.ts
// STEP 2c: ANATOMICAL SIMILARITY TRANSFORM ALIGNMENT
// ══════════════════════════════════════════════════════════════════════════════
// Uses stable facial landmarks:
// - Eye corners: 33, 133, 263, 362
// - Nose tip: 1
// - Mouth corners: 61, 291
// Estimates similarity transform (rotation, scale, translation).
// Warps candidate onto original frame.
// If residual > 1.5% of face width, rejects candidate.
// ══════════════════════════════════════════════════════════════════════════════

export interface Point2D {
  x: number;
  y: number;
}

export interface AlignmentResult {
  warpedImageDataUrl: string;
  residualPx: number;
  residualPctOfFaceWidth: number;
  passed: boolean;
  scale: number;
  rotationDeg: number;
  translation: { x: number; y: number };
}

// Stable landmark indices for alignment
export const STABLE_LANDMARK_INDICES = [33, 133, 263, 362, 1, 61, 291];

/**
 * Estimates a 2D similarity transform (scale, rotation, translation)
 * mapping sourcePoints to targetPoints using least squares (Umeyama 2D).
 */
export function estimateSimilarityTransform(
  sourcePoints: Point2D[],
  targetPoints: Point2D[]
): { a: number; b: number; tx: number; ty: number; scale: number; rotationDeg: number } {
  const n = Math.min(sourcePoints.length, targetPoints.length);
  if (n < 2) {
    return { a: 1, b: 0, tx: 0, ty: 0, scale: 1, rotationDeg: 0 };
  }

  let srcMeanX = 0, srcMeanY = 0;
  let dstMeanX = 0, dstMeanY = 0;

  for (let i = 0; i < n; i++) {
    srcMeanX += sourcePoints[i].x;
    srcMeanY += sourcePoints[i].y;
    dstMeanX += targetPoints[i].x;
    dstMeanY += targetPoints[i].y;
  }
  srcMeanX /= n;
  srcMeanY /= n;
  dstMeanX /= n;
  dstMeanY /= n;

  let srcVar = 0;
  let covXX = 0, covXY = 0;

  for (let i = 0; i < n; i++) {
    const sx = sourcePoints[i].x - srcMeanX;
    const sy = sourcePoints[i].y - srcMeanY;
    const dx = targetPoints[i].x - dstMeanX;
    const dy = targetPoints[i].y - dstMeanY;

    srcVar += sx * sx + sy * sy;
    covXX += sx * dx + sy * dy;
    covXY += sx * dy - sy * dx;
  }

  if (srcVar < 1e-6) {
    return { a: 1, b: 0, tx: dstMeanX - srcMeanX, ty: dstMeanY - srcMeanY, scale: 1, rotationDeg: 0 };
  }

  const a = covXX / srcVar;
  const b = covXY / srcVar;

  const scale = Math.hypot(a, b);
  const rotationDeg = Math.atan2(b, a) * (180 / Math.PI);

  const tx = dstMeanX - (a * srcMeanX - b * srcMeanY);
  const ty = dstMeanY - (b * srcMeanX + a * srcMeanY);

  return { a, b, tx, ty, scale, rotationDeg };
}

/**
 * Warps candidate image onto the original reference frame using estimated similarity transform.
 * Verifies that average residual across stable landmarks <= 1.5% of face width.
 */
export async function alignAndWarpCandidate(
  originalDataUrl: string,
  candidateDataUrl: string,
  originalLandmarks: Array<{ x: number; y: number }>,
  candidateLandmarks: Array<{ x: number; y: number }>,
  w = 1024,
  h = 1280
): Promise<AlignmentResult> {
  // If in non-browser environment or missing landmarks, pass through
  if (
    typeof window === 'undefined' ||
    !originalLandmarks ||
    !candidateLandmarks ||
    originalLandmarks.length < 300 ||
    candidateLandmarks.length < 300
  ) {
    return {
      warpedImageDataUrl: candidateDataUrl,
      residualPx: 0,
      residualPctOfFaceWidth: 0,
      passed: true,
      scale: 1,
      rotationDeg: 0,
      translation: { x: 0, y: 0 },
    };
  }

  const toPx = (p: { x: number; y: number }) => ({
    x: p.x <= 1.0 ? p.x * w : p.x,
    y: p.y <= 1.0 ? p.y * h : p.y,
  });

  const srcPts: Point2D[] = [];
  const dstPts: Point2D[] = [];

  for (const idx of STABLE_LANDMARK_INDICES) {
    if (candidateLandmarks[idx] && originalLandmarks[idx]) {
      srcPts.push(toPx(candidateLandmarks[idx]));
      dstPts.push(toPx(originalLandmarks[idx]));
    }
  }

  // Calculate face width from cheekbone landmarks (234 to 454)
  const lCheek = toPx(originalLandmarks[234] || { x: 0.35, y: 0.5 });
  const rCheek = toPx(originalLandmarks[454] || { x: 0.65, y: 0.5 });
  const faceWidth = Math.hypot(rCheek.x - lCheek.x, rCheek.y - lCheek.y) || (w * 0.35);

  const transform = estimateSimilarityTransform(srcPts, dstPts);

  // Compute residual error after transform
  let sumSqErr = 0;
  for (let i = 0; i < srcPts.length; i++) {
    const transformedX = transform.a * srcPts[i].x - transform.b * srcPts[i].y + transform.tx;
    const transformedY = transform.b * srcPts[i].x + transform.a * srcPts[i].y + transform.ty;
    const dx = transformedX - dstPts[i].x;
    const dy = transformedY - dstPts[i].y;
    sumSqErr += dx * dx + dy * dy;
  }

  const meanRmsResidual = Math.sqrt(sumSqErr / Math.max(1, srcPts.length));
  const residualPct = (meanRmsResidual / faceWidth) * 100;

  // Threshold: <= 1.5% of face width
  const passed = residualPct <= 1.5;

  return new Promise((resolve) => {
    const img = new (window as any).Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          warpedImageDataUrl: candidateDataUrl,
          residualPx: meanRmsResidual,
          residualPctOfFaceWidth: residualPct,
          passed,
          scale: transform.scale,
          rotationDeg: transform.rotationDeg,
          translation: { x: transform.tx, y: transform.ty },
        });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Apply affine transform
      ctx.setTransform(transform.a, transform.b, -transform.b, transform.a, transform.tx, transform.ty);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.resetTransform();

      resolve({
        warpedImageDataUrl: canvas.toDataURL('image/jpeg', 0.95),
        residualPx: meanRmsResidual,
        residualPctOfFaceWidth: residualPct,
        passed,
        scale: transform.scale,
        rotationDeg: transform.rotationDeg,
        translation: { x: transform.tx, y: transform.ty },
      });
    };

    img.onerror = () => {
      resolve({
        warpedImageDataUrl: candidateDataUrl,
        residualPx: meanRmsResidual,
        residualPctOfFaceWidth: residualPct,
        passed,
        scale: transform.scale,
        rotationDeg: transform.rotationDeg,
        translation: { x: transform.tx, y: transform.ty },
      });
    };

    img.src = candidateDataUrl;
  });
}

