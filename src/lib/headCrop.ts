// ══════════════════════════════════════════════════════════════════════════════
// src/lib/headCrop.ts
// STEP 1: CANONICAL 4:5 HEAD & SHOULDERS CROP ENGINE
// ══════════════════════════════════════════════════════════════════════════════
// Every view in the app (Hero Before/After Slider, Recommendation Cards, Makeover Studio)
// shares this exact 4:5 portrait frame:
//   - Centered on the face bounding box
//   - 40% headroom above the Trichion hairline
//   - Includes clavicle/shoulders below chin
//   - Fixed 4:5 aspect ratio (e.g. 820 x 1024 or higher)
//   - Clamped safely to source image boundaries
//   - Maps full-frame landmarks into crop-normalized space [0, 1]
// ══════════════════════════════════════════════════════════════════════════════

export interface HeadCropBox {
  // Pixel coordinates in original image space
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  // Normalized 0..1 coordinates in original image space
  normX: number;
  normY: number;
  normW: number;
  normH: number;
  targetOutputWidth: number;
  targetOutputHeight: number;
}

export interface HeadCropResult {
  dataUrl: string;
  cropBox: HeadCropBox;
  cropLandmarks: Array<{ x: number; y: number; z?: number }>;
}

/**
 * Computes canonical 4:5 crop bounds centered on the face with 40% headroom above hairline.
 */
export function calculateHeadCropBox(
  landmarks: Array<{ x: number; y: number; z?: number }>,
  imageWidth: number,
  imageHeight: number,
  targetOutputHeight = 1024
): HeadCropBox {
  const w = imageWidth || 800;
  const h = imageHeight || 1000;

  const toNormX = (p: { x: number }) => (p.x > 1.0 ? p.x / w : p.x);
  const toNormY = (p: { y: number }) => (p.y > 1.0 ? p.y / h : p.y);

  // Key landmarks
  // 10: Trichion (hairline)
  // 152: Gnathion (chin tip)
  // 234: Right cheek
  // 454: Left cheek
  const pt10  = landmarks[10]  || landmarks[0];
  const pt152 = landmarks[152] || landmarks[Math.min(152, landmarks.length - 1)];
  const pt234 = landmarks[234] || landmarks[Math.min(234, landmarks.length - 1)];
  const pt454 = landmarks[454] || landmarks[Math.min(454, landmarks.length - 1)];

  const hairlineNormY = toNormY(pt10);
  const chinNormY = toNormY(pt152);
  const cheekLNormX = toNormX(pt234);
  const cheekRNormX = toNormX(pt454);

  const faceCenterNormX = (cheekLNormX + cheekRNormX) * 0.5;
  const faceHeightNorm = Math.max(0.12, Math.abs(chinNormY - hairlineNormY));

  // 1. Calculate vertical span:
  // 40% headroom above hairline + face height + 45% shoulder/collar margin below chin
  const headroomNorm = faceHeightNorm * 0.40;
  const shoulderNorm = faceHeightNorm * 0.45;

  let topNormY = hairlineNormY - headroomNorm;
  let bottomNormY = chinNormY + shoulderNorm;
  let desiredHeightNorm = bottomNormY - topNormY;

  // 2. Enforce 4:5 aspect ratio (width = height * 0.8)
  const imageAspect = w / h;
  // In normalized space: normWidth * imageAspect = normHeight * 0.8
  // so normWidth = normHeight * (0.8 / imageAspect)
  let desiredWidthNorm = desiredHeightNorm * (0.8 / imageAspect);

  // If desired box is wider than the image, scale down height to fit
  if (desiredWidthNorm > 0.98) {
    desiredWidthNorm = 0.98;
    desiredHeightNorm = desiredWidthNorm / (0.8 / imageAspect);
    topNormY = Math.max(0, hairlineNormY - desiredHeightNorm * 0.28);
    bottomNormY = topNormY + desiredHeightNorm;
  }

  let leftNormX = faceCenterNormX - desiredWidthNorm * 0.5;

  // 3. Clamp box inside [0, 1] bounds while preserving 4:5 ratio
  if (leftNormX < 0) {
    leftNormX = 0;
  } else if (leftNormX + desiredWidthNorm > 1.0) {
    leftNormX = Math.max(0, 1.0 - desiredWidthNorm);
  }

  if (topNormY < 0) {
    topNormY = 0;
    bottomNormY = Math.min(1.0, desiredHeightNorm);
  } else if (bottomNormY > 1.0) {
    bottomNormY = 1.0;
    topNormY = Math.max(0, 1.0 - desiredHeightNorm);
  }

  // Final pixel bounds
  const cropX = Math.max(0, Math.floor(leftNormX * w));
  const cropY = Math.max(0, Math.floor(topNormY * h));
  const cropW = Math.min(w - cropX, Math.floor(desiredWidthNorm * w));
  const cropH = Math.min(h - cropY, Math.floor(desiredHeightNorm * h));

  const targetOutputWidth = Math.round(targetOutputHeight * 0.8);

  return {
    cropX,
    cropY,
    cropW,
    cropH,
    normX: cropX / w,
    normY: cropY / h,
    normW: cropW / w,
    normH: cropH / h,
    targetOutputWidth,
    targetOutputHeight,
  };
}

