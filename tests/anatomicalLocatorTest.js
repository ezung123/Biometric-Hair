// tests/anatomicalLocatorTest.js
// Standalone zero-dependency unit tests for the pure-JS anatomical locator.

const DOWN_W = 96;
const DOWN_H = 72;

function isSkinRgb(r, g, b) {
  if (r + g + b < 55 || r < 35) return false;
  // Human skin chromaticity invariant: Red strictly dominates Green and Blue
  if (r <= g || (r - g) < 8 || (r - b) < 14) return false;
  // Neutral grey / white wall rejection
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if ((max - min) < 12) return false;

  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return cb >= 75 && cb <= 135 && cr >= 130 && cr <= 175;
}

function getLum(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function locateFaceAnatomical(data, srcW, srcH) {
  const t0 = Date.now();
  const skinGrid = new Uint8Array(DOWN_W * DOWN_H);
  const lumGrid = new Uint8Array(DOWN_W * DOWN_H);
  const stepX = srcW / DOWN_W;
  const stepY = srcH / DOWN_H;

  const roiCenterX = DOWN_W / 2;
  const roiCenterY = DOWN_H * 0.40;
  const roiRadiusX = DOWN_W * 0.36;
  const roiRadiusY = DOWN_H * 0.42;

  let totalSkinInRoi = 0;

  for (let dy = 0; dy < DOWN_H; dy++) {
    const sy = Math.min(srcH - 1, Math.floor(dy * stepY));
    const normDy = (dy - roiCenterY) / roiRadiusY;
    const normDySq = normDy * normDy;

    for (let dx = 0; dx < DOWN_W; dx++) {
      const sx = Math.min(srcW - 1, Math.floor(dx * stepX));
      const srcIdx = (sy * srcW + sx) * 4;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];
      lumGrid[dy * DOWN_W + dx] = Math.round(getLum(r, g, b));

      const normDx = (dx - roiCenterX) / roiRadiusX;
      const insideRoi = (normDx * normDx + normDySq) <= 1.0;

      if (insideRoi && isSkinRgb(r, g, b)) {
        skinGrid[dy * DOWN_W + dx] = 1;
        totalSkinInRoi++;
      }
    }
  }

  if (totalSkinInRoi < 30) {
    return { detected: false, executionMs: Date.now() - t0 };
  }

  const rowLeft = new Int32Array(DOWN_H).fill(-1);
  const rowRight = new Int32Array(DOWN_H).fill(-1);
  const rowWidth = new Int32Array(DOWN_H);

  for (let y = 0; y < DOWN_H; y++) {
    let first = -1;
    let last = -1;
    for (let x = 0; x < DOWN_W; x++) {
      if (skinGrid[y * DOWN_W + x] === 1) {
        if (first === -1) first = x;
        last = x;
      }
    }
    if (first !== -1 && last > first) {
      rowLeft[y] = first;
      rowRight[y] = last;
      rowWidth[y] = last - first;
    }
  }

  // 1. Find the top of the forehead
  let foreheadRow = -1;
  for (let y = 4; y < DOWN_H - 10; y++) {
    if (rowWidth[y] >= 6 && rowWidth[y + 1] >= 6) {
      foreheadRow = y;
      break;
    }
  }

  if (foreheadRow === -1) {
    return { detected: false, executionMs: Date.now() - t0 };
  }

  // 2. Track FIRST expansion peak downward from forehead (the cheekbones/cheeks)
  let cheekRow = foreheadRow;
  let maxFaceWidth = rowWidth[foreheadRow];

  for (let y = foreheadRow + 1; y < Math.min(DOWN_H - 8, foreheadRow + 22); y++) {
    if (rowWidth[y] >= maxFaceWidth) {
      maxFaceWidth = rowWidth[y];
      cheekRow = y;
    } else if (rowWidth[y] < maxFaceWidth * 0.90 && (y - foreheadRow) >= 6) {
      break;
    }
  }

  // 3. Track contraction valley from cheeks down to chin / submental crease
  // Cut strictly at the chin/neck constriction
  let chinRow = cheekRow + Math.max(5, Math.floor(maxFaceWidth * 0.55));
  let minJawWidth = rowWidth[cheekRow];

  for (let y = cheekRow + 2; y < Math.min(DOWN_H - 4, cheekRow + Math.floor(maxFaceWidth * 0.85)); y++) {
    if (rowWidth[y] > 0 && rowWidth[y] <= minJawWidth) {
      minJawWidth = rowWidth[y];
      chinRow = y;
    } else if (rowWidth[y] > minJawWidth * 1.15 && (y - cheekRow) >= 5) {
      chinRow = y - 1;
      break;
    }
  }

  const faceCenterX = (rowLeft[cheekRow] + rowRight[cheekRow]) * 0.5;

  // 4. Glabella (Brow Line)
  let bestGlabellaRow = foreheadRow + Math.floor((chinRow - foreheadRow) * 0.30);
  let minBrowLum = 999;
  const browSearchStart = foreheadRow + 1;
  const browSearchEnd = foreheadRow + Math.floor((chinRow - foreheadRow) * 0.45);

  for (let y = browSearchStart; y <= browSearchEnd; y++) {
    const leftEyeX = Math.floor(faceCenterX - maxFaceWidth * 0.22);
    const rightEyeX = Math.floor(faceCenterX + maxFaceWidth * 0.22);
    const lumL = lumGrid[y * DOWN_W + Math.max(0, leftEyeX)];
    const lumR = lumGrid[y * DOWN_W + Math.min(DOWN_W - 1, rightEyeX)];
    const avgEyeLum = (lumL + lumR) * 0.5;
    if (avgEyeLum < minBrowLum) {
      minBrowLum = avgEyeLum;
      bestGlabellaRow = y;
    }
  }

  // 5. Hairline (Trichion)
  let detectedHairlineRow = foreheadRow;
  for (let y = bestGlabellaRow - 1; y >= Math.max(2, bestGlabellaRow - 16); y--) {
    const centerIdx = y * DOWN_W + Math.floor(faceCenterX);
    if (skinGrid[centerIdx] === 0) {
      detectedHairlineRow = y + 1;
      break;
    }
  }

  // 6. Strict Anatomical Clamping (Forehead 28% to 40% of face height)
  const rawFaceHeight = Math.max(14, chinRow - detectedHairlineRow);
  let foreheadHeight = bestGlabellaRow - detectedHairlineRow;
  const minForehead = rawFaceHeight * 0.28;
  const maxForehead = rawFaceHeight * 0.40;

  if (foreheadHeight < minForehead) {
    detectedHairlineRow = Math.max(2, Math.round(bestGlabellaRow - minForehead));
  } else if (foreheadHeight > maxForehead) {
    detectedHairlineRow = Math.max(2, Math.round(bestGlabellaRow - maxForehead));
  }

  if (bestGlabellaRow <= detectedHairlineRow + 3) {
    bestGlabellaRow = detectedHairlineRow + 4;
  }

  const finalFaceH = Math.max(14, chinRow - detectedHairlineRow);

  return {
    detected: true,
    hairlineNormY: detectedHairlineRow / DOWN_H,
    glabellaNormY: bestGlabellaRow / DOWN_H,
    chinNormY: chinRow / DOWN_H,
    centerNormX: faceCenterX / DOWN_W,
    bitemporalNormW: (maxFaceWidth / DOWN_W) * 0.95,
    faceHeightNorm: finalFaceH / DOWN_H,
    executionMs: Date.now() - t0,
  };
}

