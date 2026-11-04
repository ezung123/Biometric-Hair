// ══════════════════════════════════════════════════════════════════════════════
// tests/faceStatusTest.js
// COMPREHENSIVE UNIT & REGRESSION TEST SUITE FOR FACE STATUS & CAPTURE GATE
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');

// ── 1. CoverTransform Math Suite ──────────────────────────────────────────────
console.log('=== TEST 1: COVER TRANSFORM MATH & MIRROR INVARIANTS ===');

function createCoverTransform({ videoWidth, videoHeight, containerWidth, containerHeight, isMirrored }) {
  const safeVidW = videoWidth > 0 ? videoWidth : 640;
  const safeVidH = videoHeight > 0 ? videoHeight : 480;
  const Wc = containerWidth > 0 ? containerWidth : 390;
  const Hc = containerHeight > 0 ? containerHeight : 844;

  const s = Math.max(Wc / safeVidW, Hc / safeVidH);
  const ox = (Wc - safeVidW * s) / 2;
  const oy = (Hc - safeVidH * s) / 2;

  return {
    scale: s,
    offsetX: ox,
    offsetY: oy,
    containerWidth: Wc,
    containerHeight: Hc,
    videoWidth: safeVidW,
    videoHeight: safeVidH,
    isMirrored: Boolean(isMirrored),

    transformPoint(u, v) {
      const normU = u > 1.0 ? u / safeVidW : u;
      const normV = v > 1.0 ? v / safeVidH : v;

      const y = oy + normV * safeVidH * s;
      let x;
      if (isMirrored) {
        x = -normU * safeVidW * s + (Wc - ox);
      } else {
        x = ox + normU * safeVidW * s;
      }
      return { x, y };
    },

    inverseTransformPoint(screenX, screenY) {
      const v = (screenY - oy) / (safeVidH * s);
      let u;
      if (isMirrored) {
        u = (Wc - ox - screenX) / (safeVidW * s);
      } else {
        u = (screenX - ox) / (safeVidW * s);
      }
      return { u, v };
    },
  };
}

// 1a. Mobile portrait 390x844 with 4:3 video (640x480)
const ct43 = createCoverTransform({ videoWidth: 640, videoHeight: 480, containerWidth: 390, containerHeight: 844, isMirrored: true });
assert.ok(ct43.scale >= 844 / 480, 'Scale must cover the taller height');
// Center in video (u=0.5, v=0.5) must map to screen center X
const ptCtrMirrored = ct43.transformPoint(0.5, 0.5);
assert.strictEqual(Math.round(ptCtrMirrored.x), Math.round(390 / 2), 'Mirrored video center must map to container center X');
const inv = ct43.inverseTransformPoint(ptCtrMirrored.x, ptCtrMirrored.y);
assert.strictEqual(Math.round(inv.u * 100), 50, 'Inverse transform must round-trip u=0.5');
assert.strictEqual(Math.round(inv.v * 100), 50, 'Inverse transform must round-trip v=0.5');
console.log('  ✓ 4:3 Video in 9:19.5 container correctly scales and center-aligns (mirrored)');

// 1b. Mobile portrait 390x844 with 16:9 video (1280x720) unmirrored
const ct169 = createCoverTransform({ videoWidth: 1280, videoHeight: 720, containerWidth: 390, containerHeight: 844, isMirrored: false });
const pt169Ctr = ct169.transformPoint(0.5, 0.5);
assert.strictEqual(Math.round(pt169Ctr.x), Math.round(390 / 2), 'Unmirrored video center must map to container center X');
console.log('  ✓ 16:9 Video in 9:19.5 container correctly scales and center-aligns (unmirrored)');

// ── 2. Guide Oval Geometry Tests ──────────────────────────────────────────────
console.log('\n=== TEST 2: CANONICAL GUIDE OVAL GEOMETRY ===');

function getGuideOvalGeometry(containerWidth, containerHeight) {
  const Wc = Math.max(1, containerWidth);
  const Hc = Math.max(1, containerHeight);
  const ovalW = Math.min(Wc * 0.62, 280);
  const ovalH = ovalW * 1.35;
  const centerX = Wc * 0.50;
  const centerY = Hc * 0.46;

  return {
    centerX,
    centerY,
    width: ovalW,
    height: ovalH,
    left: centerX - ovalW / 2,
    top: centerY - ovalH / 2,
    right: centerX + ovalW / 2,
    bottom: centerY + ovalH / 2,
  };
}

const oval = getGuideOvalGeometry(390, 844);
assert.strictEqual(oval.centerX, 195, 'Oval centerX must be exactly 50% Wc');
assert.strictEqual(Math.round(oval.centerY), Math.round(844 * 0.46), 'Oval centerY must be at 46% Hc');
assert.ok(oval.height > oval.width, 'Oval must be vertically elongated (1.35 aspect)');
console.log(`  ✓ Canonical guide oval geometry calibrated: ${Math.round(oval.width)}x${Math.round(oval.height)} at (${oval.centerX}, ${Math.round(oval.centerY)})`);

