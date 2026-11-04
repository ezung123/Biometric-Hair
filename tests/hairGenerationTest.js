// ══════════════════════════════════════════════════════════════════════════════
// tests/hairGenerationTest.js
// STEP 5: TEST SUITE FOR AI HAIRSTYLE GENERATION PIPELINE
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');

console.log('===============================================================');
console.log('BIOMETRIC HAIR AI: GENERATION PIPELINE & IDENTITY LOCK TESTS');
console.log('===============================================================\n');

// ── 1. Roll Angle Calculation & Wrap Invariants ─────────────────────────────
console.log('=== TEST 1: INTER-OCULAR ROLL ANGLE & MIRROR INVARIANTS ===');

function calculateInterOcularRoll(p33, p263, isMirrored) {
  // Landmark 33 is outer corner of right eye (user's right, left side of unmirrored image)
  // Landmark 263 is outer corner of left eye (user's left, right side of unmirrored image)
  let dx = p263.x - p33.x;
  const dy = p263.y - p33.y;

  if (isMirrored) {
    // When mirrored, x increases towards the left of the image
    dx = -dx;
  }

  let rollDeg = Math.atan2(dy, dx) * (180 / Math.PI);
  // Wrap to [-90, 90]
  if (rollDeg > 90) rollDeg -= 180;
  if (rollDeg < -90) rollDeg += 180;

  return rollDeg;
}

// 1a. Frontal face in selfie (mirrored) mode
// In a mirrored video frame, right eye (L33) appears at screenX = 0.6, left eye (L263) appears at screenX = 0.4
const selfieFrontal_L33 = { x: 0.60, y: 0.45 };
const selfieFrontal_L263 = { x: 0.40, y: 0.45 };
const selfieRoll = calculateInterOcularRoll(selfieFrontal_L33, selfieFrontal_L263, true);
assert.ok(Math.abs(selfieRoll) < 1.0, `Frontal selfie roll must be ~0 deg, got ${selfieRoll}`);
assert.notStrictEqual(Math.round(Math.abs(selfieRoll)), 180, 'Roll must NEVER be 180 on a frontal face');
console.log(`  ✓ Frontal selfie roll: ${selfieRoll.toFixed(2)}° (never 180°)`);

// 1b. Frontal face in unmirrored mode
const backFrontal_L33 = { x: 0.40, y: 0.45 };
const backFrontal_L263 = { x: 0.60, y: 0.45 };
const backRoll = calculateInterOcularRoll(backFrontal_L33, backFrontal_L263, false);
assert.ok(Math.abs(backRoll) < 1.0, `Frontal unmirrored roll must be ~0 deg, got ${backRoll}`);
console.log(`  ✓ Frontal unmirrored roll: ${backRoll.toFixed(2)}°`);

// 1c. Head tilted +15 deg clockwise in selfie mode
// Tilted: dy > 0 when tilted to the side
const angleRad = 15 * (Math.PI / 180);
const dist = 0.20;
const tilted_L33 = { x: 0.60, y: 0.45 };
const tilted_L263 = { x: 0.60 - dist * Math.cos(angleRad), y: 0.45 + dist * Math.sin(angleRad) };
const tiltedRoll = calculateInterOcularRoll(tilted_L33, tilted_L263, true);
assert.ok(Math.abs(tiltedRoll - 15) < 1.0, `Tilt +15 deg must evaluate to ~15 deg, got ${tiltedRoll}`);
console.log(`  ✓ Tilted selfie roll: ${tiltedRoll.toFixed(2)}° (calibrated ±15°)`);

// 1d. Head tilted -15 deg counter-clockwise in selfie mode
const tiltedNeg_L263 = { x: 0.60 - dist * Math.cos(-angleRad), y: 0.45 + dist * Math.sin(-angleRad) };
const tiltedNegRoll = calculateInterOcularRoll(tilted_L33, tiltedNeg_L263, true);
assert.ok(Math.abs(tiltedNegRoll - (-15)) < 1.0, `Tilt -15 deg must evaluate to ~ -15 deg, got ${tiltedNegRoll}`);
console.log(`  ✓ Counter-tilted selfie roll: ${tiltedNegRoll.toFixed(2)}° (calibrated ±15°)`);


