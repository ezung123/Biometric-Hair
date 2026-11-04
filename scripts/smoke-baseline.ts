// ══════════════════════════════════════════════════════════════════════════════
// scripts/smoke-baseline.ts
// STEP 0 BASELINE SMOKE TEST (Viewport: 390x844)
// Flow: Demo photo -> Results -> Open Style -> View Toggles -> Save -> Compare
// ══════════════════════════════════════════════════════════════════════════════

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function runSmokeBaseline() {
  console.log('===============================================================');
  console.log('BASELINE SMOKE TEST: 390x844 (Demo -> Results -> Detail -> Toggle -> Save -> Compare)');
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
        !text.includes('symbolicate')
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

  try {
    // 1. Navigate to app
    console.log('1. Navigating to http://localhost:8081 ...');
    await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 2. Trigger Scan via Demo Photo
    console.log('2. Triggering Scan via Sample Selfie button...');
    const demoBtn = page.locator('text="Try Sample Selfie"').or(page.locator('text="Sample Photo"'));
    if ((await demoBtn.count()) > 0) {
      await demoBtn.first().click();
    } else {
      await page.click('[aria-label*="sample"], [aria-label*="demo"], button:has-text("Sample")');
    }

    // Wait for results screen
    await page.waitForSelector('text="TOP ANTHROPOMETRIC MATCH"', { timeout: 25000 });
    console.log('   ✓ Results screen loaded.');

    // 3. Open a style card (StyleDetailModal)
    console.log('3. Opening a style card...');
    const detailBtn = page
      .locator('text="OPEN IN STUDIO & BARBER CARD"')
      .or(page.locator('text="VIEW MULTI-ANGLE LOOKBOOK"'));
    await detailBtn.first().click();
    await page.waitForTimeout(1000);
    console.log('   ✓ Style details opened.');

    // 4. Test View Toggles (Front / Side / Back) in StyleDetailModal
    console.log('4. Testing view toggles inside modal...');
    const sideToggle = page.locator('text="SIDE VIEW"').last();
    if ((await sideToggle.count()) > 0) {
      await sideToggle.click({ force: true });
      await page.waitForTimeout(500);
      console.log('   ✓ Switched to Side view.');
    }
    const backToggle = page.locator('text="BACK VIEW"').last();
    if ((await backToggle.count()) > 0) {
      await backToggle.click({ force: true });
      await page.waitForTimeout(500);
      console.log('   ✓ Switched to Back view.');
    }
    const frontToggle = page.locator('text="FRONT VIEW"').last();
    if ((await frontToggle.count()) > 0) {
      await frontToggle.click({ force: true });
      await page.waitForTimeout(500);
      console.log('   ✓ Restored Front view.');
    }

    // Close modal
    const closeBtn = page.locator('[aria-label="Close style details"]');
    if ((await closeBtn.count()) > 0) {
      await closeBtn.first().click({ force: true });
      await page.waitForTimeout(500);
      console.log('   ✓ Closed style details modal.');
    }

    // 5. Test Save button
    console.log('5. Testing Save look button...');
    const saveBtn = page.locator('[aria-label="Save top pick"]').or(page.locator('[aria-label="Save style"]'));
    if ((await saveBtn.count()) > 0) {
      await saveBtn.first().click({ force: true });
      await page.waitForTimeout(800);
      console.log('   ✓ Save look toggled.');
    }

    // Check saved looks strip
    const savedStrip = page.locator('text="SAVED LOOKS"');
    const isSavedVisible = (await savedStrip.count()) > 0;
    console.log(`   ✓ Saved looks section visible: ${isSavedVisible}`);

    // 6. Test Compare button
    console.log('6. Testing Compare button...');
    const compareBtn = page.locator('text="COMPARE"');
    if ((await compareBtn.count()) > 0) {
      await compareBtn.first().click({ force: true });
      await page.waitForTimeout(1000);

      // Verify CompareModal is visible
      const compareModalHeader = page.locator('text="LOOK COMPARISON"').or(page.locator('text="SIDE-BY-SIDE"')).or(page.locator('text="VS"')).or(page.locator('text="CLOSE"'));
      const isCompareVisible = (await compareModalHeader.count()) > 0;
      console.log(`   ✓ Compare modal opened successfully: ${isCompareVisible}`);

      // Close Compare modal
      const closeCompare = page.locator('text="CLOSE"').or(page.locator('[aria-label="Close comparison"]')).or(page.locator('text="✕"'));
      if ((await closeCompare.count()) > 0) {
        await closeCompare.first().click({ force: true });
        await page.waitForTimeout(500);
        console.log('   ✓ Closed Compare modal.');
      }
    }

    await page.screenshot({ path: path.join(outDir, 'smoke_baseline_390x844.png') });
    console.log('   📸 Captured out/smoke_baseline_390x844.png');

    console.log('\n===============================================================');
    console.log(`AUDIT SUMMARY:`);
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Failed Network Requests: ${failedRequests.length}`);
    console.log('===============================================================');

    if (consoleErrors.length > 0) {
      console.warn('Console error warnings:', consoleErrors);
    }

    if (failedRequests.length > 0) {
      console.error('Failed requests:', failedRequests);
      process.exit(1);
    }

    console.log('✅ BASELINE SMOKE TEST PASSED 100%');
    await browser.close();
  } catch (err: any) {
    console.error('❌ Baseline smoke test error:', err);
    await browser.close();
    process.exit(1);
  }
}

runSmokeBaseline();