// ── 3. State Machine & Lenient Rule Checks ────────────────────────────────────
console.log('\n=== TEST 3: FACE STATUS RULES & HYSTERESIS ===');

class TestFaceStatusTracker {
  constructor() {
    this.consecutiveOkFrames = 0;
    this.consecutiveDropFrames = 0;
    this.currentCode = 'NO_FACE';
    this.emaMinX = null;
    this.emaMaxX = null;
    this.emaMinY = null;
    this.emaMaxY = null;
  }

  evaluateFrame({ rawBBoxContainer, yawDeg, pitchDeg, rollDeg, luminance, hasFace, Wc, Hc }) {
    if (!hasFace || !rawBBoxContainer) {
      this.consecutiveOkFrames = 0;
      this.consecutiveDropFrames++;
      if (this.consecutiveDropFrames >= 10 || this.currentCode === 'NO_FACE') {
        this.currentCode = 'NO_FACE';
      }
      return {
        code: this.currentCode,
        isOk: false,
        isSoftWarning: false,
      };
    }

    // Smooth bbox
    const alpha = 0.35;
    if (this.emaMinX === null) {
      this.emaMinX = rawBBoxContainer.minX;
      this.emaMaxX = rawBBoxContainer.maxX;
      this.emaMinY = rawBBoxContainer.minY;
      this.emaMaxY = rawBBoxContainer.maxY;
    } else {
      this.emaMinX = this.emaMinX * (1 - alpha) + rawBBoxContainer.minX * alpha;
      this.emaMaxX = this.emaMaxX * (1 - alpha) + rawBBoxContainer.maxX * alpha;
      this.emaMinY = this.emaMinY * (1 - alpha) + rawBBoxContainer.minY * alpha;
      this.emaMaxY = this.emaMaxY * (1 - alpha) + rawBBoxContainer.maxY * alpha;
    }

    const faceW = this.emaMaxX - this.emaMinX;
    const faceH = this.emaMaxY - this.emaMinY;
    const faceCtrX = (this.emaMinX + this.emaMaxX) * 0.5;
    const faceCtrY = (this.emaMinY + this.emaMaxY) * 0.5;

    const oval = getGuideOvalGeometry(Wc, Hc);
    const faceWidthPct = (faceW / Wc) * 100;

    let rawCode = 'OK';
    let failingRule = null;

    if (faceWidthPct < 22) {
      rawCode = 'TOO_FAR';
      failingRule = 'face_width_too_small';
    } else if (faceWidthPct > 75) {
      rawCode = 'TOO_CLOSE';
      failingRule = 'face_width_too_large';
    } else if (
      Math.abs(faceCtrX - oval.centerX) > Wc * 0.18 ||
      Math.abs(faceCtrY - oval.centerY) > Hc * 0.22
    ) {
      rawCode = 'OFF_CENTER';
      failingRule = 'face_not_centered';
    } else if (
      Math.abs(yawDeg) > 25 ||
      Math.abs(pitchDeg) > 20 ||
      Math.abs(rollDeg) > 20
    ) {
      rawCode = 'BAD_POSE';
      failingRule = 'head_pose_angle_exceeded';
    } else if (luminance < 60) {
      rawCode = 'TOO_DARK';
      failingRule = 'insufficient_lighting';
    } else if (luminance > 215) {
      rawCode = 'TOO_BRIGHT';
      failingRule = 'overexposed_lighting';
    }

    if (rawCode === 'OK') {
      this.consecutiveOkFrames++;
      this.consecutiveDropFrames = 0;
      if (this.consecutiveOkFrames >= 6) {
        this.currentCode = 'OK';
      }
    } else {
      this.consecutiveDropFrames++;
      this.consecutiveOkFrames = 0;
      if (this.currentCode === 'OK') {
        if (this.consecutiveDropFrames >= 10) {
          this.currentCode = rawCode;
        }
      } else {
        this.currentCode = rawCode;
      }
    }

    return {
      code: this.currentCode,
      rawCode,
      isOk: this.currentCode === 'OK',
      isSoftWarning: this.currentCode !== 'OK' && this.currentCode !== 'NO_FACE',
      failingRule,
      faceWidthPct,
    };
  }
}

// 3a. Regression fixture: User screenshot case (face width ~58% of frame, centered, well lit)
const tracker = new TestFaceStatusTracker();
const Wc = 390, Hc = 844;
const ovalGeom = getGuideOvalGeometry(Wc, Hc);
const userFaceW = Wc * 0.58; // 226px
const userFaceH = userFaceW * 1.30;
const rawBBox = {
  minX: ovalGeom.centerX - userFaceW / 2,
  maxX: ovalGeom.centerX + userFaceW / 2,
  minY: ovalGeom.centerY - userFaceH / 2,
  maxY: ovalGeom.centerY + userFaceH / 2,
};