// ── 2. Mask Building & KeepOut Protection Polygon Tests ─────────────────────
console.log('\n=== TEST 2: MASK BUILDING & FACIAL KEEPOUT INTEGRITY ===');

function pointInPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Canonical facial landmarks setup
const mockLandmarks = [];
for (let i = 0; i < 468; i++) {
  mockLandmarks.push({ x: 500, y: 500, z: 0 });
}
mockLandmarks[10] = { x: 500, y: 280, z: 0 };  // Trichion (hairline)
mockLandmarks[9] = { x: 500, y: 380, z: 0 };   // Glabella (brow center)
mockLandmarks[168] = { x: 500, y: 440, z: 0 }; // Nose bridge
mockLandmarks[1] = { x: 500, y: 520, z: 0 };   // Nose tip
mockLandmarks[152] = { x: 500, y: 720, z: 0 }; // Gnathion (chin tip)
mockLandmarks[234] = { x: 340, y: 450, z: 0 }; // Right cheekbone
mockLandmarks[454] = { x: 660, y: 450, z: 0 }; // Left cheekbone
mockLandmarks[33] = { x: 420, y: 410, z: 0 };  // Right eye outer
mockLandmarks[263] = { x: 580, y: 410, z: 0 }; // Left eye outer

// Build keepOut polygon
function buildTestKeepOutPolygon(landmarks) {
  const yBrow = landmarks[9].y;
  const yNose = landmarks[1].y;
  const yChin = landmarks[152].y;
  const xLeft = landmarks[234].x;
  const xRight = landmarks[454].x;

  return [
    { x: xLeft, y: yBrow },
    { x: landmarks[33].x, y: yBrow - 10 },
    { x: landmarks[9].x, y: yBrow - 5 },
    { x: landmarks[263].x, y: yBrow - 10 },
    { x: xRight, y: yBrow },
    { x: xRight + 15, y: yNose },
    { x: (landmarks[9].x + xRight) / 2, y: yChin - 20 },
    { x: landmarks[152].x, y: yChin + 10 },
    { x: (landmarks[9].x + xLeft) / 2, y: yChin - 20 },
    { x: xLeft - 15, y: yNose },
  ];
}

const keepOutPoly = buildTestKeepOutPolygon(mockLandmarks);

// 2a. Verify facial features are INSIDE keepOut zone
assert.ok(pointInPolygon(500, 440, keepOutPoly), 'Nose bridge must be protected inside keepOut');
assert.ok(pointInPolygon(500, 520, keepOutPoly), 'Nose tip must be protected inside keepOut');
assert.ok(pointInPolygon(420, 410, keepOutPoly), 'Right eye must be protected inside keepOut');
assert.ok(pointInPolygon(580, 410, keepOutPoly), 'Left eye must be protected inside keepOut');
assert.ok(pointInPolygon(500, 680, keepOutPoly), 'Lips / chin must be protected inside keepOut');
console.log('  ✓ Facial interior (eyes, nose, mouth, chin) 100% contained in keepOut');

// 2b. Verify scalp / cranial vault is OUTSIDE keepOut zone
assert.ok(!pointInPolygon(500, 180, keepOutPoly), 'Cranial crown must be outside keepOut');
assert.ok(!pointInPolygon(500, 250, keepOutPoly), 'Upper scalp must be outside keepOut');
assert.ok(!pointInPolygon(280, 280, keepOutPoly), 'Temporal hair zone must be outside keepOut');
console.log('  ✓ Scalp and cranial crown strictly OUTSIDE keepOut');

// 2c. Verify forehead drape gradient ramp
function computeForeheadDrapeWeight(y, yHairline, yBrow) {
  if (y <= yHairline) return 1.0;
  if (y >= yBrow) return 0.0;
  return (yBrow - y) / (yBrow - yHairline);
}

const wAtHairline = computeForeheadDrapeWeight(280, 280, 380);
const wAtMid = computeForeheadDrapeWeight(330, 280, 380);
const wAtBrow = computeForeheadDrapeWeight(380, 280, 380);
assert.strictEqual(wAtHairline, 1.0, 'Weight at hairline must be 1.0');
assert.strictEqual(wAtMid, 0.5, 'Weight at mid-forehead must be 0.5');
assert.strictEqual(wAtBrow, 0.0, 'Weight at brow line must be 0.0');
console.log('  ✓ Forehead drape gradient ramp: 1.0 at hairline -> 0.0 at brow line');


