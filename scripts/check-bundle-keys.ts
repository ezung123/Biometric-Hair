// ══════════════════════════════════════════════════════════════════════════════
// scripts/check-bundle-keys.ts
// SECURITY AUDIT: Scans client-side code and bundle outputs for secret key patterns
// Fails with non-zero exit code if any secret key is detected in client code.
// ══════════════════════════════════════════════════════════════════════════════

import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN_KEY_PATTERNS = [
  /b10_[a-zA-Z0-9_-]{10,}/g,          // Baseten API keys
  /sk-or-v1-[a-zA-Z0-9_-]{10,}/g,     // OpenRouter API keys
  /sk-ant-[a-zA-Z0-9_-]{10,}/g,        // Anthropic keys
  /AIza[0-9A-Za-z-_]{35}/g,            // Google API keys
  /fw_[a-zA-Z0-9_-]{15,}/g,            // Fireworks keys
];

const SCAN_DIRS = ['src', 'public', 'web-build', 'dist'];
const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.html'];

let violations = 0;
let filesScanned = 0;

function scanFile(filePath: string) {
  filesScanned++;
  const content = fs.readFileSync(filePath, 'utf8');

  for (const pattern of FORBIDDEN_KEY_PATTERNS) {
    if (pattern.test(content)) {
      console.error(`❌ SECURITY VIOLATION: Secret key pattern detected in client file: ${filePath}`);
      console.error(`   The file contains a hardcoded API key pattern. Remove it immediately!`);
      violations++;
    }
  }
}

function walkDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.expo') {
        walkDir(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        scanFile(fullPath);
      }
    }
  }
}

console.log('===============================================================');
console.log('CLIENT BUNDLE & SOURCE CODE SECURITY AUDIT');
console.log('Scanning for hardcoded API keys in client-side code...');
console.log('===============================================================');

for (const dir of SCAN_DIRS) {
  walkDir(path.resolve(process.cwd(), dir));
}

console.log(`\nFiles scanned: ${filesScanned}`);

if (violations > 0) {
  console.error(`\n❌ AUDIT FAILED: ${violations} security violation(s) found!`);
  console.error('All API keys must remain strictly in .env and server/proxy.ts.');
  process.exit(1);
} else {
  console.log('✅ AUDIT PASSED: Zero secret key patterns found in client files.');
  console.log('===============================================================');
  process.exit(0);
}