/**
 * Transforms landmarks from original full-frame space into crop-normalized coordinates [0, 1].
 */
export function transformLandmarksToCrop(
  landmarks: Array<{ x: number; y: number; z?: number }>,
  cropBox: HeadCropBox,
  origW: number,
  origH: number
): Array<{ x: number; y: number; z?: number }> {
  return landmarks.map((pt) => {
    const rawPxX = pt.x <= 1.0 ? pt.x * origW : pt.x;
    const rawPxY = pt.y <= 1.0 ? pt.y * origH : pt.y;

    const cropPxX = rawPxX - cropBox.cropX;
    const cropPxY = rawPxY - cropBox.cropY;

    const normCropX = Math.max(0, Math.min(1.0, cropPxX / (cropBox.cropW || 1)));
    const normCropY = Math.max(0, Math.min(1.0, cropPxY / (cropBox.cropH || 1)));

    return {
      x: normCropX,
      y: normCropY,
      z: pt.z,
    };
  });
}

/**
 * Extracts and upscales the 4:5 head-and-shoulders crop onto a canvas buffer.
 * Returns the dataUrl and transformed landmarks in crop space.
 */
export async function createHeadCropCanvas(
  sourceImageUri: string,
  landmarks: Array<{ x: number; y: number; z?: number }>,
  targetHeight = 1024
): Promise<HeadCropResult> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      const dummyBox: HeadCropBox = {
        cropX: 0,
        cropY: 0,
        cropW: 800,
        cropH: 1000,
        normX: 0,
        normY: 0,
        normW: 1,
        normH: 1,
        targetOutputWidth: 819,
        targetOutputHeight: targetHeight,
      };
      resolve({
        dataUrl: sourceImageUri,
        cropBox: dummyBox,
        cropLandmarks: landmarks,
      });
      return;
    }

    const img = new (window as any).Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const origW = img.naturalWidth || img.width || 800;
        const origH = img.naturalHeight || img.height || 1000;

        const cropBox = calculateHeadCropBox(landmarks, origW, origH, targetHeight);
        const transformedLandmarks = transformLandmarksToCrop(landmarks, cropBox, origW, origH);

        const canvas = document.createElement('canvas');
        canvas.width = cropBox.targetOutputWidth;
        canvas.height = cropBox.targetOutputHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({
            dataUrl: sourceImageUri,
            cropBox,
            cropLandmarks: transformedLandmarks,
          });
          return;
        }

        // Draw cropped region from source image smoothly scaled to 4:5 canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          img,
          cropBox.cropX,
          cropBox.cropY,
          cropBox.cropW,
          cropBox.cropH,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
        resolve({
          dataUrl,
          cropBox,
          cropLandmarks: transformedLandmarks,
        });
      } catch {
        const dummyBox = calculateHeadCropBox(landmarks, 800, 1000, targetHeight);
        resolve({
          dataUrl: sourceImageUri,
          cropBox: dummyBox,
          cropLandmarks: landmarks,
        });
      }
    };

    img.onerror = () => {
      const dummyBox = calculateHeadCropBox(landmarks, 800, 1000, targetHeight);
      resolve({
        dataUrl: sourceImageUri,
        cropBox: dummyBox,
        cropLandmarks: landmarks,
      });
    };

    img.src = sourceImageUri;
  });
}