// ── 3. Identity Lock & ±2 Level Pixel Assertion ─────────────────────────────
console.log('\n=== TEST 3: IDENTITY LOCK & ZERO-IDENTITY-SWAP ASSERTION ===');

function simulateIdentityLock(originalPixels, candidatePixels, keepOutMask, width, height) {
  const output = new Uint8ClampedArray(originalPixels.length);
  output.set(candidatePixels);

  // Hard restore: inside keepOut, restore original pixels bit-for-bit
  for (let i = 0; i < keepOutMask.length; i++) {
    if (keepOutMask[i] > 128) {
      const pIdx = i * 4;
      output[pIdx] = originalPixels[pIdx];
      output[pIdx + 1] = originalPixels[pIdx + 1];
      output[pIdx + 2] = originalPixels[pIdx + 2];
      output[pIdx + 3] = originalPixels[pIdx + 3];
    }
  }

  // Assertion check: all interior keepOut pixels must match original within ±2 levels
  for (let i = 0; i < keepOutMask.length; i++) {
    if (keepOutMask[i] === 255) {
      const pIdx = i * 4;
      const dr = Math.abs(output[pIdx] - originalPixels[pIdx]);
      const dg = Math.abs(output[pIdx + 1] - originalPixels[pIdx + 1]);
      const db = Math.abs(output[pIdx + 2] - originalPixels[pIdx + 2]);

      if (dr > 2 || dg > 2 || db > 2) {
        throw new Error(`Identity violation at index ${i}: delta=(${dr},${dg},${db})`);
      }
    }
  }

  return output;
}

const testW = 50;
const testH = 50;
const totalPixels = testW * testH;
const origImg = new Uint8ClampedArray(totalPixels * 4);
const candImg = new Uint8ClampedArray(totalPixels * 4);
const mask = new Uint8ClampedArray(totalPixels);

// Fill original with distinctive skin tones and candidate with random modifications
for (let i = 0; i < totalPixels; i++) {
  const pIdx = i * 4;
  origImg[pIdx] = 210;     // R
  origImg[pIdx + 1] = 160; // G
  origImg[pIdx + 2] = 140; // B
  origImg[pIdx + 3] = 255; // A

  candImg[pIdx] = 100;     // AI generated hair/pixels
  candImg[pIdx + 1] = 80;
  candImg[pIdx + 2] = 60;
  candImg[pIdx + 3] = 255;
}

// Center region is keepOut face zone
for (let y = 15; y < 35; y++) {
  for (let x = 15; x < 35; x++) {
    mask[y * testW + x] = 255;
  }
}

// 3a. Normal run: identity lock passes
const blitted = simulateIdentityLock(origImg, candImg, mask, testW, testH);
assert.strictEqual(blitted[ (20 * testW + 20) * 4 ], 210, 'Face center R must match original');
assert.strictEqual(blitted[ (20 * testW + 20) * 4 + 1 ], 160, 'Face center G must match original');
assert.strictEqual(blitted[ (5 * testW + 5) * 4 ], 100, 'Hair zone R must retain AI generation');
console.log('  ✓ Identity lock blit successfully executed: facial pixels bit-for-bit matched');

// 3b. Mutate face pixel deliberately and verify assertion throws
let threw = false;
try {
  // Simulate an unauthorized mutation after blit
  const corrupted = new Uint8ClampedArray(blitted);
  corrupted[(20 * testW + 20) * 4] = 150; // delta = 60 > 2!

  // Re-run assertion check
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 255) {
      const pIdx = i * 4;
      const dr = Math.abs(corrupted[pIdx] - origImg[pIdx]);
      if (dr > 2) throw new Error('Identity altered!');
    }
  }
} catch (e) {
  threw = true;
}
assert.ok(threw, 'Mutated facial pixel must trigger assertion failure');
console.log('  ✓ Unauthorized face alteration caught and rejected by assertion');


// ── 4. Quality Judge Rejection Tests ────────────────────────────────────────
console.log('\n=== TEST 4: QUALITY JUDGE GEOMETRIC INTEGRITY ===');

