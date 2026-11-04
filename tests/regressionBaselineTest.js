// ══════════════════════════════════════════════════════════════════════════════
// tests/regressionBaselineTest.js
// STEP 0 SAFETY NET: REGRESSION TEST SUITE LOCKING BASELINE BEHAVIOR
// ══════════════════════════════════════════════════════════════════════════════

import { analyzeFaceTruthful } from '../src/lib/faceAnalysis.ts';
import { filterAndRank, matchesAudience, matchesLength } from '../src/lib/filterStyles.ts';
import { HAIRSTYLE_CATALOG } from '../src/constants/catalog.ts';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ REGRESSION ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('===============================================================');
console.log('STEP 0 REGRESSION TEST SUITE: LOCKING BASELINE BEHAVIOR');
console.log('===============================================================\n');

function makeLandmarks(pts) {
  const lm = [];
  for (let i = 0; i < 478; i++) lm.push({ x: 0.5, y: 0.5, z: 0 });
  Object.keys(pts).forEach((k) => { lm[Number(k)] = pts[k]; });
  return lm;
}

// ── PART A: ANALYSIS FIXTURES BASELINE LOCK ─────────────────────────────────
console.log('=== PART A: CEPHALOMETRIC ANALYSIS FIXTURES & PICKS ===');

// 1. Oval Fixture
const ovalLm = makeLandmarks({
  10: { x: 500, y: 150 }, 151: { x: 500, y: 250 }, 2: { x: 500, y: 350 }, 152: { x: 500, y: 450 },
  234: { x: 385, y: 300 }, 454: { x: 615, y: 300 }, 127: { x: 405, y: 200 }, 356: { x: 595, y: 200 },
  172: { x: 410, y: 400 }, 397: { x: 590, y: 400 },
});
const oval = analyzeFaceTruthful(ovalLm, 1000, 1000);
assert(oval.morphology === 'Oval', `Oval morphology regressed: got ${oval.morphology}`);
assert(oval.facialIndex === 87, `Oval facialIndex regressed: got ${oval.facialIndex}`);
assert(oval.harmonyScore === 98, `Oval harmonyScore regressed: got ${oval.harmonyScore}`);
const ovalTop3 = oval.styleMatches.slice(0, 3).map((m) => m.style.id);
console.log('  ✓ Oval Fixture:', oval.morphology, 'Top 3:', ovalTop3.join(', '));
assert(ovalTop3.includes('textured-crop'), 'Oval picks must include textured-crop');

// 2. Round Fixture (from faceAnalysisTest.js)
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
const round = analyzeFaceTruthful(roundLm, 1000, 1000);
assert(round.morphology === 'Round', `Round morphology regressed: got ${round.morphology}`);
assert(round.facialIndex === 72, `Round facialIndex regressed: got ${round.facialIndex}`);
const roundTop3 = round.styleMatches.slice(0, 3).map((m) => m.style.id);
console.log('  ✓ Round Fixture:', round.morphology, 'Top 3:', roundTop3.join(', '));
assert(roundTop3.includes('angular-quiff') || roundTop3.includes('sleek-pixie'), 'Round picks must include high-volume top picks');

// 3. Square Fixture (from faceAnalysisTest.js)
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
const square = analyzeFaceTruthful(squareLm, 1000, 1000);
assert(square.morphology === 'Square', `Square morphology regressed: got ${square.morphology}`);
const squareTop3 = square.styleMatches.slice(0, 3).map((m) => m.style.id);
console.log('  ✓ Square Fixture:', square.morphology, 'Top 3:', squareTop3.join(', '));

// 4. Oblong Fixture
const oblongLm = makeLandmarks({
  10: { x: 500, y: 120 }, 151: { x: 500, y: 240 }, 2: { x: 500, y: 360 }, 152: { x: 500, y: 480 },
  234: { x: 395, y: 300 }, 454: { x: 605, y: 300 }, 127: { x: 405, y: 180 }, 356: { x: 595, y: 180 },
  172: { x: 410, y: 420 }, 397: { x: 590, y: 420 },
});
const oblong = analyzeFaceTruthful(oblongLm, 1000, 1000);
assert(oblong.morphology === 'Oblong', `Oblong morphology regressed: got ${oblong.morphology}`);
assert(oblong.facialIndex === 104, `Oblong facialIndex regressed: got ${oblong.facialIndex}`);
const oblongTop3 = oblong.styleMatches.slice(0, 3).map((m) => m.style.id);
console.log('  ✓ Oblong Fixture:', oblong.morphology, 'Top 3:', oblongTop3.join(', '));
assert(oblongTop3.includes('curtain-fringe') || oblongTop3.includes('french-bob'), 'Oblong picks must include horizontal compensation');

// 5. Heart Fixture
const heartLm = makeLandmarks({
  10: { x: 500, y: 160 }, 151: { x: 500, y: 250 }, 2: { x: 500, y: 340 }, 152: { x: 500, y: 440 },
  234: { x: 375, y: 290 }, 454: { x: 625, y: 290 }, 127: { x: 365, y: 200 }, 356: { x: 635, y: 200 },
  172: { x: 430, y: 390 }, 397: { x: 570, y: 390 },
});
const heart = analyzeFaceTruthful(heartLm, 1000, 1000);
assert(heart.morphology === 'Heart', `Heart morphology regressed: got ${heart.morphology}`);
const heartTop3 = heart.styleMatches.slice(0, 3).map((m) => m.style.id);
console.log('  ✓ Heart Fixture:', heart.morphology, 'Top 3:', heartTop3.join(', '));

// ── PART B: FILTER & VIEW TOGGLE BASELINE LOCK ──────────────────────────────
console.log('\n=== PART B: FILTER & VIEW-TOGGLE LOGIC BASELINE ===');

const audiences = ['men', 'women', 'all'];
const lengths = ['all', 'short', 'medium', 'long'];

for (const a of audiences) {
  for (const l of lengths) {
    const res = filterAndRank(HAIRSTYLE_CATALOG, { audience: a, length: l }, oval);
    assert(res && Array.isArray(res.rankedStyles), 'Result must have rankedStyles array');
    // Verify each style matches constraints
    for (const item of res.rankedStyles) {
      assert(matchesAudience(item.style, a), `Style ${item.style.id} does not match audience ${a}`);
      assert(matchesLength(item.style, l), `Style ${item.style.id} does not match length ${l}`);
    }
  }
}
console.log('  ✓ All 12 audience x length filter combinations strictly verified.');

// Verify multi-angle lookbook coverage
for (const style of HAIRSTYLE_CATALOG) {
  assert(style.images.length === 3, `Style ${style.id} must have exactly 3 views`);
  const views = style.images.map((img) => img.view);
  assert(views.includes('front') && views.includes('side') && views.includes('back'), `Style ${style.id} must have front, side, and back views`);
}
console.log(`  ✓ All ${HAIRSTYLE_CATALOG.length} catalog styles verified with complete front/side/back views.`);

console.log('\n===============================================================');
console.log('✅ STEP 0 REGRESSION BASELINE LOCKED AND 100% PASSING');
console.log('===============================================================');