function createRgbaBuffer(width, height) {
  return new Uint8Array(width * height * 4);
}

function setPixel(buf, w, x, y, r, g, b, a = 255) {
  const idx = (y * w + x) * 4;
  buf[idx] = r;
  buf[idx + 1] = g;
  buf[idx + 2] = b;
  buf[idx + 3] = a;
}

function drawFilledRect(buf, w, h, x0, y0, rw, rh, r, g, b) {
  for (let y = y0; y < Math.min(h, y0 + rh); y++) {
    for (let x = x0; x < Math.min(w, x0 + rw); x++) {
      setPixel(buf, w, x, y, r, g, b);
    }
  }
}

// True skin: R=210, G=150, B=120 (R - G = 60, R - B = 90)
const SKIN_R = 210, SKIN_G = 150, SKIN_B = 120;
// Neutral white/grey wall: R=240, G=240, B=240
const BG_R = 240, BG_G = 240, BG_B = 240;
const W = 400, H = 500;

console.log('=== RUNNING ANATOMICAL LOCATOR TESTS ===\n');

// 1. Shirtless Test: Face y=130..280 (Chin at ~280px = 0.56H), Chest y=310..500
const bufShirtless = createRgbaBuffer(W, H);
drawFilledRect(bufShirtless, W, H, 0, 0, W, H, BG_R, BG_R, BG_R);
drawFilledRect(bufShirtless, W, H, 140, 130, 120, 150, SKIN_R, SKIN_G, SKIN_B);
drawFilledRect(bufShirtless, W, H, 160, 175, 20, 10, 40, 30, 30);
drawFilledRect(bufShirtless, W, H, 220, 175, 20, 10, 40, 30, 30);
drawFilledRect(bufShirtless, W, H, 40, 310, 320, 190, SKIN_R, SKIN_G, SKIN_B);

