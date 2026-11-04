// ══════════════════════════════════════════════════════════════════════════════
// tests/stylistUnitTests.js
// COMPREHENSIVE UNIT TEST SUITE FOR AI STYLIST & BARBER BRIEF ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import assert from 'node:assert';
import {
  get_profile,
  search_catalog,
  compare_styles,
  build_barber_brief,
} from '../src/stylist/tools.ts';

import {
  assertPrivacyGuarantees,
  runDeterministicStylist,
  STYLIST_QUICK_ACTIONS,
} from '../src/stylist/agent.ts';

import { HAIRSTYLE_CATALOG } from '../src/constants/catalog.ts';

console.log('================================================================');
console.log('🧪 RUNNING AI STYLIST & BARBER BRIEF UNIT TEST SUITE');
console.log('================================================================');

let passedTests = 0;
let totalTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

// ── 1. STYLIST TOOLS FIXTURE TESTS ───────────────────────────────────────────
console.log('\n--- 1. Pure Stylist Tools & Fixtures ---');

const mockFixtures = [
  { morphology: 'Oval', facialIndex: 88, verticalThirds: { upperThirdPct: 33, midThirdPct: 34, lowerThirdPct: 33, varianceScore: 0.01 } },
  { morphology: 'Round', facialIndex: 78, verticalThirds: { upperThirdPct: 30, midThirdPct: 37, lowerThirdPct: 33, varianceScore: 0.07 } },
  { morphology: 'Square', facialIndex: 82, verticalThirds: { upperThirdPct: 34, midThirdPct: 33, lowerThirdPct: 33, varianceScore: 0.02 } },
  { morphology: 'Oblong', facialIndex: 96, verticalThirds: { upperThirdPct: 36, midThirdPct: 31, lowerThirdPct: 33, varianceScore: 0.05 } },
  { morphology: 'Heart', facialIndex: 85, verticalThirds: { upperThirdPct: 37, midThirdPct: 33, lowerThirdPct: 30, varianceScore: 0.07 } },
];

for (const fixture of mockFixtures) {
  it(`get_profile() returns valid profile for ${fixture.morphology}`, () => {
    const profile = get_profile(fixture, 'men', 'wavy', 'medium');
    assert.strictEqual(profile.morphology, fixture.morphology);
    assert.strictEqual(profile.facialIndex, fixture.facialIndex);
    assert.ok(profile.shapeProbabilities);
    assert.ok(profile.shapeProbabilities[fixture.morphology.toLowerCase()] > 0);
    
    // Probabilities sum to approximately 1.0
    const sum = Object.values(profile.shapeProbabilities).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.05, `Probabilities sum should be ~1.0, got ${sum}`);
  });
}

it('search_catalog() correctly filters by audience and length', () => {
  const profile = get_profile(mockFixtures[0], 'men', 'straight', 'short');
  
  const menShort = search_catalog({ audience: 'men', length: 'short' }, profile);
  assert.ok(menShort.length > 0, 'Should return men short styles');
  for (const item of menShort) {
    assert.ok(item.style.audience === 'masculine' || item.style.audience === 'unisex');
    assert.strictEqual(item.style.lengthClass, 'short');
  }

  const womenLong = search_catalog({ audience: 'women', length: 'long' }, profile);
  assert.ok(womenLong.length > 0, 'Should return women long styles');
  for (const item of womenLong) {
    assert.ok(item.style.audience === 'feminine' || item.style.audience === 'unisex');
    assert.strictEqual(item.style.lengthClass, 'long');
  }
});

it('compare_styles() computes accurate differences between two catalog styles', () => {
  const profile = get_profile(mockFixtures[0], 'all', 'straight', 'medium');
  const styleA = HAIRSTYLE_CATALOG[0].id;
  const styleB = HAIRSTYLE_CATALOG[1].id;

  const comparison = compare_styles(styleA, styleB, profile);
  assert.strictEqual(comparison.styleA.id, styleA);
  assert.strictEqual(comparison.styleB.id, styleB);
  assert.ok(comparison.differentialSummary.length > 0, 'Should have differential summary');
  assert.ok(typeof comparison.styleA.topCm === 'number');
  assert.ok(typeof comparison.styleB.topCm === 'number');
  assert.ok(Array.isArray(comparison.styleA.pros));
});

