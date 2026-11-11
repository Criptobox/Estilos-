/* Plantillas completas: datos válidos, vista previa, aplicar (con deshacer), idea y copias. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path');
const TT = require('../web/js/tinta-templates.js'), TS = require('../web/js/tinta-sectors.js'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const src = fs.readFileSync(path.join(__dirname, '../web/js/crear.js'), 'utf8'); const byId = {}; for (const m of src.matchAll(/\{id:'([a-z]-[a-z0-9]+)',role:'(\w+)'/g)) byId[m[1]] = { role: m[2] };
for (const m of fs.readFileSync(path.join(__dirname, '../web/js/tinta-cards.js'), 'utf8').matchAll(/id: '([a-z]-[a-z-]+)', role: '(\w+)'/g)) byId[m[1]] = { role: m[2] };
for (const m of fs.readFileSync(path.join(__dirname, '../web/js/tinta-widgets.js'), 'utf8').matchAll(/id: '(w-[a-z-]+)', role: '(\w+)'/g)) byId[m[1]] = { role: m[2] };
ok(TT.LIST.length === 9 && new Set(TT.LIST.map(t => t.id)).size === 9, 'hay 9 plantillas con id único (8 de sector y el panel de control)');
ok(TT.LIST.every(t => TT.problems(t, byId).length === 0), 'todas usan bloques que existen y tienen cabecera, tarjetas y barra');
ok(TT.LIST.every(t => { const d = TS.detect(t.brief); return d && d.id === t.sector; }), 'la idea de ejemplo de cada plantilla activa su sector');
ok(new Set(TT.LIST.map(t => t.sector)).size === 8 && TT.LIST.filter(t => t.sector === 'finanzas').length === 2, 'las 8 plantillas de sector cubren los 8 sectores (finanzas tiene además el panel)');
ok(TT.problems({ blocks: [{ id: 'c-coral', repeat: 9 }] }, byId).length >= 1 && TT.problems({ blocks: [{ id: 'nope' }] }, byId).length >= 1, 'detecta plantillas inválidas');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  const draft = () => pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1')));
  await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.template-card');
  ok(await pg.locator('.template-card').count() === 9, 'la biblioteca muestra las 9 plantillas');
  ok(await pg.evaluate(() => [...document.querySelectorAll('.template-card')].every(c => c.querySelectorAll('.component-host').length >= 3 && [...c.querySelectorAll('.component-host')].every(h => h.shadowRoot.textContent.trim().length > 0))), 'cada vista previa dibuja bloques reales con contenido');
  await pg.waitForFunction(() => { const f = document.querySelector('.template-frame'); return Math.abs(f.querySelector('.template-screen').getBoundingClientRect().width - f.getBoundingClientRect().width) < 4; }, null, { timeout: 5000 }); ok(true, 'la vista previa se escala al ancho de la tarjeta');
  ok((await pg.locator('[data-act=use-template]').first().getAttribute('aria-label')).startsWith('Usar la plantilla'), 'botones con etiqueta accesible');
  // Elegir primero un bloque propio para comprobar que «Usar» se puede deshacer.
  await pg.click('.gallery-item[data-id=a-dark] [data-act=select]'); const prev = (await draft()).selected;
  await pg.click('.template-card[data-id=tpl-cafeteria] [data-act=use-template]'); await pg.waitForSelector('#review', { state: 'visible' });
  const d = await draft(); ok(JSON.stringify(d.selected) === JSON.stringify(['h-search', 'c-coffee', 'c-menu-item', 'a-coral', 'n-soft']) && d.repeat['c-coffee'] === 2 && d.repeat['c-menu-item'] === 3, 'carga los bloques y las copias de la plantilla (productos y platos)');
  ok(d.choices.header === 'h-search' && d.choices.nav === 'n-soft', 'fija cabecera y barra');
  ok(/cafetería/.test(d.brief) && JSON.stringify(Object.keys(d.content).sort()) === '["a-coral","h-search"]', 'usa la idea de ejemplo y adapta el texto de la cabecera y del botón (las tarjetas llevan sus copias)');
  ok(!/Algo bueno empieza aquí|Crear algo increíble/.test(JSON.stringify(d.content)), 'la cabecera y el botón ya no conservan los textos genéricos');
  ok(await pg.locator('#phoneContent .component-host').count() >= 7, 'la pantalla muestra las 4 copias con contenido del sector');
  ok(/aplicada/.test(await pg.locator('#toast').textContent()), 'avisa de que se aplicó y se puede deshacer');
  await pg.keyboard.press('Control+z'); ok(JSON.stringify((await draft()).selected) === JSON.stringify(prev), 'Ctrl+Z restaura la selección anterior');
  await pg.evaluate(() => { const e = document.getElementById('idea'); e.value = 'Mis finanzas personales'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.template-card');
  await pg.click('.template-card[data-id=tpl-finanzas] [data-act=use-template]'); await pg.waitForSelector('#review', { state: 'visible' });
  ok((await draft()).brief === 'Mis finanzas personales', 'conserva tu idea si ya es del mismo sector');
  ok(JSON.stringify((await draft()).selected) === JSON.stringify(['h-minimal', 'c-balance', 'c-txn', 'a-soft', 'n-dark']), 'plantilla de finanzas aplicada (saldo y movimientos)');
  const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto('http://127.0.0.1:8080/index.html#bloques'); await m.waitForSelector('.template-card');
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desbordamiento en móvil (la fila se desplaza dentro)');
  ok(errors.length === 0, 'sin excepciones: ' + errors.join('|')); await b.close(); console.log(`${n} comprobaciones de plantillas correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