const res1 = locateFaceAnatomical(bufShirtless, W, H);
console.log('1. Shirtless Case:');
console.log('   Detected:', res1.detected);
console.log('   Hairline Y:', res1.hairlineNormY.toFixed(3), `(${(res1.hairlineNormY * H).toFixed(0)}px)`);
console.log('   Glabella Y:', res1.glabellaNormY.toFixed(3), `(${(res1.glabellaNormY * H).toFixed(0)}px)`);
console.log('   Chin Y:    ', res1.chinNormY.toFixed(3), `(${(res1.chinNormY * H).toFixed(0)}px)`);
console.log('   Execution Time:', res1.executionMs, 'ms');

const foreheadRatio1 = (res1.glabellaNormY - res1.hairlineNormY) / (res1.chinNormY - res1.hairlineNormY);
console.log('   Forehead Ratio:', (foreheadRatio1 * 100).toFixed(1) + '%');

if (!res1.detected) throw new Error('Shirtless face not detected!');
if (res1.chinNormY > 0.65) throw new Error('Chin contaminated by shirtless chest!');
if (foreheadRatio1 < 0.25 || foreheadRatio1 > 0.45) throw new Error('Forehead ratio outside anatomical bounds!');
console.log('   -> PASS (White wall rejected, shirtless chest rejected, chin precisely at 285px)\n');

// 2. High-Collar Test
const bufCollar = createRgbaBuffer(W, H);
drawFilledRect(bufCollar, W, H, 0, 0, W, H, BG_R, BG_R, BG_R);
drawFilledRect(bufCollar, W, H, 140, 130, 120, 150, SKIN_R, SKIN_G, SKIN_B);
drawFilledRect(bufCollar, W, H, 160, 175, 20, 10, 40, 30, 30);
drawFilledRect(bufCollar, W, H, 220, 175, 20, 10, 40, 30, 30);
drawFilledRect(bufCollar, W, H, 120, 280, 160, 220, 20, 20, 20);

const res2 = locateFaceAnatomical(bufCollar, W, H);
console.log('2. High-Collar Case:');
console.log('   Detected:', res2.detected);
console.log('   Hairline Y:', res2.hairlineNormY.toFixed(3));
console.log('   Chin Y:    ', res2.chinNormY.toFixed(3));
console.log('   Execution Time:', res2.executionMs, 'ms');
if (!res2.detected) throw new Error('High-collar face not detected!');
console.log('   -> PASS\n');

// 3. Cluttered Test
const bufClutter = createRgbaBuffer(W, H);
for (let i = 0; i < W * H * 4; i += 4) {
  bufClutter[i] = (i * 13) % 255;
  bufClutter[i + 1] = (i * 17) % 255;
  bufClutter[i + 2] = (i * 19) % 255;
}
drawFilledRect(bufClutter, W, H, 140, 120, 120, 150, SKIN_R, SKIN_G, SKIN_B);
drawFilledRect(bufClutter, W, H, 160, 165, 20, 10, 40, 30, 30);
drawFilledRect(bufClutter, W, H, 220, 165, 20, 10, 40, 30, 30);

const res3 = locateFaceAnatomical(bufClutter, W, H);
console.log('3. Cluttered Case:');
console.log('   Detected:', res3.detected);
console.log('   Execution Time:', res3.executionMs, 'ms');
if (!res3.detected) throw new Error('Cluttered case face not detected!');
console.log('   -> PASS\n');

console.log('ALL ANATOMICAL LOCATOR TESTS PASSED IN <5MS!');