it('build_barber_brief() generates fully grounded clinical brief without hallucinated numbers', () => {
  const profile = get_profile(mockFixtures[0], 'men', 'straight', 'short');
  const style = HAIRSTYLE_CATALOG[0];

  const brief = build_barber_brief(style.id, profile);
  assert.strictEqual(brief.styleId, style.id);
  assert.strictEqual(brief.styleName, style.name);
  assert.ok(brief.images.length > 0, 'Must include multi-angle images');
  
  // Zones
  assert.ok(brief.zones.top.lengthCm > 0);
  assert.ok(brief.zones.sides.lengthCm > 0);
  assert.strictEqual(brief.clipperGuards, style.barberSpec.clipperGuards);
  assert.strictEqual(brief.scissorNotes, style.barberSpec.scissorDirectives);
  assert.strictEqual(brief.finishing, style.barberSpec.finishing);

  // Script & Avoid
  assert.ok(brief.askScript.length >= 3, 'Must have at least 3 sentences to say in chair');
  assert.ok(brief.avoidList.length >= 2, 'Must have at least 2 avoid items');
  assert.ok(brief.products.length > 0, 'Must have recommended products');
});

// ── 2. HARD PRIVACY GUARANTEE TESTS ──────────────────────────────────────────
console.log('\n--- 2. Hard Privacy Guarantee Tests ---');

it('assertPrivacyGuarantees() PASSES when payload contains only clean text and measurements', () => {
  const safePayload = [
    { role: 'system', content: 'You are an AI stylist assistant.' },
    { role: 'user', content: 'Client facial index is 88.0, forehead is 33%, oval morphology.' },
  ];
  assert.doesNotThrow(() => assertPrivacyGuarantees(safePayload));
});

it('assertPrivacyGuarantees() FAILS if request body contains base64 image data', () => {
  const taintedPayload = [
    { role: 'system', content: 'You are an AI stylist assistant.' },
    { role: 'user', content: 'Here is my photo: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...' },
  ];
  assert.throws(
    () => assertPrivacyGuarantees(taintedPayload),
    /PRIVACY VIOLATION.*base64/i,
    'Should throw error on base64 payload'
  );
});

it('assertPrivacyGuarantees() FAILS if request body contains capture file names', () => {
  const taintedPayload = [
    { role: 'system', content: 'You are an AI stylist assistant.' },
    { role: 'user', content: 'Analyzed from capture_frame_9812.jpg with demo photo camera_snapshot.png' },
  ];
  assert.throws(
    () => assertPrivacyGuarantees(taintedPayload),
    /PRIVACY VIOLATION.*capture file/i,
    'Should throw error on file name payload'
  );
});

// ── 3. DETERMINISTIC OFFLINE STYLIST TESTS ───────────────────────────────────
console.log('\n--- 3. Deterministic Offline Stylist Fallback ---');

for (const action of STYLIST_QUICK_ACTIONS) {
  it(`runDeterministicStylist() handles quick action "${action}" gracefully`, () => {
    const profile = get_profile(mockFixtures[0], 'all', 'straight', 'medium');
    const result = runDeterministicStylist(action, profile);
    
    assert.strictEqual(result.badge, 'Offline stylist');
    assert.ok(result.text.length > 20, 'Response text should be substantial');
    assert.ok(result.trace && result.trace.length > 0, 'Reasoning trace must not be empty');
    
    if (action === 'Make my barber brief') {
      assert.ok(result.barberBrief, 'Should attach a structured barber brief');
      assert.ok(result.barberBrief.askScript.length >= 3);
    } else {
      assert.ok(result.styleCards && result.styleCards.length > 0, 'Should embed matching style cards');
    }
  });
}

// ── SUMMARY ──────────────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
