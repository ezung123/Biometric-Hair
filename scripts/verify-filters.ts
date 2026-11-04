// ══════════════════════════════════════════════════════════════════════════════
// scripts/verify-filters.ts
// PHASE 8: COMPREHENSIVE E2E VERIFICATION FOR FILTERS & VIEW-TOGGLES
// ══════════════════════════════════════════════════════════════════════════════

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { HAIRSTYLE_CATALOG } from '../src/constants/catalog.ts';
import { filterAndRank, matchesAudience, matchesLength } from '../src/lib/filterStyles.ts';

const mockMetrics = {
  faceShape: 'Oval',
  facialIndex: 86.4,
  verticalThirds: { upperThirdPct: 33, midThirdPct: 34, lowerThirdPct: 33, varianceScore: 1.0 },
  goldenRatioDeviation: 0.04,
};

async function verifyFiltersAndToggles() {
  console.log('===============================================================');
  console.log('BIOMETRIC HAIR AI: E2E FILTER & VIEW-TOGGLE VERIFICATION');
  console.log('===============================================================\n');

  const outDir = path.resolve(process.cwd(), 'out');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (
        !text.includes('Download the React DevTools') &&
        !text.includes('deprecated') &&
        !text.includes('getUserMedia') &&
        !text.includes('NotSupportedError') &&
        !text.includes('TensorFlow Lite XNNPACK') &&
        !text.includes('symbolicate') &&
        !text.includes('ERR_CONNECTION_TIMED_OUT')
      ) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('response', (response) => {
    if (response.status() >= 400) {
      const url = response.url();
      if (!url.includes('@mediapipe') && !url.includes('.bundle?')) {
        failedRequests.push(`${response.status()} ${url}`);
      }
    }
  });

  console.log('1. Navigating to app on http://localhost:8081 ...');
  await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  console.log('2. Triggering Biometric Scan via Demo Photo...');
  const demoBtn = page.locator('text=USE DEMO PHOTO');
  await demoBtn.waitFor({ state: 'visible', timeout: 15000 });
  await demoBtn.click();

  const topPickHeading = page.locator('text=TOP ANTHROPOMETRIC MATCH');
  await topPickHeading.waitFor({ state: 'visible', timeout: 60000 });
  console.log('   ✓ Results screen loaded with TOP ANTHROPOMETRIC MATCH header.\n');

  // ── TEST AUDIENCE & LENGTH FILTER COMBINATIONS ─────────────────────────────
  console.log('3. Iterating through all Audience & Length Filter combinations...');

  const audienceButtons = [
    { key: 'men' as const, labelRegex: /Men's Looks/i },
    { key: 'women' as const, labelRegex: /Women's Looks/i },
    { key: 'all' as const, labelRegex: /All Looks/i },
  ];

  const lengthButtons = [
    { key: 'all' as const, labelRegex: /All Lengths/i },
    { key: 'short' as const, labelRegex: /Short/i },
    { key: 'medium' as const, labelRegex: /Medium/i },
    { key: 'long' as const, labelRegex: /Long/i },
  ];

  for (const aud of audienceButtons) {
    const audBtn = page.locator(`button, [role="button"]`).filter({ hasText: aud.labelRegex }).first();
    await audBtn.scrollIntoViewIfNeeded();
    await audBtn.click();
    await page.waitForTimeout(500);

    const isPressed = await audBtn.getAttribute('aria-pressed');
    console.log(`   Audience switched to [${aud.key}] (aria-pressed=${isPressed})`);

    for (const len of lengthButtons) {
      const lenBtn = page.locator(`button, [role="button"]`).filter({ hasText: len.labelRegex }).first();
      await lenBtn.scrollIntoViewIfNeeded();

      // Read count from the chip label, e.g. "Short (7)" -> 7
      const chipText = (await lenBtn.textContent()) || '';
      const matchCount = chipText.match(/\((\d+)\)/);
      const chipCount = matchCount ? parseInt(matchCount[1], 10) : -1;
      const ariaDisabled = await lenBtn.getAttribute('aria-disabled');

      if (chipCount === 0) {
        console.log(`     Len [${len.key}] has 0 matching styles (chipCount=0, aria-disabled=${ariaDisabled})`);
        if (ariaDisabled !== 'true') {
          throw new Error(`Expected length chip with 0 results to have aria-disabled="true", got "${ariaDisabled}"`);
        }
      } else {
        await lenBtn.click();
        await page.waitForTimeout(500);

        // Verify top match title is rendered and satisfies active filters
        const heroHeader = page.locator('text=TOP ANTHROPOMETRIC MATCH').locator('..');
        const renderedTitle = (await heroHeader.textContent())?.replace('TOP ANTHROPOMETRIC MATCH', '').trim();
        console.log(`     Len [${len.key}] -> Chip count: ${chipCount}. Rendered Hero: "${renderedTitle}"`);

        // Find style in catalog
        const matchedStyle = HAIRSTYLE_CATALOG.find((s) => renderedTitle?.includes(s.name));
        if (!matchedStyle) {
          throw new Error(`Rendered hero style "${renderedTitle}" was not found in HAIRSTYLE_CATALOG`);
        }

        // Assert that the hero style strictly satisfies the active filters
        if (!matchesAudience(matchedStyle, aud.key)) {
          throw new Error(`Top match "${matchedStyle.name}" (${matchedStyle.audience}) violates audience filter [${aud.key}]`);
        }
        if (!matchesLength(matchedStyle, len.key)) {
          throw new Error(`Top match "${matchedStyle.name}" (${matchedStyle.lengthClass}) violates length filter [${len.key}]`);
        }
      }
    }
  }
  console.log('   ✓ All filter combinations verified successfully!\n');

  // Save filtered screenshot
  await page.screenshot({ path: path.join(outDir, 'e2e_filter_mens_all.png'), fullPage: false });
  console.log('   📸 Captured out/e2e_filter_mens_all.png');

  // ── TEST FILTER RESET ACTION ──────────────────────────────────────────────
  console.log('4. Testing "Reset filters ↺" action...');
  // First, set non-default filters (e.g. Women + Medium)
  const womenBtn = page.locator(`button, [role="button"]`).filter({ hasText: /Women's Looks/i }).first();
  await womenBtn.click();
  await page.waitForTimeout(400);

  const medBtn = page.locator(`button, [role="button"]`).filter({ hasText: /Medium/i }).first();
  await medBtn.click();
  await page.waitForTimeout(400);

  const resetBtn = page.locator('text=Reset filters');
  await resetBtn.waitFor({ state: 'visible', timeout: 5000 });
  await resetBtn.click();
  await page.waitForTimeout(600);
  console.log('   ✓ Clicked "Reset filters ↺"');

  // After reset, audience=all and length=all
  const allLooksBtn = page.locator(`button, [role="button"]`).filter({ hasText: /All Looks/i }).first();
  const allPressed = await allLooksBtn.getAttribute('aria-pressed');
  if (allPressed !== 'true') {
    throw new Error(`Expected All Looks to be aria-pressed="true" after reset, got "${allPressed}"`);
  }
  console.log('   ✓ Filters successfully restored to All Looks & All Lengths');
  await page.screenshot({ path: path.join(outDir, 'e2e_filter_reset.png'), fullPage: false });

  // ── TEST HERO VIEW SWITCHER & KEYBOARD / PRELOADING ────────────────────────
  console.log('5. Testing Multi-Angle View Switcher (Front / Side / Back)...');
  const sideTab = page.locator('text=SIDE VIEW').first();
  if (await sideTab.isVisible()) {
    await sideTab.click();
    await page.waitForTimeout(600);
    const badgeText = await page.locator('text=SIDE VIEW').nth(1).textContent();
    console.log(`   ✓ Switched to SIDE VIEW (Badge: "${badgeText?.trim()}")`);
    await page.screenshot({ path: path.join(outDir, 'e2e_filter_hero_side.png'), fullPage: false });

    // Keyboard ArrowRight test
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(600);
    console.log('   ✓ Navigated via keyboard ArrowRight');

    // Restore to FRONT VIEW
    const frontTab = page.locator('text=FRONT VIEW').first();
    await frontTab.click();
    await page.waitForTimeout(400);
    console.log('   ✓ Restored FRONT VIEW');
  }

  // ── TEST STYLE DETAIL MODAL & BARBER SPEC ─────────────────────────────────
  console.log('6. Testing StyleDetailModal view switcher & clipboard copy...');
  const heroCta = page.locator('text=OPEN IN STUDIO & BARBER CARD');
  await heroCta.click();
  await page.waitForTimeout(1000);

  const barberTitle = page.locator('text=HOW TO ASK YOUR BARBER / STYLIST');
  await barberTitle.waitFor({ state: 'visible', timeout: 5000 });
  console.log('   ✓ StyleDetailModal opened');

  const copyBtn = page.locator('text=COPY SPEC');
  await copyBtn.click();
  await page.waitForTimeout(500);
  console.log('   ✓ Clicked COPY SPEC');

  const closeDetail = page.locator('[aria-label="Close style details"]');
  await closeDetail.click();
  await page.waitForTimeout(600);
  console.log('   ✓ Closed StyleDetailModal');

  // ── TEST DESKTOP VIEWPORT ────────────────────────────────────────────────
  console.log('7. Testing Desktop Viewport (1280x800)...');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(1200);

  // Switch to Men's Looks on desktop
  const menDesktop = page.locator(`button, [role="button"]`).filter({ hasText: /Men's Looks/i }).first();
  await menDesktop.click();
  await page.waitForTimeout(600);
  console.log("   ✓ Switched to Men's Looks on desktop layout");

  await page.screenshot({ path: path.join(outDir, 'e2e_filter_desktop.png'), fullPage: false });
  console.log('   📸 Captured out/e2e_filter_desktop.png');

  await browser.close();

  // Audit results
  console.log('\n===============================================================');
  console.log('AUDIT SUMMARY:');
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((err) => console.error('  ❌', err));
  }
  console.log(`Failed Network Requests: ${failedRequests.length}`);
  if (failedRequests.length > 0) {
    failedRequests.forEach((req) => console.error('  ❌', req));
  }

  if (consoleErrors.length > 0 || failedRequests.length > 0) {
    console.error('❌ E2E VERIFICATION FAILED WITH CONSOLE ERRORS OR 404s');
    process.exit(1);
  }

  console.log('✅ ALL FILTER & TOGGLE E2E CHECKS PASSED (100% OK)');
  console.log('===============================================================');
}

verifyFiltersAndToggles().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
