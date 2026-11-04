// ══════════════════════════════════════════════════════════════════════════════
// tests/recommendationEngineTest.js
// UNIT & REGRESSION TEST SUITE FOR RECOMMENDATION ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import assert from 'node:assert';
import { computeHairstyleRecommendations } from '../src/services/recommendationEngine.ts';

console.log('===============================================================');
console.log('RECOMMENDATION ENGINE UNIT & REGRESSION TEST SUITE');
console.log('===============================================================\n');

// ── TEST 1: OBLONG FACE (Index 96.4, Upper Third 38%) ──
console.log('=== TEST 1: OBLONG MORPHOLOGY (High Upper Third) ===');
const oblongMetrics = {
  faceShape: 'Oblong',
  facialIndex: 96.4,
  verticalThirds: { upperThirdPct: 38, midThirdPct: 32, lowerThirdPct: 30 },
  goldenRatioDeviation: 0.12,
};

const resOblong = computeHairstyleRecommendations(oblongMetrics, { audience: 'masculine', length: 'all' });
assert.ok(resOblong.topPick, 'Top pick must exist');
assert.strictEqual(resOblong.rankedStyles.length, 5, 'Must return 5 ranked styles (6 total with topPick)');
assert.strictEqual(resOblong.alsoConsider.length, 2, 'Must return 2 also-consider styles');
assert.strictEqual(resOblong.lessIdeal.length, 2, 'Must return 2 less-ideal styles');

// Assert top pick is a style that balances oblong (e.g. textured-crop or caesar-crop with forward fringe)
console.log(`✓ Top Pick for Oblong: ${resOblong.topPick.style.name} (${resOblong.topPick.matchPercentage}%)`);
console.log(`  Reason: "${resOblong.topPick.primaryReason}"`);
assert.ok(resOblong.topPick.matchPercentage >= 88, 'Top match should be >= 88%');
assert.ok(resOblong.topPick.primaryReason.includes('38') || resOblong.topPick.primaryReason.includes('96.4'), 'Reason must cite measured numbers');

// Verify descending scores
for (let i = 0; i < resOblong.rankedStyles.length - 1; i++) {
  assert.ok(
    resOblong.rankedStyles[i].matchPercentage >= resOblong.rankedStyles[i + 1].matchPercentage,
    `Scores must descend: ${resOblong.rankedStyles[i].matchPercentage} >= ${resOblong.rankedStyles[i + 1].matchPercentage}`
  );
}
console.log('✓ Score descending invariant PASSED');

// ── TEST 2: ROUND FACE (Index 77.2, Compact Proportions) ──
console.log('\n=== TEST 2: ROUND MORPHOLOGY (Compact Proportions) ===');
const roundMetrics = {
  faceShape: 'Round',
  facialIndex: 77.2,
  verticalThirds: { upperThirdPct: 31, midThirdPct: 35, lowerThirdPct: 34 },
  goldenRatioDeviation: 0.15,
};

const resRound = computeHairstyleRecommendations(roundMetrics, { audience: 'masculine', length: 'all' });
console.log(`✓ Top Pick for Round: ${resRound.topPick.style.name} (${resRound.topPick.matchPercentage}%)`);
console.log(`  Reason: "${resRound.topPick.primaryReason}"`);
assert.ok(resRound.topPick.primaryReason.includes('77.2'), 'Reason must cite Round facial index');
assert.ok(resRound.lessIdeal[0].contrastReason.includes('Round'), 'Less ideal must explain why it conflicts with Round face');
console.log(`  Less Ideal: ${resRound.lessIdeal[0].style.name} -> "${resRound.lessIdeal[0].contrastReason}"`);

// ── TEST 3: AUDIENCE FILTER IS STRICTLY RESPECTED ──
console.log('\n=== TEST 3: AUDIENCE FILTER IS STRICTLY RESPECTED ===');
const resFeminine = computeHairstyleRecommendations(roundMetrics, { audience: 'feminine', length: 'all' });
const masculineFoundInFem = [resFeminine.topPick, ...resFeminine.rankedStyles, ...resFeminine.alsoConsider].filter(
  (s) => s.style.audience === 'masculine'
);
assert.strictEqual(masculineFoundInFem.length, 0, 'Zero masculine styles allowed when audience is feminine');
console.log('✓ Feminine filter strictly excludes masculine styles');

const resMasculine = computeHairstyleRecommendations(roundMetrics, { audience: 'masculine', length: 'all' });
const feminineFoundInMasc = [resMasculine.topPick, ...resMasculine.rankedStyles, ...resMasculine.alsoConsider].filter(
  (s) => s.style.audience === 'feminine'
);
assert.strictEqual(feminineFoundInMasc.length, 0, 'Zero feminine styles allowed when audience is masculine');
console.log('✓ Masculine filter strictly excludes feminine styles');

// ── TEST 4: LENGTH FILTERING ──
console.log('\n=== TEST 4: LENGTH FILTERING ===');
const resShort = computeHairstyleRecommendations(oblongMetrics, { audience: 'masculine', length: 'short' });
console.log(`✓ Short filter Top Pick: ${resShort.topPick.style.name} (${resShort.topPick.style.lengthClass})`);
assert.strictEqual(resShort.topPick.style.lengthClass, 'short', 'Top pick must match requested length class');

console.log('\n===============================================================');
console.log('✅ ALL RECOMMENDATION ENGINE UNIT TESTS PASSED (100% OK)');
console.log('===============================================================');
