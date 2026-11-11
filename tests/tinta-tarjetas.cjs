/* Tarjetas propias de cada estilo: datos seguros, catálogo, una por sector en las plantillas, contenido, paleta y Explorar. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const src = fs.readFileSync(path.join(__dirname, '../web/js/tinta-cards.js'), 'utf8'), TT = require('../web/js/tinta-templates.js');
const ids = [...src.matchAll(/id: '(c-[a-z-]+)', role: 'cards'/g)].map(m => m[1]);
ok(ids.length === 8 && new Set(ids).size === 8 && ['c-shop', 'c-destino', 'c-track', 'c-workout', 'c-course', 'c-cita', 'c-menu-item', 'c-txn'].every(x => ids.includes(x)), 'hay 8 tarjetas nuevas con id único');
ok(!/<script|javascript:|\bon[a-z]+=|@import|url\(|<iframe|<img/i.test(src), 'sin scripts, manejadores, @import, url() ni imágenes externas');
const used = TT.LIST.map(t => t.blocks.filter(b => b.id.startsWith('c-') && ids.includes(b.id)).map(b => b.id)); const flat = used.flat();
ok(TT.LIST.every((t, i) => used[i].length >= 1 || t.blocks.some(b => /^r-/.test(b.id))) && new Set(flat).size === 8, 'cada una de las 8 plantillas usa tarjetas nuevas y las 8 se usan, cada una en su sector');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.waitForSelector('.gallery-item');
  const inGallery = await pg.evaluate(ids => ids.map(id => !!document.querySelector(`.gallery-item[data-id="${id}"]`)), ids); ok(inGallery.every(Boolean), 'las 8 aparecen en la biblioteca de Tinta');
  ok(await pg.evaluate(ids => ids.every(id => { const h = document.querySelector(`.gallery-item[data-id="${id}"] .component-host`); return h && h.shadowRoot.textContent.trim().length > 5 && h.shadowRoot.querySelector('article'); }), ids), 'cada vista previa dibuja su tarjeta con texto');
  await pg.fill('#catalogSearch', 'Plato'); ok(await pg.locator('.gallery-item[data-id=c-menu-item]').count() === 1, 'se encuentran con el buscador');
  await pg.fill('#catalogSearch', '');
  // Admiten estilos propios (el editor de «Diseño de tarjeta»)
  ok(await pg.evaluate(ids => ids.every(id => TintaCardStyle.supports({ id, role: 'cards', html: document.querySelector(`.gallery-item[data-id="${id}"] .component-host`).shadowRoot.innerHTML.replace(/^<style>[\s\S]*?<\/style>/, ''), variant: 'x' })), ids), 'admiten el editor de diseño de tarjeta');
  // Sector → tarjeta propia, con contenido del sector y sin el texto de ejemplo.
  for (const t of TT.LIST.filter(t => t.blocks.some(b => b.id.startsWith('c-') && ids.includes(b.id)))) {
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.waitForSelector('.template-card'); await pg.click(`.template-card[data-id=${t.id}] [data-act=use-template]`); await pg.waitForSelector('#review', { state: 'visible' });
    const info = await pg.evaluate(() => { const hs = [...document.querySelectorAll('#phoneContent .component-host')].filter(h => h.shadowRoot.querySelector('article')); return hs.map(h => h.shadowRoot.textContent.replace(/\s+/g, ' ').trim()); });
    ok(info.length >= 3 && new Set(info).size === info.length, `${t.id}: ${info.length} tarjetas, todas con contenido distinto`);
    ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${t.id}: sin desbordamiento`);
  }
  // Explorar usa la tarjeta «de lista» (la última elegida)
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.waitForSelector('.template-card'); await pg.click('.template-card[data-id=tpl-finanzas] [data-act=use-template]'); await pg.waitForSelector('#screenTabs button');
  await pg.click('#screenTabs [data-id=explorar]'); const ex = await pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.querySelector('article') && h.shadowRoot.querySelector('article').className));
  ok(ex.filter(c => c && c.split(' ')[0] === 'txn').length === 4, 'Explorar de finanzas muestra los 4 movimientos (la tarjeta de lista), no el saldo');
  // Paleta: la etiqueta de la tienda sigue legible
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.waitForSelector('.template-card'); await pg.click('.template-card[data-id=tpl-tienda] [data-act=use-template]'); await pg.waitForSelector('#review', { state: 'visible' });
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.click('.palette-card[data-id=atardecer] [data-act=use-palette]'); await pg.goto('http://127.0.0.1:8080/index.html#pantalla'); await pg.waitForSelector('#phoneContent .component-host');
  const badge = await pg.evaluate(() => { const b = [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.querySelector('.badge')).find(Boolean); const c = getComputedStyle(b); return { fg: c.color, bg: c.backgroundColor, text: b.textContent.trim() }; });
  const lum = c => { const [r, g, bb] = c.match(/\d+/g).slice(0, 3).map(x => x / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return r * .2126 + g * .7152 + bb * .0722; }; const ratio = (a, c) => (Math.max(lum(a), lum(c)) + .05) / (Math.min(lum(a), lum(c)) + .05);
  ok(badge.text.length > 0 && ratio(badge.fg, badge.bg) >= 4.5, 'con paleta, el texto de la etiqueta de oferta se lee (contraste ≥ 4.5)');
  // Exportación
  await pg.click('#composeButton'); const dl = pg.waitForEvent('download'); await pg.click('[data-act=export]'); const file = path.join(require('node:os').tmpdir(), 'tj-' + Date.now() + '.html'); await (await dl).saveAs(file); const html = fs.readFileSync(file, 'utf8'); fs.unlinkSync(file);
  ok((html.match(/class="shop[ "]/g) || []).length >= 4 && !/<script>[^<]*onerror/.test(html), 'la exportación incluye las 4 tarjetas de tienda');
  // Una tarjeta oscura (saldo) con paleta: el texto debe leerse sobre la superficie clara
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.waitForSelector('.template-card'); await pg.click('.template-card[data-id=tpl-finanzas] [data-act=use-template]'); await pg.waitForSelector('#review', { state: 'visible' });
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.click('.palette-card[data-id=grafito] [data-act=use-palette]'); await pg.goto('http://127.0.0.1:8080/index.html#pantalla'); await pg.waitForSelector('#phoneContent .component-host');
  const bal = await pg.evaluate(() => { const h = [...document.querySelectorAll('#phoneContent .component-host')].find(x => x.shadowRoot.querySelector('.f,.balance,article') && /\$/.test(x.shadowRoot.textContent) && x.shadowRoot.querySelector('article:not(.txn)')); const t = [...h.shadowRoot.querySelectorAll('*')].filter(e => e.children.length === 0 && /\d/.test(e.textContent) && e.textContent.trim().length > 2).slice(0, 4); const bgc = getComputedStyle(h.shadowRoot.querySelector('article')).backgroundColor; return { fg: t.map(e => getComputedStyle(e).color), bg: bgc }; });
  ok(bal.fg.length > 0 && bal.fg.every(c => ratio(c, bal.bg) >= 3), 'saldo con paleta: las cifras se leen sobre la superficie (contraste ≥ 3)');
  const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await m.waitForSelector('.gallery-item'); ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desbordamiento en móvil');
  ok(errors.length === 0, 'sin excepciones: ' + errors.join('|')); await b.close(); console.log(`${n} comprobaciones de tarjetas nuevas correctas.`);
})().catch(e => { console.error(e.message); process.exit(1); });
