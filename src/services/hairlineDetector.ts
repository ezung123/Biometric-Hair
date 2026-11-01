// ══════════════════════════════════════════════════════════════════════════════
// 3D Mathematical Head Pose & Hairline Decision Boundary Detection Engine
// Computes 6-Degrees-of-Freedom (6-DOF):
// - 3D Position: X, Y, Scale (Z-depth)
// - 3D Rotation: Pitch (tilt up/down), Yaw (turn left/right), Roll (tilt ear-to-shoulder)
// - Anatomical Hairline Curve & Cranial Contour
// ══════════════════════════════════════════════════════════════════════════════

export interface HeadPose3DResult {
  detected: boolean;
  hairlinePctY: number;    // Normalized Y (0-100%) of natural Trichion / hairline
  crownPctY: number;       // Normalized Y (0-100%) of top of skull / crown
  centerPctX: number;      // Mirrored center X (0-100%) of the skull
  skullWidthPct: number;   // Width of skull as percentage of viewport
  pitchRad: number;        // Head pitch in radians (looking up/down)
  yawRad: number;          // Head yaw in radians (turning left/right)
  rollRad: number;         // Head roll in radians (tilting left/right)
  confidence: number;      // Detection confidence score (0-1)
  landmarks?: any;
  faceOvalPolygon?: Array<[number, number]>;
}

