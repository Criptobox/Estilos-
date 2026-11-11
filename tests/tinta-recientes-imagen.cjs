/* Recientes (compartidos con la clásica) y descarga de imágenes PNG/SVG, con SVG inerte. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const I = require('../web/js/tinta-image.js'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
ok(I.slug('Producto con aire!') === 'producto-con-aire' && I.slug('') === 'diseno' && I.slug('Ñandú · ÁÉ') === 'nandu-ae', 'slug de nombres de archivo');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  // XSS: el SVG nunca debe llevar scripts ni manejadores.
  await pg.goto('http://127.0.0.1:8080/index.html');
  const evil = await pg.evaluate(() => TintaImage.svg({ shadowHtml: '<style>:host{color:red}</style><button onclick="alert(1)">x</button><a href="javascript:alert(1)">y</a><script>alert(2)</script><img src=x onerror=alert(3)><iframe src=//evil></iframe><p>hola<br>mundo</p>', width: 340, height: 100 }).svg);
  ok(!/<script|onclick|onerror|javascript:|<iframe/i.test(evil) && evil.includes('hola') && evil.includes('.th{color:red}'), 'el SVG se limpia: sin scripts, manejadores ni enlaces javascript, y :host pasa a .th');
  ok(await pg.evaluate(s => { const d = new DOMParser().parseFromString(s, 'image/svg+xml'); return !d.querySelector('parsererror') && !!d.querySelector('foreignObject'); }, evil), 'el SVG es XML válido con foreignObject');
  // Recientes
  await pg.evaluate(() => localStorage.setItem('estilos-recent', JSON.stringify(['tar-2', 'solo-clasica', '<x>'])));
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.reload(); await pg.waitForSelector('.gallery-item');
  ok(await pg.locator('#recentCount').textContent() === '1', 'hereda los recientes de la clásica (tar-2) y descarta lo desconocido');
  await pg.click('.gallery-item[data-id=lib-tar-5] .preview-open'); await pg.waitForSelector('#detailDialog[open]');
  ok(await pg.locator('#recentCount').textContent() === '2', 'abrir un diseño lo añade a recientes');
  const stored = await pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-recent'))); ok(stored[0] === 'tar-5' && stored.includes('tar-2') && stored.includes('solo-clasica'), 'se guarda en formato clásico y conserva ids que Tinta no conoce');
  // Descargas
  ok(await pg.locator('[aria-label="Descargar como imagen"]').isVisible(), 'los botones de imagen están a la vista en el detalle');
  const svgDl = pg.waitForEvent('download'); await pg.click('[data-act=download-svg]'); const d1 = await svgDl; ok(/\.svg$/.test(d1.suggestedFilename()), 'descarga SVG con nombre .svg');
  const f1 = path.join(os.tmpdir(), 'ri-' + Date.now() + '.svg'); await d1.saveAs(f1); const svgText = fs.readFileSync(f1, 'utf8'); fs.unlinkSync(f1);
  ok(svgText.startsWith('<svg') && svgText.includes('foreignObject') && !/<script|onclick/i.test(svgText), 'el SVG descargado es un componente real y limpio');
  const pngDl = pg.waitForEvent('download'); await pg.click('[data-act=download-png]'); const d2 = await pngDl; ok(/\.png$/.test(d2.suggestedFilename()), 'descarga PNG con nombre .png');
  const f2 = path.join(os.tmpdir(), 'ri-' + Date.now() + '.png'); await d2.saveAs(f2); const png = fs.readFileSync(f2); fs.unlinkSync(f2);
  ok(png.slice(0, 8).toString('hex') === '89504e470d0a1a0a' && png.length > 2000, 'el PNG es un PNG válido con contenido');
  await pg.keyboard.press('Escape'); await pg.waitForSelector('#detailDialog', { state: 'hidden' });
  // Filtro y orden
  await pg.click('.gallery-item[data-id=lib-tar-1] .preview-open'); await pg.waitForSelector('#detailDialog[open]'); await pg.keyboard.press('Escape'); await pg.waitForSelector('#detailDialog', { state: 'hidden' });
  await pg.click('#recentToggle'); ok(await pg.locator('.gallery-item').count() === 3, 'el filtro muestra solo los recientes');
  ok(await pg.evaluate(() => [...document.querySelectorAll('.gallery-item')].map(e => e.dataset.id).join()) === 'lib-tar-1,lib-tar-5,lib-tar-2', 'ordenados del más reciente al más antiguo');
  await pg.click('#recentToggle'); ok(await pg.locator('.gallery-item').count() > 100, 'quitar el filtro vuelve a mostrar todo');
  await pg.click('.gallery-item[data-id=lib-tar-7] [data-act=select]'); ok((await pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-recent'))))[0] === 'tar-7', 'elegir un diseño también cuenta como reciente');
  const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await m.waitForSelector('.gallery-item');
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desbordamiento en móvil');
  ok(errors.length === 0, 'sin excepciones: ' + errors.join('|')); await b.close(); console.log(`${n} comprobaciones de recientes e imágenes correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