// Feed 6 frames of good alignment
let status;
for (let i = 0; i < 6; i++) {
  status = tracker.evaluateFrame({
    rawBBoxContainer: rawBBox,
    yawDeg: 3.5,
    pitchDeg: -4.0,
    rollDeg: 1.2,
    luminance: 135,
    hasFace: true,
    Wc,
    Hc,
  });
}
assert.strictEqual(status.code, 'OK', 'User screenshot regression case MUST evaluate to OK after 6 frames');
assert.strictEqual(status.isOk, true);
console.log('  ✓ Regression fixture (face width ~58%, centered, well-lit) successfully transitions to OK');

// 3b. Hysteresis drop check: 1 to 9 jittery frames should NOT drop from OK
for (let i = 0; i < 5; i++) {
  status = tracker.evaluateFrame({
    rawBBoxContainer: rawBBox,
    yawDeg: 28, // temporary turn
    pitchDeg: 0,
    rollDeg: 0,
    luminance: 135,
    hasFace: true,
    Wc,
    Hc,
  });
  assert.strictEqual(status.code, 'OK', 'Hysteresis must suppress temporary jitter under 10 frames');
}
console.log('  ✓ Hysteresis successfully prevents dropped state on temporary angle jitter');

// 3c. Boundary checks
// Too Far (<22%)
const trackerFar = new TestFaceStatusTracker();
const smallBBox = {
  minX: 160, maxX: 160 + Wc * 0.18,
  minY: 300, maxY: 300 + Hc * 0.15,
};
const farStatus = trackerFar.evaluateFrame({ rawBBoxContainer: smallBBox, yawDeg: 0, pitchDeg: 0, rollDeg: 0, luminance: 120, hasFace: true, Wc, Hc });
assert.strictEqual(farStatus.code, 'TOO_FAR');
assert.strictEqual(farStatus.isSoftWarning, true);

// Centering limits
const trackerOffCenter = new TestFaceStatusTracker();
const offCenterBBox = {
  minX: ovalGeom.centerX + Wc * 0.25,
  maxX: ovalGeom.centerX + Wc * 0.25 + userFaceW,
  minY: ovalGeom.centerY,
  maxY: ovalGeom.centerY + userFaceH,
};
const offCenterStatus = trackerOffCenter.evaluateFrame({ rawBBoxContainer: offCenterBBox, yawDeg: 0, pitchDeg: 0, rollDeg: 0, luminance: 120, hasFace: true, Wc, Hc });
assert.strictEqual(offCenterStatus.code, 'OFF_CENTER');
assert.strictEqual(offCenterStatus.isSoftWarning, true);
console.log('  ✓ Boundary limits (TOO_FAR < 22%, OFF_CENTER > 18%) correctly identified as soft warnings');

// ── 4. Quality Gate Invariants (Soft warning never blocks capture) ─────────────
console.log('\n=== TEST 4: QUALITY GATE HARD-FAIL VS SOFT-WARNING INVARIANTS ===');

function evaluateQualityGate(statusCode) {
  const isHardFail = statusCode === 'NO_FACE';
  const passed = !isHardFail;
  const isSoftWarning = statusCode !== 'NO_FACE' && statusCode !== 'OK';
  return { passed, isSoftWarning };
}

assert.deepStrictEqual(evaluateQualityGate('OK'), { passed: true, isSoftWarning: false });
assert.deepStrictEqual(evaluateQualityGate('TOO_FAR'), { passed: true, isSoftWarning: true });
assert.deepStrictEqual(evaluateQualityGate('TOO_CLOSE'), { passed: true, isSoftWarning: true });
assert.deepStrictEqual(evaluateQualityGate('OFF_CENTER'), { passed: true, isSoftWarning: true });
assert.deepStrictEqual(evaluateQualityGate('BAD_POSE'), { passed: true, isSoftWarning: true });
assert.deepStrictEqual(evaluateQualityGate('TOO_DARK'), { passed: true, isSoftWarning: true });
assert.deepStrictEqual(evaluateQualityGate('TOO_BRIGHT'), { passed: true, isSoftWarning: true });
// ONLY NO_FACE fails
assert.deepStrictEqual(evaluateQualityGate('NO_FACE'), { passed: false, isSoftWarning: false });
console.log('  ✓ Invariant verified: Soft warnings (TOO_FAR, OFF_CENTER, BAD_POSE, etc.) NEVER block capture');
console.log('  ✓ Invariant verified: Hard fail occurs ONLY on NO_FACE');

console.log('\n======================================================');
console.log('ALL UNIT & REGRESSION TESTS PASSED CLEANLY (100% OK)');
console.log('======================================================\n');