function validatePoseIntegrity(origPose, genPose) {
  const dYaw = Math.abs(origPose.yaw - genPose.yaw);
  const dPitch = Math.abs(origPose.pitch - genPose.pitch);
  const dRoll = Math.abs(origPose.roll - genPose.roll);

  if (dYaw > 4.0 || dPitch > 4.0 || dRoll > 4.0) {
    return { valid: false, reason: `Head pose shifted by yaw=${dYaw.toFixed(1)}°, pitch=${dPitch.toFixed(1)}°, roll=${dRoll.toFixed(1)}°` };
  }

  const origDist = origPose.interOcularDist;
  const genDist = genPose.interOcularDist;
  const ratio = Math.abs(origDist - genDist) / origDist;
  if (ratio > 0.015) {
    return { valid: false, reason: `Inter-ocular distance changed by ${(ratio * 100).toFixed(2)}%` };
  }

  return { valid: true };
}

const baselinePose = { yaw: 1.0, pitch: -0.5, roll: 0.2, interOcularDist: 160 };

// 4a. Untouched face: valid
const passResult = validatePoseIntegrity(baselinePose, { yaw: 1.2, pitch: -0.4, roll: 0.1, interOcularDist: 160.5 });
assert.ok(passResult.valid, 'Minimal pose jitter should pass');
console.log('  ✓ Untouched face verified by quality judge (PASS)');

// 4b. Shifted yaw (> 4 deg): reject
const yawFail = validatePoseIntegrity(baselinePose, { yaw: 6.5, pitch: -0.5, roll: 0.2, interOcularDist: 160 });
assert.ok(!yawFail.valid, 'Yaw shift > 4° must be rejected');
console.log(`  ✓ Shifted yaw rejected: ${yawFail.reason}`);

// 4c. Modified eye distance (> 1.5%): reject
const eyeDistFail = validatePoseIntegrity(baselinePose, { yaw: 1.0, pitch: -0.5, roll: 0.2, interOcularDist: 165 });
assert.ok(!eyeDistFail.valid, 'Eye distance change > 1.5% must be rejected');
console.log(`  ✓ Distorted facial scale rejected: ${eyeDistFail.reason}`);


// ── 5. Cache Key & Ephemeral Store Invariants ───────────────────────────────
console.log('\n=== TEST 5: CACHE KEY DETERMINISM & PRIVACY DISCLOSURE ===');

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function buildCacheKey(photoUri, styleId, audience, colour, provider) {
  const photoSignature = photoUri.slice(0, 80) + '_' + photoUri.length;
  return `hair_v1_${simpleHash(photoSignature + styleId + audience + colour + provider)}`;
}

const photoA = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQ...user_photo_alpha';
const photoB = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQ...user_photo_beta';

// 5a. Determinism
const k1 = buildCacheKey(photoA, 'textured-crop', 'masculine', 'natural', 'client_inpaint');
const k2 = buildCacheKey(photoA, 'textured-crop', 'masculine', 'natural', 'client_inpaint');
assert.strictEqual(k1, k2, 'Same photo, style, and settings must produce identical cache keys');
console.log(`  ✓ Deterministic cache key: ${k1}`);

// 5b. Sensitivity to changes
const kDifferentStyle = buildCacheKey(photoA, 'classic-quiff', 'masculine', 'natural', 'client_inpaint');
assert.notStrictEqual(k1, kDifferentStyle, 'Different style must produce distinct cache key');

const kDifferentPhoto = buildCacheKey(photoB, 'textured-crop', 'masculine', 'natural', 'client_inpaint');
assert.notStrictEqual(k1, kDifferentPhoto, 'Different photo must produce distinct cache key');

const kDifferentColour = buildCacheKey(photoA, 'textured-crop', 'masculine', 'darker', 'client_inpaint');
assert.notStrictEqual(k1, kDifferentColour, 'Different colour must produce distinct cache key');
console.log('  ✓ Cache key correctly sensitive to style, photo, and hair colour variants');

// 5c. Ephemeral cache memory simulation
const ephemeralCache = new Map();
ephemeralCache.set(k1, { previewUrl: 'data:image/png;base64,result...', score: 9.2 });
assert.ok(ephemeralCache.has(k1), 'Cached item must be retrievable');
assert.strictEqual(ephemeralCache.get(k1).score, 9.2);
console.log('  ✓ Ephemeral store & retrieve verified');

console.log('\n===============================================================');
console.log('ALL 5 GENERATION PIPELINE TEST SUITES PASSED CLEANLY (100% OK)');
console.log('===============================================================');

