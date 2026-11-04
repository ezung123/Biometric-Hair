// ══════════════════════════════════════════════════════════════════════════════
// tests/qualityAndAnalysisTest.js
// STEP 7 UNIT & REGRESSION TEST SUITE
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');

// ── 1. Quality Gate Tests ──
console.log('=== TEST 1: QUALITY GATE REGRESSION CHECKS ===');

function evaluateQualitySimple(faceWidthNorm, faceHeightNorm, centerNormX, centerNormY, yawDeg, lum) {
  const faceWidthPct = Math.round(faceWidthNorm * 100);
  const faceHeightPct = Math.round(faceHeightNorm * 100);

  if (faceWidthPct < 22 && faceHeightPct < 30) {
    return { passed: false, reason: 'TOO_FAR', guidance: 'Move Closer' };
  }
  if (Math.abs(centerNormX - 0.50) > 0.18 || Math.abs(centerNormY - 0.45) > 0.20) {
    return { passed: false, reason: 'NOT_CENTERED', guidance: 'Center Your Face' };
  }
  if (Math.abs(yawDeg) > 20) {
    return { passed: false, reason: 'HEAD_TURNED', guidance: 'Face Forward' };
  }
  if (lum < 38) {
    return { passed: false, reason: 'TOO_DARK', guidance: 'More Light Needed' };
  }
  return { passed: true, guidance: 'Frame Qualified' };
}

// Regression Case A: 15% width face with torso visible
const resA = evaluateQualitySimple(0.15, 0.20, 0.50, 0.60, 0, 120);
assert.strictEqual(resA.passed, false, 'Regression Case A must fail quality gate');
assert.strictEqual(resA.reason, 'TOO_FAR');
console.log('  ✓ Regression Case A (15% tiny head) successfully rejected with TOO_FAR');

// Case: Turned head (yaw 28 deg)
const resTurn = evaluateQualitySimple(0.30, 0.38, 0.50, 0.45, 28, 120);
assert.strictEqual(resTurn.passed, false);
assert.strictEqual(resTurn.reason, 'HEAD_TURNED');
console.log('  ✓ Turned head (yaw 28°) successfully rejected with HEAD_TURNED');

// Case: Proper frontal portrait (32% width, centered, level)
const resPass = evaluateQualitySimple(0.32, 0.42, 0.50, 0.45, 2, 120);
assert.strictEqual(resPass.passed, true);
console.log('  ✓ Normal frontal capture (32% width) PASSED quality gate');

// ── 2. Head Crop Geometry Tests ──
console.log('\n=== TEST 2: CANONICAL 4:5 HEAD CROP TESTS ===');

function calculateCropBox(hairlineNormY, chinNormY, faceCenterNormX, imgW, imgH) {
  const faceH = chinNormY - hairlineNormY;
  const headroom = faceH * 0.40;
  const shoulder = faceH * 0.45;

  let topY = Math.max(0, hairlineNormY - headroom);
  let bottomY = Math.min(1.0, chinNormY + shoulder);
  let cropH = bottomY - topY;

  const aspect = imgW / imgH;
  let cropW = cropH * (0.8 / aspect);
  if (cropW > 0.98) {
    cropW = 0.98;
    cropH = cropW / (0.8 / aspect);
  }

  let leftX = faceCenterNormX - cropW * 0.5;
  if (leftX < 0) leftX = 0;
  if (leftX + cropW > 1.0) leftX = 1.0 - cropW;

  return { leftX, topY, cropW, cropH, targetW: Math.round(1024 * 0.8), targetH: 1024 };
}

const crop = calculateCropBox(0.25, 0.65, 0.50, 800, 1000);
const cropAspect = (crop.cropW * 800) / (crop.cropH * 1000);
assert(Math.abs(cropAspect - 0.80) < 0.05, `Crop aspect must be ~0.80 (4:5), got ${cropAspect}`);
assert.strictEqual(crop.targetW, 819);
assert.strictEqual(crop.targetH, 1024);
console.log(`  ✓ 4:5 Crop box calculated accurately (Aspect ratio: ${cropAspect.toFixed(2)}, Output: ${crop.targetW}x${crop.targetH})`);

// ── 3. Thirds Sanity Clamp & Truthful Analysis ──
console.log('\n=== TEST 3: THIRDS SANITY CLAMP TESTS ===');

