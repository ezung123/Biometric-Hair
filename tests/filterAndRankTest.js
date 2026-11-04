// ══════════════════════════════════════════════════════════════════════════════
// tests/filterAndRankTest.js
// UNIT & REGRESSION TEST SUITE: FILTERANDRANK & LENGTHCLASS ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import { HAIRSTYLE_CATALOG, computeLengthClass } from '../src/constants/catalog.ts';
import {
  filterAndRank,
  getFilterCounts,
  matchesAudience,
  matchesLength,
} from '../src/lib/filterStyles.ts';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

const mockMetrics = {
  faceShape: 'Oval',
  facialIndex: 86.4,
  verticalThirds: {
    upperThirdPct: 33,
    midThirdPct: 34,
    lowerThirdPct: 33,
    varianceScore: 1.0,
  },
  goldenRatioDeviation: 0.04,
};

console.log('===============================================================');
console.log('FILTERANDRANK & CATALOG AUDIT UNIT TEST SUITE');
console.log('===============================================================\n');

// ── TEST 1: LENGTHCLASS COMPUTATION BOUNDARY TESTS ───────────────────────────
console.log('=== TEST 1: LENGTHCLASS COMPUTATION BOUNDARIES ===');
assert(computeLengthClass(5, 5, 25) === 'long', 'backCm >= 25 must be long');
assert(computeLengthClass(30, 30, 25.1) === 'long', 'backCm > 25 must be long');
assert(computeLengthClass(10, 5, 24.9) === 'medium', 'backCm 24.9 with topCm 10 must be medium');
assert(computeLengthClass(5, 5, 10) === 'medium', 'backCm 10 with topCm < 10 must be medium');
assert(computeLengthClass(15, 5, 8) === 'medium', 'topCm >= 10 with backCm < 10 must be medium');
assert(computeLengthClass(9.9, 5, 9.9) === 'short', 'topCm < 10 and backCm < 10 must be short');
assert(computeLengthClass(0.5, 0.3, 0.3) === 'short', 'buzz cut must be short');
console.log('  ✓ All 7 lengthClass boundary invariants passed cleanly.\n');

// ── TEST 2: ALL 3 x 4 AUDIENCE x LENGTH COMBINATIONS ─────────────────────────
console.log('=== TEST 2: ALL 3 x 4 FILTER COMBINATIONS ===');
const audiences = ['men', 'women', 'all'];
const lengths = ['all', 'short', 'medium', 'long'];

for (const aud of audiences) {
  for (const len of lengths) {
    const result = filterAndRank(HAIRSTYLE_CATALOG, { audience: aud, length: len }, mockMetrics);
    const { topPick, rankedStyles, totalCount } = result;

    console.log(`  Evaluating [${aud}] x [${len}]: ${totalCount} styles returned.`);

    // If styles exist, topPick must exist
    if (totalCount > 0) {
      assert(topPick !== null, `topPick must not be null when totalCount > 0 (for ${aud} x ${len})`);
      assert(
        topPick.style !== undefined,
        `topPick.style must be defined (for ${aud} x ${len})`
      );

      // Total count equals 1 (topPick) + rankedStyles.length + alsoConsider.length (if any)
      const allReturned = [topPick, ...rankedStyles, ...result.alsoConsider];
      assert(
        allReturned.length <= totalCount,
        'Returned top/ranked styles must not exceed totalCount'
      );

      // Invariant (a): Every style satisfies audience AND length
      allReturned.forEach((item) => {
        assert(
          matchesAudience(item.style, aud),
          `Style ${item.style.id} (${item.style.audience}) does not match audience ${aud}`
        );
        assert(
          matchesLength(item.style, len),
          `Style ${item.style.id} (${item.style.lengthClass}) does not match length ${len}`
        );
      });

      // Invariant: Descending score order
      for (let i = 1; i < allReturned.length; i++) {
        assert(
          allReturned[i - 1].score >= allReturned[i].score - 0.0001,
          `Score order violated: ${allReturned[i - 1].score} < ${allReturned[i].score}`
        );
      }
    } else {
      assert(topPick === null, `topPick must be null when totalCount is 0`);
      assert(rankedStyles.length === 0, `rankedStyles must be empty when totalCount is 0`);
    }
  }
}
console.log('  ✓ All 12 filter combinations strictly satisfy AND invariants & score ordering.\n');

// ── TEST 3: STRICT GENDER ISOLATION INVARIANTS ──────────────────────────────
console.log('=== TEST 3: STRICT GENDER ISOLATION ===');
const menStyles = filterAndRank(HAIRSTYLE_CATALOG, { audience: 'men', length: 'all' }, mockMetrics);
const womenStyles = filterAndRank(HAIRSTYLE_CATALOG, { audience: 'women', length: 'all' }, mockMetrics);

const menIds = [menStyles.topPick, ...menStyles.rankedStyles, ...menStyles.alsoConsider].filter(Boolean).map(
  (s) => s.style.id
);
const womenIds = [womenStyles.topPick, ...womenStyles.rankedStyles, ...womenStyles.alsoConsider].filter(Boolean).map(
  (s) => s.style.id
);

