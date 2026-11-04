const fs = require('fs');
const path = require('path');

const files = [
  'node_modules/@mediapipe/tasks-vision/vision_bundle.mjs',
  'node_modules/@mediapipe/tasks-vision/vision_bundle.cjs',
  'node_modules/@mediapipe/tasks-vision/vision_bundle.js',
];

for (const relPath of files) {
  const f = path.resolve(process.cwd(), relPath);
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    let modified = false;

    if (content.includes('import(t.toString())')) {
      content = content.replaceAll(
        'import(t.toString())',
        '(new Function("url", "return import(url)"))(t.toString())'
      );
      modified = true;
    }

    if (content.includes('import(e.toString())')) {
      content = content.replaceAll(
        'import(e.toString())',
        '(new Function("url", "return import(url)"))(e.toString())'
      );
      modified = true;
    }

    // Generic regex for any import(variable.toString()) that trips Metro's dynamic import parser
    const regex = /import\(([a-zA-Z0-9_$]+)\.toString\(\)\)/g;
    if (regex.test(content)) {
      content = content.replace(regex, '(new Function("url", "return import(url)"))($1.toString())');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(f, content, 'utf8');
      console.log('Successfully patched Metro AST dynamic import in:', f);
    }
  }
}
