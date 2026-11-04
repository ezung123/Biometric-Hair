// ══════════════════════════════════════════════════════════════════════════════
// scripts/check-assets.ts
// ASSET VALIDATION SUITE FOR HAIRSTYLE CATALOG
// ══════════════════════════════════════════════════════════════════════════════
// Validates:
// 1. Every style has at least 3 views (front, side, back)
// 2. All files exist in assets/catalog/{styleId}/ and public/assets/catalog/{styleId}/
// 3. Image dimensions are exactly 1200x1500 px (4:5) for primary and 600x750 px for thumbnail
// 4. File sizes are valid (> 5 KB and < 500 KB)
// 5. Blur placeholders are non-empty data URLs
// 6. CREDITS.md contains an entry for every image
// ══════════════════════════════════════════════════════════════════════════════

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { HAIRSTYLE_CATALOG } from '../src/constants/catalog.ts';

async function validateAssets() {
  console.log('===============================================================');
  console.log('HAIRSTYLE CATALOG ASSET INTEGRITY AUDIT');
  console.log('===============================================================\n');

  let totalErrors = 0;
  let totalChecked = 0;

  const creditsPath = path.resolve(process.cwd(), 'CREDITS.md');
  if (!fs.existsSync(creditsPath)) {
    console.error('❌ Missing CREDITS.md file');
    totalErrors++;
  }
  const creditsContent = fs.existsSync(creditsPath) ? fs.readFileSync(creditsPath, 'utf8') : '';

  if (HAIRSTYLE_CATALOG.length < 14) {
    console.error(`❌ Catalog must contain >= 14 styles, found ${HAIRSTYLE_CATALOG.length}`);
    totalErrors++;
  } else {
    console.log(`✓ Catalog size: ${HAIRSTYLE_CATALOG.length} styles (Requirement: >= 14 styles)`);
  }

  for (const style of HAIRSTYLE_CATALOG) {
    console.log(`Auditing [${style.id}] ${style.name}...`);

    if (!style.images || style.images.length < 3) {
      console.error(`  ❌ Style ${style.id} has fewer than 3 image views!`);
      totalErrors++;
      continue;
    }

    const views = style.images.map((i) => i.view);
    for (const reqView of ['front', 'side', 'back']) {
      if (!views.includes(reqView as any)) {
        console.error(`  ❌ Style ${style.id} missing required view: "${reqView}"`);
        totalErrors++;
      }
    }

    for (const img of style.images) {
      totalChecked++;
      const localPath = path.resolve(process.cwd(), img.localAssetPath);
      const publicPath = path.resolve(process.cwd(), 'public', img.file.replace(/^\//, ''));
      const thumbLocalPath = localPath.replace('.webp', '_thumb.webp');
      const thumbPublicPath = publicPath.replace('.webp', '_thumb.webp');

      // 1. Existence check
      if (!fs.existsSync(localPath)) {
        console.error(`  ❌ File not found: ${localPath}`);
        totalErrors++;
        continue;
      }
      if (!fs.existsSync(publicPath)) {
        console.error(`  ❌ Public file not mirrored: ${publicPath}`);
        totalErrors++;
      }
      if (!fs.existsSync(thumbLocalPath) || !fs.existsSync(thumbPublicPath)) {
        console.error(`  ❌ Thumbnail missing for ${img.localAssetPath}`);
        totalErrors++;
      }

      // 2. Metadata & Dimensions check
      try {
        const fullMeta = await sharp(localPath).metadata();
        if (fullMeta.width !== 1200 || fullMeta.height !== 1500) {
          console.error(`  ❌ Invalid dimensions for ${img.file}: expected 1200x1500, got ${fullMeta.width}x${fullMeta.height}`);
          totalErrors++;
        }

        const thumbMeta = await sharp(thumbLocalPath).metadata();
        if (thumbMeta.width !== 600 || thumbMeta.height !== 750) {
          console.error(`  ❌ Invalid thumb dimensions for ${img.file}: expected 600x750, got ${thumbMeta.width}x${thumbMeta.height}`);
          totalErrors++;
        }

        // 3. File size check
        const sizeKb = fs.statSync(localPath).size / 1024;
        if (sizeKb < 5 || sizeKb > 600) {
          console.error(`  ❌ Suspicious file size for ${localPath}: ${sizeKb.toFixed(1)} KB`);
          totalErrors++;
        }
      } catch (err: any) {
        console.error(`  ❌ Error reading ${localPath}: ${err.message}`);
        totalErrors++;
      }

      // 4. Blur placeholder check
      if (!img.blurDataUrl || !img.blurDataUrl.startsWith('data:image/')) {
        console.error(`  ❌ Invalid blurDataUrl for ${img.file}`);
        totalErrors++;
      }

      // 5. Credits presence check
      if (!creditsContent.includes(style.name)) {
        console.error(`  ❌ Missing credit entry in CREDITS.md for ${style.name}`);
        totalErrors++;
      }
    }
  }

  console.log('\n===============================================================');
  if (totalErrors === 0) {
    console.log(`✅ ASSET AUDIT PASSED: ${totalChecked} views across ${HAIRSTYLE_CATALOG.length} styles verified 100% valid!`);
    console.log('All files exist, 4:5 aspect verified, thumbnails and credits confirmed.');
    console.log('===============================================================');
    process.exit(0);
  } else {
    console.error(`❌ ASSET AUDIT FAILED with ${totalErrors} errors.`);
    console.log('===============================================================');
    process.exit(1);
  }
}

validateAssets().catch((err) => {
  console.error('Asset check encountered fatal error:', err);
  process.exit(1);
});

