const test = require('node:test'), assert = require('node:assert/strict');
const B = require('../../web/js/tinta-backgrounds.js'), V = require('../../web/js/tinta-visual.js'), Art = require('../../web/js/tinta-art.js'), Tax = require('../../web/js/tinta-taxonomy.js');
test('20 fondos válidos: solo gradientes y colores, sin recursos externos', () => {
  assert.equal(B.LIST.length, 20); assert.equal(new Set(B.LIST.map(b => b.id)).size, 20); assert.ok(B.LIST.every(B.valid));
  assert.ok(B.LIST.every(b => !/url\(|@import|<|javascript:/i.test(b.bg)));
  assert.equal(B.LIST.filter(b => b.dark).length, 5); assert.ok(B.LIST.every(b => B.GROUPS.some(g => g.id === b.group)));
});
test('11 estilos visuales con CSS equilibrado y sin recursos externos', () => {
  assert.equal(V.LIST.length, 11); assert.equal(new Set(V.LIST.map(v => v.id)).size, 11);
  for (const v of V.LIST) { const css = v.css(v.accent); assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length, v.id); assert.ok(!/url\(|@import|<script/i.test(css), v.id); assert.match(v.accent, /^#[0-9a-f]{6}$/i); assert.ok(V.GROUPS.some(g => g.id === v.group), v.id); }
});
test('41 ilustraciones SVG de 240×140 sin texto, imágenes, enlaces ni scripts', () => {
  const nombres = Object.keys(Art.ART).filter(k => Art.ART[k]); assert.equal(nombres.length, 41);
  for (const k of nombres) { const s = Art.ART[k](Art.colors({})); assert.ok(/^<svg viewBox="0 0 240 140" aria-hidden="true">/.test(s) && s.endsWith('</svg>'), k); assert.ok(!/<script|<text|<image|onload|onclick|href|javascript:|<foreignObject/i.test(s), k); }
});
test('Art.colors descarta colores inválidos y usa los de reserva', () => {
  const c = Art.colors({ a: 'red;x', b: '#112233' }); assert.match(c.a, /^#[0-9a-f]{6}$/i); assert.equal(c.b, '#112233');
});
test('17 categorías de la biblioteca con id único y subcategorías sin repetir', () => {
  assert.equal(Tax.CATEGORIES.length, 17); assert.equal(new Set(Tax.CATEGORIES.map(c => c.id)).size, 17);
  for (const c of Tax.CATEGORIES) { const subs = Tax.subsFor(c, []); assert.equal(new Set(subs.map(s => s.id)).size, subs.length, c.id); }
});