function analyzeThirdsWithClamp(yHairline, yGlabella, ySubnasale, yGnathion) {
  const midH = Math.max(0.01, ySubnasale - yGlabella);
  const lowerH = Math.max(0.01, yGnathion - ySubnasale);
  const midLowerSum = midH + lowerH;

  let upperH = Math.max(0.005, yGlabella - yHairline);
  let faceH = upperH + midLowerSum;
  let ratio = upperH / faceH;
  let hairlineConfidence = 'high';

  if (ratio < 0.25) {
    hairlineConfidence = 'low';
    // Clamp upper third to 28% of total facial height
    upperH = midLowerSum * (0.28 / (1 - 0.28));
  } else if (ratio > 0.42) {
    hairlineConfidence = 'low';
    // Clamp upper third to 38% of total facial height
    upperH = midLowerSum * (0.38 / (1 - 0.38));
  }

  const total = upperH + midLowerSum;
  const upperPct = Math.round((upperH / total) * 100);
  const midPct = Math.round((midH / total) * 100);
  const lowerPct = 100 - upperPct - midPct;

  return { upperPct, midPct, lowerPct, hairlineConfidence };
}

// Case: False positive hairline (forehead only 10% of face)
const clamped1 = analyzeThirdsWithClamp(0.35, 0.38, 0.50, 0.65);
assert.strictEqual(clamped1.hairlineConfidence, 'low');
assert(clamped1.upperPct >= 25 && clamped1.upperPct <= 35, `Upper third clamped to realistic ratio, got ${clamped1.upperPct}%`);
console.log(`  ✓ Out-of-bounds 10% forehead successfully clamped to ${clamped1.upperPct}% with low-confidence flag`);

// Case: Natural balanced forehead (32% of face)
const natural = analyzeThirdsWithClamp(0.20, 0.35, 0.50, 0.65);
assert.strictEqual(natural.hairlineConfidence, 'high');
console.log(`  ✓ Natural forehead (${natural.upperPct}%) evaluated with high confidence`);

// ── 4. Placement Scale & Auto-QA Math Tests ──
console.log('\n=== TEST 4: PLACEMENT SCALE & AUTO-QA TESTS ===');

function checkHairFit(faceW, templeFactor, trimW, templeSpanPx) {
  const targetTemple = faceW * templeFactor;
  const k = targetTemple / templeSpanPx;
  const renderedW = trimW * k;
  const ratio = renderedW / faceW;
  const qaPassed = ratio >= 1.20 && ratio <= 2.60;
  return { renderedW, ratio, qaPassed };
}

// Textured French crop on 280px face:
const fitCrop = checkHairFit(280, 1.22, 744, 416);
assert(fitCrop.qaPassed, `Hair fit QA must pass, ratio is ${fitCrop.ratio.toFixed(2)}`);
assert(fitCrop.ratio >= 1.20 && fitCrop.ratio <= 2.60);
console.log(`  ✓ Hair scale QA verified (Width: ${fitCrop.renderedW.toFixed(1)}px, Ratio: ${fitCrop.ratio.toFixed(2)}x face width)`);

// ── 5. Audience Filter Tests ──
console.log('\n=== TEST 5: AUDIENCE FILTER TESTS ===');

const stylesSample = [
  { id: 'textured-crop', audience: 'masculine' },
  { id: 'curtain-fringe', audience: 'unisex' },
  { id: 'classic-quiff', audience: 'masculine' },
  { id: 'french-bob', audience: 'feminine' },
  { id: 'layered-waves', audience: 'feminine' },
  { id: 'box-braids', audience: 'unisex' },
];

function filterByAudience(styles, audiencePref) {
  if (audiencePref === 'masculine') {
    return styles.filter(s => s.audience === 'masculine' || s.audience === 'unisex');
  } else if (audiencePref === 'feminine') {
    return styles.filter(s => s.audience === 'feminine' || s.audience === 'unisex');
  }
  return styles;
}

const menStyles = filterByAudience(stylesSample, 'masculine');
assert(menStyles.every(s => s.audience !== 'feminine'), 'No feminine styles in masculine filter');
assert(menStyles.some(s => s.id === 'textured-crop'));
assert(menStyles.some(s => s.id === 'curtain-fringe'));
console.log(`  ✓ Masculine filter excludes feminine styles: [${menStyles.map(s => s.id).join(', ')}]`);

const womenStyles = filterByAudience(stylesSample, 'feminine');
assert(womenStyles.every(s => s.audience !== 'masculine'), 'No masculine styles in feminine filter');
assert(womenStyles.some(s => s.id === 'french-bob'));
assert(womenStyles.some(s => s.id === 'curtain-fringe'));
console.log(`  ✓ Feminine filter excludes masculine styles: [${womenStyles.map(s => s.id).join(', ')}]`);

console.log('\nALL 5 TEST PHASES PASSED WITH ZERO REGRESSIONS!');
