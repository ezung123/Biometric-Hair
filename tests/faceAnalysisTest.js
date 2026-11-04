// ══════════════════════════════════════════════════════════════════════════════
// tests/faceAnalysisTest.js
// UNIT TEST SUITE FOR CALIBRATED REAL-WORLD 2D PIXEL CEPHALOMETRIC ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import { analyzeFaceTruthful } from '../src/lib/faceAnalysis.ts';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('===============================================================');
console.log('FACE ANALYSIS & CEPHALOMETRIC ENGINE TEST SUITE');
console.log('===============================================================\n');

function makeLandmarks(pts) {
  const lm = [];
  for (let i = 0; i < 478; i++) {
    lm.push({ x: 0.5, y: 0.5, z: 0 });
  }
  Object.keys(pts).forEach((k) => {
    lm[Number(k)] = pts[k];
  });
  return lm;
}

// ── TEST 1: ALL 5 MORPHOLOGIES DETECTED ACCURATELY ───────────────────────────
console.log('=== TEST 1: MORPHOLOGY CLASSIFICATION ===');

// 1. Oval Archetype (Balanced neoclassical 1.30 ratio, gentle cheek taper)
const ovalLm = makeLandmarks({
  10:  { x: 500, y: 150 }, // Trichion
  151: { x: 500, y: 250 }, // Glabella
  2:   { x: 500, y: 350 }, // Subnasale
  152: { x: 500, y: 450 }, // Gnathion
  234: { x: 385, y: 300 }, // R Zygoma
  454: { x: 615, y: 300 }, // L Zygoma
  127: { x: 405, y: 200 }, // R Temple
  356: { x: 595, y: 200 }, // L Temple
  172: { x: 410, y: 400 }, // R Jaw
  397: { x: 590, y: 400 }, // L Jaw
});
const ovalRes = analyzeFaceTruthful(ovalLm, 1000, 1000);
console.log('  Oval Result:', ovalRes.morphology, ovalRes.scientificName, 'Index:', ovalRes.facialIndex, 'Harmony:', ovalRes.harmonyScore);
assert(ovalRes.morphology === 'Oval', `Expected Oval, got ${ovalRes.morphology}`);

// 2. Round Archetype (Compact height-to-width ratio, soft jaw)
const roundLm = makeLandmarks({
  10:  { x: 500, y: 180 },
  151: { x: 500, y: 260 },
  2:   { x: 500, y: 340 },
  152: { x: 500, y: 420 },
  234: { x: 370, y: 300 },
  454: { x: 630, y: 300 },
  127: { x: 400, y: 220 },
  356: { x: 600, y: 220 },
  172: { x: 415, y: 380 },
  397: { x: 585, y: 380 },
});
const roundRes = analyzeFaceTruthful(roundLm, 1000, 1000);
console.log('  Round Result:', roundRes.morphology, roundRes.scientificName, 'Index:', roundRes.facialIndex, 'Harmony:', roundRes.harmonyScore);
assert(roundRes.morphology === 'Round', `Expected Round, got ${roundRes.morphology}`);

// 3. Square Archetype (Compact/balanced height, strong wide jaw >= 82% cheek width)
const squareLm = makeLandmarks({
  10:  { x: 500, y: 180 },
  151: { x: 500, y: 265 },
  2:   { x: 500, y: 350 },
  152: { x: 500, y: 435 },
  234: { x: 375, y: 300 },
  454: { x: 625, y: 300 },
  127: { x: 380, y: 220 },
  356: { x: 620, y: 220 },
  172: { x: 385, y: 390 },
  397: { x: 615, y: 390 },
});
const squareRes = analyzeFaceTruthful(squareLm, 1000, 1000);
console.log('  Square Result:', squareRes.morphology, squareRes.scientificName, 'Index:', squareRes.facialIndex, 'Harmony:', squareRes.harmonyScore);
assert(squareRes.morphology === 'Square', `Expected Square, got ${squareRes.morphology}`);

// 4. Oblong Archetype (Vertical height dominates width, height/width > 1.45)
const oblongLm = makeLandmarks({
  10:  { x: 500, y: 120 },
  151: { x: 500, y: 240 },
  2:   { x: 500, y: 360 },
  152: { x: 500, y: 480 },
  234: { x: 385, y: 300 },
  454: { x: 615, y: 300 },
  127: { x: 395, y: 180 },
  356: { x: 605, y: 180 },
  172: { x: 405, y: 420 },
  397: { x: 595, y: 420 },
});
const oblongRes = analyzeFaceTruthful(oblongLm, 1000, 1000);
console.log('  Oblong Result:', oblongRes.morphology, oblongRes.scientificName, 'Index:', oblongRes.facialIndex, 'Harmony:', oblongRes.harmonyScore);
assert(oblongRes.morphology === 'Oblong', `Expected Oblong, got ${oblongRes.morphology}`);

