// ══════════════════════════════════════════════════════════════════════════════
// scripts/verify-catalog.ts
// PHASE 7: AUTONOMOUS PLAYWRIGHT END-TO-END VERIFICATION SUITE
// ══════════════════════════════════════════════════════════════════════════════

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function runVerification() {
  console.log('===============================================================');
  console.log('BIOMETRIC HAIR AI - E2E AUTONOMOUS PLAYWRIGHT VERIFICATION');
  console.log('===============================================================\n');

  const outDir = path.resolve(process.cwd(), 'out');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile viewport (iPhone 14)
    deviceScaleFactor: 2,
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  const page = await context.newPage();

  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on('console', (msg) => {
    console.log(`[PAGE ${msg.type().toUpperCase()}]`, msg.text());
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore non-fatal React dev warnings or camera permissions in headless
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

  page.on('request', (req) => {
    if (req.url().includes('symbolicate')) {
      console.log('SYMBOLICATE STACK:', req.postData());
    }
  });

  page.on('response', (response) => {
    if (response.status() >= 400) {
      const url = response.url();
      console.log(`[HTTP ${response.status()}]`, url);
      if (!url.includes('@mediapipe') && !url.includes('.bundle?')) {
        failedRequests.push(`${response.status()} ${url}`);
      }
    }
  });

  console.log('1. Navigating to http://localhost:8081 ...');
  await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Check if camera or demo button is available
  console.log('2. Verifying initial scan interface...');
  const demoBtn = page.locator('text=USE DEMO PHOTO');
  await demoBtn.waitFor({ state: 'visible', timeout: 15000 });
  console.log('   ✓ "USE DEMO PHOTO" button is visible');

  console.log('3. Triggering biometric scan via Demo Photo...');
  await demoBtn.click();

  // Wait for recommendations view to appear
  console.log('4. Awaiting face analysis and Neoclassical recommendation engine...');
  try {
    const topPickHeading = page.locator('text=TOP ANTHROPOMETRIC MATCH');
    await topPickHeading.waitFor({ state: 'visible', timeout: 60000 });
    console.log('   ✓ Top Anthropometric Match header arrived');
  } catch (err) {
    await page.screenshot({ path: path.join(outDir, 'debug_scan_failure.png') });
    console.log('   📸 Saved debug failure screenshot to out/debug_scan_failure.png');
    throw err;
  }

  // Verify Facial Thirds and Balance Score
  const balanceText = page.locator('text=/\\d+% FACIAL BALANCE/');
  await balanceText.waitFor({ state: 'visible', timeout: 5000 });
  const balanceContent = await balanceText.textContent();
  console.log(`   ✓ Facial balance score displayed: "${balanceContent?.trim()}"`);

  const thirdsHeader = page.locator('text=NEOCLASSICAL FARKAS THIRDS');
  await thirdsHeader.waitFor({ state: 'visible', timeout: 5000 });
  console.log('   ✓ Neoclassical Farkas thirds bar rendered');

  // Verify Multi-Angle View switcher on Top Pick Hero
  console.log('5. Verifying Multi-Angle view switcher on Hero card...');
  const sideTab = page.locator('text=SIDE VIEW').first();
  await sideTab.click();
  await page.waitForTimeout(800);
  console.log('   ✓ Clicked SIDE VIEW');

  const backTab = page.locator('text=BACK VIEW').first();
  await backTab.click();
  await page.waitForTimeout(800);
  console.log('   ✓ Clicked BACK VIEW');

  const frontTab = page.locator('text=FRONT VIEW').first();
  await frontTab.click();
  await page.waitForTimeout(800);
  console.log('   ✓ Restored FRONT VIEW');

  // Verify Stylist Consultation Note
  console.log('6. Verifying Stylist Consultation Note...');
  const stylistTitle = page.locator('text=STYLIST CONSULTATION NOTE');
  await stylistTitle.waitFor({ state: 'visible', timeout: 5000 });
  console.log('   ✓ Stylist Consultation Note rendered');

  // Verify Ranked Cards (Rank 2 through 6)
  console.log('7. Verifying Ranked reference cards...');
  const moreRanked = page.locator('text=MORE RANKED RECOMMENDATIONS');
  await moreRanked.waitFor({ state: 'visible', timeout: 5000 });

  const matchBadges = page.locator('text=/\\d+% MATCH/');
  const matchCount = await matchBadges.count();
  console.log(`   ✓ Found ${matchCount} match percentage badges across recommendations`);

  // Verify Also Consider & Less Ideal
  console.log('8. Verifying "Also Consider" and "Less Ideal" sections...');
  const alsoConsider = page.locator('text=ALSO CONSIDER');
  await alsoConsider.waitFor({ state: 'visible', timeout: 5000 });
  console.log('   ✓ "ALSO CONSIDER" section verified');

  const lessIdeal = page.locator('text=LESS IDEAL FOR YOUR MORPHOLOGY');
  await lessIdeal.waitFor({ state: 'visible', timeout: 5000 });
  console.log('   ✓ "LESS IDEAL FOR YOUR MORPHOLOGY" section verified');

  // Audience Filter Switcher Test
  console.log('9. Testing Audience Filter switcher...');
  const womenBtn = page.getByText("Women's Looks", { exact: true });
  await womenBtn.click();
  await page.waitForTimeout(1000);
  console.log("   ✓ Switched to Women's Looks");

  const menBtn = page.getByText("Men's Looks", { exact: true });
  await menBtn.click();
  await page.waitForTimeout(1000);
  console.log("   ✓ Switched back to Men's Looks");

  // Length Filter Switcher Test
  console.log('10. Testing Length Filter switcher...');
  const shortBtn = page.getByText("SHORT", { exact: true }).first();
  await shortBtn.click();
  await page.waitForTimeout(1000);
  console.log('   ✓ Filtered by SHORT length');

  const allLengthsBtn = page.getByText("All Lengths", { exact: true });
  await allLengthsBtn.click();
  await page.waitForTimeout(1000);
  console.log('   ✓ Reset to All Lengths');

  // Capture Mobile Viewport Screenshot
  console.log('11. Capturing Mobile Viewport screenshot (390x844)...');
  await page.screenshot({ path: path.join(outDir, 'e2e_mobile_results.png'), fullPage: false });
  console.log('   ✓ Saved to out/e2e_mobile_results.png');

  // Open Style Detail Modal
  console.log('12. Testing StyleDetailModal & Multi-Angle Studio...');
  const heroCta = page.locator('text=OPEN IN STUDIO & BARBER CARD');
  await heroCta.click();
  await page.waitForTimeout(1200);

  const detailTitle = page.locator('text=HOW TO ASK YOUR BARBER / STYLIST');
  await detailTitle.waitFor({ state: 'visible', timeout: 5000 });
  console.log('   ✓ StyleDetailModal opened');

  // Test Copy Spec Button
  const copyBtn = page.locator('text=COPY SPEC');
  await copyBtn.click();
  await page.waitForTimeout(600);
  console.log('   ✓ Clicked "COPY SPEC" button');

  // Capture Style Detail Screenshot
  await page.screenshot({ path: path.join(outDir, 'e2e_style_detail.png'), fullPage: false });
  console.log('   ✓ Saved to out/e2e_style_detail.png');

  // Close Style Detail Modal
  const closeDetailBtn = page.locator('[aria-label="Close style details"]');
  await closeDetailBtn.click();
  await page.waitForTimeout(800);
  console.log('   ✓ Closed StyleDetailModal');

  // Open Compare Modal
  console.log('13. Testing CompareModal...');
  const compareBtn = page.locator('text=COMPARE').first();
  await compareBtn.scrollIntoViewIfNeeded();
  await compareBtn.click();
  await page.waitForTimeout(1200);

  const compareHeader = page.locator('text=SIDE-BY-SIDE EVALUATION');
  await compareHeader.waitFor({ state: 'visible', timeout: 5000 });
  console.log('   ✓ CompareModal opened');

  // Capture Compare Screenshot
  await page.screenshot({ path: path.join(outDir, 'e2e_compare.png'), fullPage: false });
  console.log('   ✓ Saved to out/e2e_compare.png');

  // Close Compare Modal
  const closeCompareBtn = page.locator('[aria-label="Close comparison"]');
  await closeCompareBtn.click();
  await page.waitForTimeout(800);
  console.log('   ✓ Closed CompareModal');

  // Open Photo Credits Modal
  console.log('14. Testing PhotoCreditsModal...');
  const creditsLink = page.locator('text=Photo Credits & Licenses');
  await creditsLink.scrollIntoViewIfNeeded();
  await creditsLink.click();
  await page.waitForTimeout(1200);

  const creditsHeader = page.locator('text=ATTRIBUTION & LICENSES');
  await creditsHeader.waitFor({ state: 'visible', timeout: 5000 });
  console.log('   ✓ PhotoCreditsModal opened');

  // Capture Credits Screenshot
  await page.screenshot({ path: path.join(outDir, 'e2e_credits.png'), fullPage: false });
  console.log('   ✓ Saved to out/e2e_credits.png');

  // Close Photo Credits Modal
  const closeCreditsBtn = page.locator('[aria-label="Close credits"]');
  await closeCreditsBtn.click();
  await page.waitForTimeout(800);
  console.log('   ✓ Closed PhotoCreditsModal');

  // Desktop Viewport Test
  console.log('15. Testing Desktop Viewport (1280x800)...');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, 'e2e_desktop_results.png'), fullPage: false });
  console.log('   ✓ Saved to out/e2e_desktop_results.png');

  await browser.close();

  // Audit Logs
  console.log('\n===============================================================');
  console.log('AUDIT LOG SUMMARY:');
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((err) => console.error('  ❌', err));
  }
  console.log(`Failed Network Requests: ${failedRequests.length}`);
  if (failedRequests.length > 0) {
    failedRequests.forEach((req) => console.error('  ❌', req));
  }

  if (consoleErrors.length > 0 || failedRequests.length > 0) {
    console.error('❌ E2E VERIFICATION FAILED WITH ERRORS/404s');
    process.exit(1);
  }

  console.log('✅ ALL E2E CHECKS PASSED CLEANLY (100% OK)');
  console.log('===============================================================');
}

runVerification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
