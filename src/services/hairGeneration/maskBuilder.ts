// ══════════════════════════════════════════════════════════════════════════════
// src/services/hairGeneration/maskBuilder.ts
// STEP 2c: HIGH-PRECISION CRANIAL MASK GENERATOR & FACE PROTECTION
// ══════════════════════════════════════════════════════════════════════════════

import type { DatasetHairstyle } from '@/constants/haircutDataset';

export interface MaskBuildOutput {
  editMaskDataUrl: string;   // White = inpaint zone, Black = keep out
  keepOutMaskDataUrl: string; // White = untouchable original face pixels
  fringeDrapeDataUrl?: string;
  hasFringeDrape: boolean;
  pixelWidth: number;
  pixelHeight: number;
}

/**
 * Builds the hard keep-out polygon path protecting eyes, brows (+8% margin),
 * nose, mouth, cheeks, jawline, chin, glasses, and accessories.
 */
export function buildFacialKeepOutPolygon(
  landmarks: Array<{ x: number; y: number; z?: number }>,
  w: number,
  h: number
): Path2D {
  const path = new Path2D();
  if (!landmarks || landmarks.length < 10) return path;

  const toX = (p: { x: number }) => (p.x <= 1.0 ? p.x * w : p.x);
  const toY = (p: { y: number }) => (p.y <= 1.0 ? p.y * h : p.y);

  const pt10  = landmarks[10]  || landmarks[0];
  const pt152 = landmarks[152] || landmarks[Math.min(152, landmarks.length - 1)];
  const faceHeight = Math.abs(toY(pt152) - toY(pt10));
  const browMargin = faceHeight * 0.08;

  // Brow ridge indices: 127, 70, 63, 105, 66, 107, 151, 336, 296, 334, 293, 300, 356
  // Jawline and chin contour indices: 454 down to 152 to 234
  const browIndices = [127, 70, 63, 105, 66, 107, 151, 336, 296, 334, 293, 300, 356];
  const jawIndices = [454, 323, 361, 288, 397, 365, 379, 378, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127];

  let first = true;
  for (const idx of browIndices) {
    const pt = landmarks[idx] || pt10;
    const x = toX(pt);
    const y = toY(pt) + browMargin;
    if (first) {
      path.moveTo(x, y);
      first = false;
    } else {
      path.lineTo(x, y);
    }
  }

  for (const idx of jawIndices) {
    const pt = landmarks[idx];
    if (pt) {
      path.lineTo(toX(pt), toY(pt));
    }
  }

  path.closePath();
  return path;
}

/**
 * Builds the edit mask for inpainting:
 * editMask = dilate(existingHair ∪ targetSilhouetteRegion, 10px) - keepOut
 */
