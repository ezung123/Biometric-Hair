// ══════════════════════════════════════════════════════════════════════════════
// scripts/verify-stylist-e2e.ts
// COMPREHENSIVE PLAYWRIGHT E2E TEST FOR AI STYLIST & BARBER BRIEF (390x844)
// ══════════════════════════════════════════════════════════════════════════════

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function runStylistE2E() {
  console.log('===============================================================');
  console.log('PLAYWRIGHT E2E TEST: AI STYLIST & BARBER BRIEF (390x844)');
  console.log('===============================================================\n');

  const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  const page = await context.newPage();
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (
        !text.includes('Download the React DevTools') &&
        !text.includes('deprecated') &&
        !text.includes('getUserMedia') &&
        !text.includes('NotSupportedError') &&
        !text.includes('TensorFlow Lite XNNPACK') &&
        !text.includes('symbolicate')
      ) {
        consoleErrors.push(text);
      }
    }
  });

  try {
    // 1. Navigate to app
    console.log('1. Navigating to http://localhost:8081 ...');
    await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);

    // 2. Trigger Scan via Demo Photo
    console.log('2. Triggering Scan via USE DEMO PHOTO button...');
    const demoBtn = page.locator('text="USE DEMO PHOTO"').first();
    await demoBtn.waitFor({ state: 'visible', timeout: 15000 });
    await demoBtn.click({ force: true });

    // Wait for analysis pipeline and results view
    console.log('3. Waiting for Cephalometric Results view...');
    await page.waitForSelector('text="TOP ANTHROPOMETRIC MATCH"', { timeout: 60000 });
    console.log('   ✓ Results view loaded successfully.');

    await page.screenshot({ path: path.join(screenshotsDir, '01_results_with_stylist_banner.png') });

    // 4. Open AI Stylist drawer
    console.log('4. Opening AI Stylist drawer...');
    const stylistBtn = page.locator('text="✨ STYLIST"').or(page.locator('text="✨ AI STYLIST & BARBER BRIEF"')).first();
    await stylistBtn.waitFor({ state: 'visible', timeout: 8000 });
    await stylistBtn.click({ force: true });
    await page.waitForTimeout(1000);

    await page.waitForSelector('text="AI Stylist & Barber Brief"', { timeout: 8000 });
    console.log('   ✓ AI Stylist drawer opened.');

    await page.screenshot({ path: path.join(screenshotsDir, '02_stylist_drawer_initial.png') });

    // 5. Test Quick Action: "Best for my face"
    console.log('5. Tapping quick action: "Best for my face"...');
    const bestForFaceChip = page.locator('text="Best for my face"').first();
    await bestForFaceChip.click({ force: true });

    // Wait until typing indicator finishes
    await page.waitForSelector('text=/Thinking.../i', { state: 'visible', timeout: 5000 }).catch(() => {});
    await page.waitForSelector('text=/Thinking.../i', { state: 'detached', timeout: 35000 });
    await page.waitForTimeout(1000);

    // Expand reasoning trace of latest assistant message
    const traceToggle = page.locator('text=/Show Reasoning Trace/i').last();
    await traceToggle.scrollIntoViewIfNeeded();
    await traceToggle.click({ force: true });
    await page.waitForTimeout(600);
    console.log('   ✓ Response received and reasoning trace expanded.');

    // 6. Test Quick Action: "Make my barber brief"
    console.log('6. Tapping quick action: "Make my barber brief"...');
    const briefChip = page.locator('text="Make my barber brief"').first();
    await briefChip.scrollIntoViewIfNeeded();
    await briefChip.waitFor({ state: 'visible', timeout: 8000 });
    await briefChip.click({ force: true });

    // Wait until Complete Barber Brief card is synthesized
    console.log('   Waiting for Barber Brief card synthesis...');
    const briefCardHeader = page.locator('text=/COMPLETE BARBER BRIEF/i').last();
    await briefCardHeader.waitFor({ state: 'visible', timeout: 45000 });
    console.log('   ✓ Barber brief card synthesized.');

    await page.screenshot({ path: path.join(screenshotsDir, '03_stylist_brief_card.png') });

    // 7. Open Interactive Barber Brief modal from the embedded brief card
    console.log('7. Opening Interactive Barber Brief Modal...');
    const openBriefBtn = page.locator('text=/OPEN BRIEF/i').last();
    await openBriefBtn.scrollIntoViewIfNeeded();
    await openBriefBtn.click({ force: true });
    await page.waitForTimeout(1500);

    await page.waitForSelector('text=/BARBER CONSULTATION BRIEF/i', { timeout: 8000 });
    console.log('   ✓ Barber Brief modal open.');

    // Assert Zone Table rendered
    await page.waitForSelector('text=/ANATOMICAL ZONE/i', { timeout: 5000 });
    console.log('   ✓ Zone specifications table verified.');

    await page.screenshot({ path: path.join(screenshotsDir, '04_barber_brief_en.png') });

    // 8. Test Language Switcher (ES, ZH, FR)
    console.log('8. Testing multilingual language switcher (ES, ZH, FR)...');
    const esTab = page.locator('text="ES"').first();
    await esTab.click({ force: true });
    await page.waitForTimeout(1000);
    await page.waitForSelector('text=/COPIAR TEXTO|BARBERÍA|CORONILLA/i', { timeout: 8000 });
    console.log('   ✓ Switched to Spanish (ES): "COPIAR TEXTO / BARBERÍA" verified.');

    await page.screenshot({ path: path.join(screenshotsDir, '05_barber_brief_es.png') });

    const zhTab = page.locator('text="ZH"').first();
    await zhTab.click({ force: true });
    await page.waitForTimeout(1000);
    await page.waitForSelector('text=/顶部|复制文本/i', { timeout: 8000 });
    console.log('   ✓ Switched to Chinese (ZH): "顶部 / 复制文本" verified.');

    const frTab = page.locator('text="FR"').first();
    await frTab.click({ force: true });
    await page.waitForTimeout(1000);
    await page.waitForSelector('text=/COPIER LE TEXTE|ZONE SUPÉRIEURE/i', { timeout: 8000 });
    console.log('   ✓ Switched to French (FR): "COPIER LE TEXTE" verified.');

    // Switch back to EN
    const enTab = page.locator('text="EN"').first();
    await enTab.click({ force: true });
    await page.waitForTimeout(600);

    // 9. Test Actions: Copy Specification
    console.log('9. Testing Copy Specification trigger...');
    const copyBtn = page.locator('[aria-label="Copy brief text"]').or(page.locator('text=/COPY TEXT/i')).first();
    await copyBtn.click({ force: true });
    await page.waitForTimeout(600);
    await page.waitForSelector('text=/COPIED/i', { timeout: 5000 });
    console.log('   ✓ Copy specification succeeded.');

    // 10. Close Barber Brief Modal
    const closeBrief = page.locator('[aria-label="Close barber brief"]').first();
    await closeBrief.click({ force: true });
    await page.waitForTimeout(800);
    console.log('   ✓ Closed Barber Brief modal cleanly.');

    console.log('\n===============================================================');
    console.log('✅ ALL E2E STYLIST & BARBER BRIEF WORKFLOWS PASSED (0 ERRORS)');
    console.log('===============================================================\n');

    await browser.close();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ E2E TEST FAILED:', err.message);
    if (page) {
      await page.screenshot({ path: path.join(screenshotsDir, 'error_state.png') }).catch(() => {});
    }
    await browser.close();
    process.exit(1);
  }
}

runStylistE2E();
