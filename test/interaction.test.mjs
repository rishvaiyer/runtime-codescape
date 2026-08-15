import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('gesture handlers update the stable SVG during movement and redraw only on release', () => {
  const source = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  const moveHandler = source.match(/svg\.addEventListener\('pointermove',[\s\S]*?\);\n  const endGesture/)[0];
  assert.match(moveHandler, /updateGraphGeometry\(\)/);
  assert.match(moveHandler, /applyTransform\(\)/);
  assert.doesNotMatch(moveHandler, /renderCity\(\)/);
});