function isSkinPixel(r: number, g: number, b: number): boolean {
  const sum = r + g + b;
  if (sum < 60 || r < 35) return false;
  // Universal YCbCr Biometric Skin Detection (Fitzpatrick I-VI)
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return cb >= 75 && cb <= 132 && cr >= 128 && cr <= 176;
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function detectHairlineDecisionBoundary(
  canvas: HTMLCanvasElement
): HeadPose3DResult {
  const defaultResult: HeadPose3DResult = {
    detected: false,
    hairlinePctY: 22.0,
    crownPctY: 10.0,
    centerPctX: 50.0,
    skullWidthPct: 32.0,
    pitchRad: 0,
    yawRad: 0,
    rollRad: 0,
    confidence: 0,
  };

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || canvas.width === 0 || canvas.height === 0) return defaultResult;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // ── Step 1: Detect Face Centroid & Spatial Bounds ──
  let sumX = 0;
  let sumY = 0;
  let skinCount = 0;
  let minX = w;
  let maxX = 0;
  let minY = h;
  let maxY = 0;

  for (let y = Math.floor(h * 0.12); y < Math.floor(h * 0.88); y += 2) {
    for (let x = Math.floor(w * 0.12); x < Math.floor(w * 0.88); x += 2) {
      const idx = (y * w + x) * 4;
      if (isSkinPixel(data[idx], data[idx + 1], data[idx + 2])) {
        sumX += x;
        sumY += y;
        skinCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (skinCount < 20 || maxX <= minX || maxY <= minY) {
    return defaultResult;
  }

  const faceCenterX = sumX / skinCount;
  const faceCenterY = sumY / skinCount;
  const faceWidth = maxX - minX;
  const faceHeight = maxY - minY;

  // ── Step 2: 3D Yaw & Pitch Rotation Estimation from Facial Asymmetry ──
  // Box center vs weighted skin mass center
  const boxMidX = (minX + maxX) / 2;
  const boxMidY = (minY + maxY) / 2;

  // Yaw: horizontal asymmetry between left and right cheek mass
  const xOffset = faceCenterX - boxMidX;
  const normXOffset = Math.max(-1.0, Math.min(1.0, xOffset / (faceWidth * 0.22)));
  // Mirrored stream: invert sign for correct 3D orientation
  const yawRad = normXOffset * 0.55; // Matches Three.js screen-space orientation // ±30 degrees range

  // Pitch: vertical offset of face center relative to golden proportion baseline
  const yOffset = faceCenterY - boxMidY;
  const normYOffset = Math.max(-1.0, Math.min(1.0, yOffset / (faceHeight * 0.20)));
  const pitchRad = normYOffset * 0.38; // ±22 degrees range

  // ── Step 3: Vertical Ray-Casting for Hairline Decision Boundary ──
  const foreheadSeedY = Math.max(8, Math.floor(faceCenterY - faceHeight * 0.22));

  let refR = 0, refG = 0, refB = 0, refSamples = 0;
  const sampleRadius = Math.max(3, Math.floor(faceWidth * 0.12));

  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -sampleRadius; dx <= sampleRadius; dx += 2) {
      const px = Math.floor(faceCenterX + dx);
      const py = Math.floor(foreheadSeedY + dy);
      if (px >= 0 && px < w && py >= 0 && py < h) {
        const idx = (py * w + px) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        if (isSkinPixel(r, g, b)) {
          refR += r;
          refG += g;
          refB += b;
          refSamples++;
        }
      }
    }
  }

  if (refSamples > 0) {
    refR /= refSamples;
    refG /= refSamples;
    refB /= refSamples;
  } else {
    refR = 180;
    refG = 130;
    refB = 100;
  }

  const refLum = getLuminance(refR, refG, refB);

  const rayCount = 17;
  const raySpan = faceWidth * 0.40;
  const hairlinePoints: { x: number; y: number }[] = [];
  const crownPoints: number[] = [];

  for (let i = 0; i < rayCount; i++) {
    const fraction = (i / (rayCount - 1)) * 2 - 1;
    const rayX = Math.floor(faceCenterX + fraction * raySpan);
    if (rayX < 5 || rayX >= w - 5) continue;

    let detectedHairlineY: number | null = null;
    let detectedCrownY: number | null = null;
    let inHair = false;

    for (let y = foreheadSeedY; y >= Math.max(2, foreheadSeedY - Math.floor(faceHeight * 0.65)); y--) {
      const idx = (y * w + rayX) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const skinLikelihood = isSkinPixel(r, g, b);
      const lum = getLuminance(r, g, b);
      const lumDiff = Math.abs(lum - refLum);

      const isHairPixel = !skinLikelihood && (lum < refLum * 0.72 || lumDiff > 40 || b > r * 0.95);

      if (!inHair && isHairPixel) {
        detectedHairlineY = y;
        inHair = true;
      } else if (inHair && (y <= 5 || (!isHairPixel && lum > refLum * 0.90))) {
        detectedCrownY = y;
        break;
      }
    }

    if (detectedHairlineY !== null) {
      hairlinePoints.push({ x: rayX, y: detectedHairlineY });
    }
    if (detectedCrownY !== null) {
      crownPoints.push(detectedCrownY);
    }
  }

  let finalHairlineY = foreheadSeedY - Math.floor(faceHeight * 0.25);
  let finalCrownY = Math.max(4, finalHairlineY - Math.floor(faceHeight * 0.28));
  let rollRad = 0;

  if (hairlinePoints.length >= 4) {
    const sortedY = hairlinePoints.map((p) => p.y).sort((a, b) => a - b);
    finalHairlineY = sortedY[Math.floor(sortedY.length * 0.50)];

    const leftPoints = hairlinePoints.filter((p) => p.x < faceCenterX);
    const rightPoints = hairlinePoints.filter((p) => p.x > faceCenterX);

    if (leftPoints.length > 0 && rightPoints.length > 0) {
      const avgLeftY = leftPoints.reduce((acc, p) => acc + p.y, 0) / leftPoints.length;
      const avgRightY = rightPoints.reduce((acc, p) => acc + p.y, 0) / rightPoints.length;
      const dx = (rightPoints[rightPoints.length - 1].x - leftPoints[0].x) || 1;
      const dy = avgRightY - avgLeftY;
      rollRad = Math.max(-0.28, Math.min(0.28, Math.atan2(dy, dx)));
    }
  }

  if (crownPoints.length >= 3) {
    const sortedCrown = crownPoints.sort((a, b) => a - b);
    finalCrownY = sortedCrown[Math.floor(sortedCrown.length * 0.40)];
  }

  const mirroredCenterPctX = 100 - (faceCenterX / w) * 100;
  const hairlinePctY = Math.max(12, Math.min(40, (finalHairlineY / h) * 100));
  const crownPctY = Math.max(3, Math.min(hairlinePctY - 6, (finalCrownY / h) * 100));
  const skullWidthPct = Math.min(55, Math.max(22, (faceWidth / w) * 100));

  return {
    detected: true,
    hairlinePctY,
    crownPctY,
    centerPctX: mirroredCenterPctX,
    skullWidthPct,
    pitchRad,
    yawRad,
    rollRad,
    confidence: Math.min(1.0, hairlinePoints.length / rayCount),
  };
}
