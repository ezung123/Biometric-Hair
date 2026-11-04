const fs = require('fs');

const files = [
  'node_modules/@mediapipe/tasks-vision/vision_bundle.mjs',
  'node_modules/@mediapipe/tasks-vision/vision_bundle.cjs',
  'node_modules/@mediapipe/tasks-vision/vision_bundle.js',
];

for (const f of files) {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('await import(t.toString())')) {
      content = content.replace(
        'await import(t.toString())',
        'await (new Function("url", "return import(url)"))(t.toString())'
      );
      fs.writeFileSync(f, content);
      console.log('Successfully patched Metro AST dynamic import in:', f);
    }
  }
}