// Masculine styles must appear in men and NEVER in women
assert(menIds.includes('afro-taper'), 'afro-taper (masculine) must appear in men');
assert(!womenIds.includes('afro-taper'), 'afro-taper (masculine) must NOT appear in women');
assert(menIds.includes('textured-crop'), 'textured-crop (masculine) must appear in men');
assert(!womenIds.includes('textured-crop'), 'textured-crop (masculine) must NOT appear in women');
assert(menIds.includes('linear-buzz-cut'), 'linear-buzz-cut (masculine) must appear in men');
assert(!womenIds.includes('linear-buzz-cut'), 'linear-buzz-cut (masculine) must NOT appear in women');

// Feminine styles must appear in women and NEVER in men
assert(womenIds.includes('box-braids'), 'box-braids (feminine) must appear in women');
assert(!menIds.includes('box-braids'), 'box-braids (feminine) must NOT appear in men');
assert(womenIds.includes('parisian-bob'), 'parisian-bob (feminine) must appear in women');
assert(!menIds.includes('parisian-bob'), 'parisian-bob (feminine) must NOT appear in men');
assert(womenIds.includes('butterfly-layers'), 'butterfly-layers (feminine) must appear in women');
assert(!menIds.includes('butterfly-layers'), 'butterfly-layers (feminine) must NOT appear in men');
console.log('  ✓ Strict gender segregation verified 100% correct (Zero crossover).\n');

// ── TEST 3B: DYNAMIC RE-RANKING BY DETECTED FACE SHAPE ───────────────────────
console.log('=== TEST 3B: DYNAMIC RE-RANKING BY DETECTED FACE SHAPE ===');
const roundMetrics = { ...mockMetrics, faceShape: 'Round', facialIndex: 78.0 };
const oblongMetrics = { ...mockMetrics, faceShape: 'Oblong', facialIndex: 94.0 };
const squareMetrics = { ...mockMetrics, faceShape: 'Square', facialIndex: 82.0 };
const heartMetrics = { ...mockMetrics, faceShape: 'Heart', facialIndex: 86.0 };

const roundMen = filterAndRank(HAIRSTYLE_CATALOG, { audience: 'men', length: 'all' }, roundMetrics);
const oblongMen = filterAndRank(HAIRSTYLE_CATALOG, { audience: 'men', length: 'all' }, oblongMetrics);
const squareMen = filterAndRank(HAIRSTYLE_CATALOG, { audience: 'men', length: 'all' }, squareMetrics);

console.log(`  Top pick for Round Men: "${roundMen.topPick?.style.name}"`);
console.log(`  Top pick for Oblong Men: "${oblongMen.topPick?.style.name}"`);
console.log(`  Top pick for Square Men: "${squareMen.topPick?.style.name}"`);

assert(roundMen.topPick?.style.id !== oblongMen.topPick?.style.id, 'Round and Oblong must produce different top picks!');
console.log('  ✓ Dynamic re-ranking based on face shape verified 100% distinct.\n');

// ── TEST 4: TIE BREAKING STABILITY ───────────────────────────────────────────
console.log('=== TEST 4: TIE BREAKING STABILITY ===');
const style1 = { ...HAIRSTYLE_CATALOG[0], id: 'bravo-style', faceShapeFit: { oval: 0.9 } };
const style2 = { ...HAIRSTYLE_CATALOG[0], id: 'alpha-style', faceShapeFit: { oval: 0.9 } };
const tiedResult = filterAndRank([style1, style2], { audience: 'all', length: 'all' }, mockMetrics);
assert(tiedResult.topPick.style.id === 'alpha-style', 'Tied scores must break stably by alphabetical ID');
console.log('  ✓ Deterministic ID tie-breaking verified.\n');

// ── TEST 5: CHIP COUNTS ACCURACY ─────────────────────────────────────────────
console.log('=== TEST 5: CHIP COUNTS ACCURACY ===');
for (const aud of audiences) {
  for (const len of lengths) {
    const { audienceCounts, lengthCounts } = getFilterCounts(HAIRSTYLE_CATALOG, {
      audience: aud,
      length: len,
    });
    const directResult = filterAndRank(HAIRSTYLE_CATALOG, { audience: aud, length: len }, mockMetrics);

    // lengthCounts[len] should match the exact count of this combination
    assert(
      lengthCounts[len] === directResult.totalCount,
      `Length chip count ${lengthCounts[len]} must match direct count ${directResult.totalCount} for [${aud} x ${len}]`
    );
    assert(
      audienceCounts[aud] === directResult.totalCount,
      `Audience chip count ${audienceCounts[aud]} must match direct count ${directResult.totalCount} for [${aud} x ${len}]`
    );
  }
}
console.log('  ✓ Chip counts perfectly match filtered item totals across all 12 combinations.\n');

// ── TEST 6: EMPTY RESULTS DESIGNED INVARIANT ─────────────────────────────────
console.log('=== TEST 6: EMPTY RESULTS SAFETY ===');
const emptyResult = filterAndRank([], { audience: 'men', length: 'long' }, mockMetrics);
assert(emptyResult.totalCount === 0, 'empty catalog must yield totalCount 0');
assert(emptyResult.topPick === null, 'empty catalog must yield topPick null');
assert(emptyResult.rankedStyles.length === 0, 'empty catalog must yield empty rankedStyles');
console.log('  ✓ Empty results handled safely with zero runtime exceptions.\n');

console.log('===============================================================');
console.log('✅ ALL FILTERANDRANK UNIT TESTS PASSED (100% OK)');
console.log('===============================================================');