// 5. Heart Archetype (Wide forehead/temple tapering to narrow jaw & delicate chin)
const heartLm = makeLandmarks({
  10:  { x: 500, y: 150 },
  151: { x: 500, y: 250 },
  2:   { x: 500, y: 345 },
  152: { x: 500, y: 435 },
  234: { x: 385, y: 290 },
  454: { x: 615, y: 290 },
  127: { x: 375, y: 200 },
  356: { x: 625, y: 200 },
  172: { x: 435, y: 390 },
  397: { x: 565, y: 390 },
});
const heartRes = analyzeFaceTruthful(heartLm, 1000, 1000);
console.log('  Heart Result:', heartRes.morphology, heartRes.scientificName, 'Index:', heartRes.facialIndex, 'Harmony:', heartRes.harmonyScore);
assert(heartRes.morphology === 'Heart', `Expected Heart, got ${heartRes.morphology}`);
console.log('  ✓ All 5 face morphologies classified with 100% accuracy.\n');

// ── TEST 2: ASPECT-RATIO INVARIANCE ──────────────────────────────────────────
console.log('=== TEST 2: ASPECT-RATIO INVARIANCE ===');
// A normalized landmark set representing an Oval face in a 16:9 landscape webcam (1920 x 1080)
const normLandscapeOval = makeLandmarks({
  10:  { x: 500 / 1920, y: 150 / 1080 },
  151: { x: 500 / 1920, y: 250 / 1080 },
  2:   { x: 500 / 1920, y: 350 / 1080 },
  152: { x: 500 / 1920, y: 450 / 1080 },
  234: { x: 385 / 1920, y: 300 / 1080 },
  454: { x: 615 / 1920, y: 300 / 1080 },
  127: { x: 405 / 1920, y: 200 / 1080 },
  356: { x: 595 / 1920, y: 200 / 1080 },
  172: { x: 410 / 1920, y: 400 / 1080 },
  397: { x: 590 / 1920, y: 400 / 1080 },
});

const landscapeRes = analyzeFaceTruthful(normLandscapeOval, 1920, 1080);
console.log('  16:9 Landscape Oval Result:', landscapeRes.morphology, 'Index:', landscapeRes.facialIndex);
assert(landscapeRes.morphology === 'Oval', 'Landscape 16:9 frame must NOT distort Oval into Oblong!');
assert(Math.abs(landscapeRes.facialIndex - ovalRes.facialIndex) < 1.0, 'Facial index must be aspect-invariant!');
console.log('  ✓ 16:9 Landscape camera correctly calibrated without vertical squashing or stretching.\n');

// ── TEST 3: HARMONY SCORE CORRELATION WITH THIRDS VARIANCE ───────────────────
console.log('=== TEST 3: HARMONY SCORE CORRELATION ===');
// Perfectly even thirds (33.3% each) -> High harmony
const evenLm = makeLandmarks({
  10:  { x: 500, y: 100 },
  151: { x: 500, y: 200 },
  2:   { x: 500, y: 300 },
  152: { x: 500, y: 400 },
  234: { x: 385, y: 250 },
  454: { x: 615, y: 250 },
});
const evenRes = analyzeFaceTruthful(evenLm, 1000, 1000);

// Highly skewed thirds (45% upper, 35% mid, 20% lower) -> Low harmony
const skewedLm = makeLandmarks({
  10:  { x: 500, y: 100 },
  151: { x: 500, y: 240 },
  2:   { x: 500, y: 340 },
  152: { x: 500, y: 400 },
  234: { x: 385, y: 250 },
  454: { x: 615, y: 250 },
});
const skewedRes = analyzeFaceTruthful(skewedLm, 1000, 1000);

console.log(`  Even Thirds Harmony: ${evenRes.harmonyScore}% (Thirds: ${evenRes.thirds.upper}/${evenRes.thirds.mid}/${evenRes.thirds.lower})`);
console.log(`  Skewed Thirds Harmony: ${skewedRes.harmonyScore}% (Thirds: ${skewedRes.thirds.upper}/${skewedRes.thirds.mid}/${skewedRes.thirds.lower})`);
assert(evenRes.harmonyScore > skewedRes.harmonyScore, 'Even thirds must produce higher harmony score than skewed thirds!');
assert(skewedRes.harmonyScore !== 45, 'Harmony score must reflect actual variance, not hardcoded 45%!');
console.log('  ✓ Harmony score mathematically grounded in actual Farkas thirds variance.\n');

console.log('===============================================================');
console.log('✅ ALL FACE ANALYSIS TESTS PASSED (100% OK)');
console.log('===============================================================');

