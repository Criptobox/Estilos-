/* Ilustraciones por copia de tarjeta: datos seguros, una distinta por copia y sector, paleta, exportación y foto propia. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const A = require('../web/js/tinta-art.js'), TS = require('../web/js/tinta-sectors.js'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const names = Object.keys(A.ART).filter(k => A.ART[k]);
ok(names.length === 28 && A.ART.cup === null && ['burger', 'pizza', 'icecream', 'fries', 'soda'].every(k => typeof A.ART[k] === 'function') && /<svg/.test(A.get('burger')) && A.get('nada') === null, 'hay 28 ilustraciones propias (con hamburguesa, pizza, helado, patatas y refresco) más la taza original');
ok(names.every(k => { const s = A.ART[k](A.colors({})); return /^<svg viewBox="0 0 240 140" aria-hidden="true">/.test(s) && s.endsWith('</svg>') && !/<script|<text|<image|onload|onclick|href|javascript:|<foreignObject/i.test(s); }), 'todas son SVG de 240×140, sin texto, imágenes, enlaces ni scripts');
ok(TS.SECTORS.every(s => A.BY_SECTOR[s.id] && A.BY_SECTOR[s.id].length >= 3) && Object.values(A.BY_SECTOR).flat().every(k => k in A.ART), 'cada sector tiene 3 o 4 objetos y todos existen');
ok(new Set(A.BY_SECTOR.comida.map((_, i) => A.pick('comida', i))).size === 4 && A.pick('comida', 0) === null && A.pick('comida', 4) === null && A.pick('tienda', 0) === A.pick('tienda', 4), 'la taza original se conserva y las copias recorren la lista en ciclo');
ok(A.pick('nada', 0) === null, 'sector desconocido: conserva la imagen original');
{ const bad = A.pick('tienda', 0, { a: '"><script>alert(1)</script>', b: 'red', i: 'x', p: '#fff' }); ok(!/<script|onerror|alert/i.test(bad) && bad.includes(A.colors({}).a), 'los colores no válidos se descartan (no se inyectan) y se usan los de reserva'); }
ok(/#112233/.test(A.pick('tienda', 0, { a: '#112233', b: '#445566', i: '#778899', p: '#ffffff' })), 'los colores de la paleta se aplican a la ilustración');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  const media = () => pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].map(h => { const s = h.shadowRoot.querySelector('.media>svg'); return s ? s.outerHTML : null; }).filter(Boolean));
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.waitForSelector('.template-card');
  await pg.click('.template-card[data-id=tpl-cafeteria] [data-act=use-template]'); await pg.waitForSelector('#review', { state: 'visible' });
  const cafe = await media(); ok(cafe.length === 5 && new Set(cafe).size >= 4, 'Cafetería: 2 productos y 3 platos con ilustraciones distintas (al menos 4 diferentes)');
  ok(/id="cup"/.test(cafe[0]) && !/id="cup"/.test(cafe[1]), 'la primera conserva la taza original y las demás cambian');
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.waitForSelector('.template-card'); await pg.click('.template-card[data-id=tpl-tienda] [data-act=use-template]'); await pg.waitForSelector('#review', { state: 'visible' });
  const tienda = await media(); ok(tienda.length === 4 && new Set(tienda).size === 4 && tienda.every(s => !/id="cup"/.test(s)), 'Tienda: 4 productos con etiqueta y objetos de tienda, sin ninguna taza de café');
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.waitForSelector('.palette-card'); await pg.click('.palette-card[data-id=oceano] [data-act=use-palette]');
  await pg.goto('http://127.0.0.1:8080/index.html#pantalla'); await pg.waitForSelector('#phoneContent .component-host');
  ok((await media()).some(s => /#0e7490/i.test(s)), 'con la paleta Océano los objetos usan su acento');
  await pg.click('#screenTabs [data-id=explorar]'); const ex = await media(); ok(ex.length === 4 && new Set(ex).size >= 3, 'Explorar también trae objetos distintos');
  await pg.click('#screenTabs [data-id=inicio]'); await pg.click('#composeButton'); const dl = pg.waitForEvent('download'); await pg.click('[data-act=export]'); const file = path.join(os.tmpdir(), 'ilu-' + Date.now() + '.html'); await (await dl).saveAs(file); const html = fs.readFileSync(file, 'utf8'); fs.unlinkSync(file);
  ok((html.match(/viewBox="0 0 240 140"/g) || []).length >= 8 && !/<script>[^<]*onerror/.test(html), 'la exportación incluye las ilustraciones de todas las pantallas');
  // Una tarjeta suelta (sin copias) también usa el objeto del sector.
  const c2 = await b.newContext({ viewport: { width: 1280, height: 1000 } }), q = await c2.newPage(); await q.addInitScript(d => localStorage.setItem('estilos-tinta-prototype-v1', d), JSON.stringify({ brief: 'Una tienda de ropa', selected: ['h-minimal', 'c-coffee', 'a-dark', 'n-soft'], choices: { header: 'h-minimal', nav: 'n-soft' }, content: {}, repeat: {}, motion: {}, palette: null, multi: false, assets: {}, ui: {}, buttonStyles: {}, cardStyles: {} }));
  await q.goto('http://127.0.0.1:8080/index.html#pantalla'); await q.waitForSelector('#phoneContent .component-host');
  ok(await q.evaluate(() => { const s = [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.querySelector('.media>svg')).filter(Boolean); return s.length === 1 && !/id="cup"/.test(s[0].outerHTML); }), 'una tarjeta suelta de tienda no enseña una taza de café');
  const c3 = await b.newContext({ viewport: { width: 1280, height: 1000 } }), r = await c3.newPage(); await r.addInitScript(d => localStorage.setItem('estilos-tinta-prototype-v1', d), JSON.stringify({ brief: 'algo diferente', selected: ['h-minimal', 'c-coffee', 'a-dark', 'n-soft'], choices: { header: 'h-minimal', nav: 'n-soft' }, content: {}, repeat: {}, motion: {}, palette: null, multi: false, assets: {}, ui: {}, buttonStyles: {}, cardStyles: {} }));
  await r.goto('http://127.0.0.1:8080/index.html#pantalla'); await r.waitForSelector('#phoneContent .component-host'); ok(await r.evaluate(() => /id="cup"/.test(document.querySelector('#phoneContent').innerHTML + [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.innerHTML).join(''))), 'sin sector se conserva la imagen original');
  const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto('http://127.0.0.1:8080/index.html#pantalla'); await m.waitForTimeout(300);
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desbordamiento en móvil');
  ok(errors.length === 0, 'sin excepciones: ' + errors.join('|')); await b.close(); console.log(`${n} comprobaciones de ilustraciones correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