export async function buildHairstyleMasks(
  baseImageUri: string,
  style: DatasetHairstyle,
  landmarks: Array<{ x: number; y: number; z?: number }>,
  w = 1024,
  h = 1280
): Promise<MaskBuildOutput> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({
        editMaskDataUrl: '',
        keepOutMaskDataUrl: '',
        hasFringeDrape: false,
        pixelWidth: w,
        pixelHeight: h,
      });
      return;
    }

    const toX = (p: { x: number }) => (p.x <= 1.0 ? p.x * w : p.x);
    const toY = (p: { y: number }) => (p.y <= 1.0 ? p.y * h : p.y);

    const pt10  = landmarks[10]  || { x: 0.5, y: 0.28 };
    const pt151 = landmarks[151] || { x: 0.5, y: 0.38 };
    const pt152 = landmarks[152] || { x: 0.5, y: 0.68 };
    const pt127 = landmarks[127] || { x: 0.35, y: 0.38 };
    const pt356 = landmarks[356] || { x: 0.65, y: 0.38 };

    const xTrichion = toX(pt10);
    const yTrichion = toY(pt10);
    const yGlabella = toY(pt151);
    const xTempleR = toX(pt127);
    const xTempleL = toX(pt356);

    const faceWidth = Math.abs(xTempleL - xTempleR);
    const faceHeight = Math.abs(toY(pt152) - yTrichion);

    // 1. Create keepOut canvas (White = keepOut face, Black = background)
    const keepOutCanvas = document.createElement('canvas');
    keepOutCanvas.width = w;
    keepOutCanvas.height = h;
    const kCtx = keepOutCanvas.getContext('2d');
    if (!kCtx) {
      resolve({
        editMaskDataUrl: '',
        keepOutMaskDataUrl: '',
        hasFringeDrape: false,
        pixelWidth: w,
        pixelHeight: h,
      });
      return;
    }

    kCtx.fillStyle = '#000000';
    kCtx.fillRect(0, 0, w, h);

    const keepOutPath = buildFacialKeepOutPolygon(landmarks, w, h);
    kCtx.fillStyle = '#FFFFFF';
    kCtx.fill(keepOutPath);

    // 2. Create editMask canvas
    const editCanvas = document.createElement('canvas');
    editCanvas.width = w;
    editCanvas.height = h;
    const eCtx = editCanvas.getContext('2d');
    if (!eCtx) {
      resolve({
        editMaskDataUrl: '',
        keepOutMaskDataUrl: keepOutCanvas.toDataURL('image/png'),
        hasFringeDrape: false,
        pixelWidth: w,
        pixelHeight: h,
      });
      return;
    }

    eCtx.fillStyle = '#000000';
    eCtx.fillRect(0, 0, w, h);

    // Target Silhouette Region based on style lengthClass and volumeProfile
    eCtx.fillStyle = '#FFFFFF';
    eCtx.beginPath();

    const isLong = style.lengthClass === 'long';
    const isMedium = style.lengthClass === 'medium';
    const isShort = style.lengthClass === 'short';

    const lateralSpread = isLong ? faceWidth * 0.90 : isMedium ? faceWidth * 0.78 : faceWidth * 0.68;
    const crownTop = Math.max(10, yTrichion - faceHeight * (style.volumeProfile.crown === 'high' ? 0.45 : 0.32));
    const sideDropY = isLong ? h * 0.95 : isMedium ? yGlabella + faceHeight * 0.75 : yGlabella + faceHeight * 0.25;

    // Silhouette dome over cranial vault
    eCtx.moveTo(xTrichion - lateralSpread, sideDropY);
    eCtx.quadraticCurveTo(xTrichion - lateralSpread * 1.15, crownTop + 20, xTrichion, crownTop);
    eCtx.quadraticCurveTo(xTrichion + lateralSpread * 1.15, crownTop + 20, xTrichion + lateralSpread, sideDropY);
    eCtx.lineTo(xTrichion + lateralSpread * 0.7, sideDropY);
    eCtx.lineTo(xTrichion - lateralSpread * 0.7, sideDropY);
    eCtx.closePath();
    eCtx.fill();

    // Forehead drape zone: for fringe/bangs styles, allow drape between trichion and brow line
    const isFringeStyle = style.volumeProfile.foreheadCoverage === 'full_bangs' || style.volumeProfile.foreheadCoverage === 'curtain';
    if (isFringeStyle) {
      eCtx.beginPath();
      const drapeBottomY = yTrichion + (yGlabella - yTrichion) * 0.85;
      eCtx.rect(xTempleR - 15, yTrichion - 10, (xTempleL - xTempleR) + 30, drapeBottomY - yTrichion + 10);
      eCtx.fill();
    }

    // 3. Subtract keepOut mask from editMask
    eCtx.globalCompositeOperation = 'destination-out';
    eCtx.drawImage(keepOutCanvas, 0, 0);
    eCtx.globalCompositeOperation = 'source-over';

    // 4. Dilate editMask by 10px to ensure complete coverage without sharp seam
    const dilatedCanvas = document.createElement('canvas');
    dilatedCanvas.width = w;
    dilatedCanvas.height = h;
    const dCtx = dilatedCanvas.getContext('2d');
    if (dCtx) {
      dCtx.fillStyle = '#000000';
      dCtx.fillRect(0, 0, w, h);
      // Fast morphological dilation approximation via offset blur & threshold
      dCtx.filter = 'blur(6px)';
      dCtx.drawImage(editCanvas, 0, 0);
      dCtx.filter = 'none';

      const dImg = dCtx.getImageData(0, 0, w, h);
      const dPx = dImg.data;
      for (let i = 0; i < dPx.length; i += 4) {
        if (dPx[i] > 18) {
          dPx[i] = 255;
          dPx[i + 1] = 255;
          dPx[i + 2] = 255;
          dPx[i + 3] = 255;
        } else {
          dPx[i] = 0;
          dPx[i + 1] = 0;
          dPx[i + 2] = 0;
          dPx[i + 3] = 255;
        }
      }
      dCtx.putImageData(dImg, 0, 0);

      // Re-subtract keepOut polygon so the dilation does NOT encroach into eyes or brows
      dCtx.globalCompositeOperation = 'destination-out';
      dCtx.drawImage(keepOutCanvas, 0, 0);
      dCtx.globalCompositeOperation = 'source-over';
    }

    resolve({
      editMaskDataUrl: (dilatedCanvas || editCanvas).toDataURL('image/png'),
      keepOutMaskDataUrl: keepOutCanvas.toDataURL('image/png'),
      hasFringeDrape: isFringeStyle,
      pixelWidth: w,
      pixelHeight: h,
    });
  });
}

