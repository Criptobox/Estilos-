/* Bloques y plantillas inspirados en apps reales: 19 bloques, 6 plantillas, contenido por copia y contraste. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const src = fs.readFileSync(path.join(__dirname, '../web/js/tinta-refs.js'), 'utf8') + fs.readFileSync(path.join(__dirname, '../web/js/tinta-refs2.js'), 'utf8') + fs.readFileSync(path.join(__dirname, '../web/js/tinta-refs3.js'), 'utf8'), TT = require('../web/js/tinta-templates.js'), TS = require('../web/js/tinta-sectors.js');
const ids = [...src.matchAll(/id: '((?:r|n|h)-[a-z0-9-]+)', role: '(\w+)'/g)].map(m => m[1]);
ok(ids.length === 47 && new Set(ids).size === 47, 'hay 47 bloques nuevos con id único (19 + 17 + 11)');
ok(!/<script|javascript:|\bon[a-z]+=|@import|url\((?!#)|<iframe|<img/i.test(src), 'sin scripts, manejadores, imágenes ni recursos externos');
const NEW = ['tpl-compra', 'tpl-tienda-oscura', 'tpl-envios', 'tpl-doctores', 'tpl-asistente', 'tpl-agentes', 'tpl-fitness-oscuro', 'tpl-viajes-cristal', 'tpl-pizzeria', 'tpl-transporte', 'tpl-ia-voz', 'tpl-ia-ayuda', 'tpl-ia-salud'];
ok(NEW.every(id => TT.get(id)) && NEW.every(id => { const t = TT.get(id), d = TS.detect(t.brief); return d && d.id === t.sector; }), '13 plantillas nuevas, cada una con una idea que activa su sector');
const CHECK = () => { const L = c => { const [r, g, b] = c.slice(0, 3).map(v => v / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4); return r * .2126 + g * .7152 + b * .0722; }, CR = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const rgb = s => { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : null; }, up = e => e.parentElement || (e.parentNode && e.parentNode.host) || null;
  const bgOf = e => { for (let x = e; x && x.nodeType === 1; x = up(x)) { const c = getComputedStyle(x); if (c.backgroundImage !== 'none') { const m = c.backgroundImage.match(/rgba?\([^)]*\)/g); if (m) { const v = m.map(rgb).filter(v => v.length < 4 || v[3] > .5); if (v.length) return v; } } const v = rgb(c.backgroundColor); if (v && (v.length < 4 || v[3] > .5)) return [v]; } return [[255, 255, 255]]; };
  const bad = []; document.querySelectorAll('#phoneContent .component-host, #phoneNav .component-host').forEach(h => { const w = document.createTreeWalker(h.shadowRoot, NodeFilter.SHOW_TEXT); while (w.nextNode()) { const t = w.currentNode; if (!t.textContent.trim()) continue; const e = t.parentElement; if (e.closest('svg,style') || !e.getClientRects().length) continue; const c = getComputedStyle(e); let op = 1; for (let x = e; x && x.nodeType === 1 && !(x.classList && x.classList.contains('component-host')); x = up(x)) op *= +getComputedStyle(x).opacity; const fg = rgb(c.color), a = (fg[3] ?? 1) * op, size = parseFloat(c.fontSize), need = (size >= 18.66 || (size >= 14 && +c.fontWeight >= 700)) ? 3 : 4.5; for (const bg of bgOf(e)) { const r = CR(fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a)), bg); if (r < need) bad.push('"' + t.textContent.trim().slice(0, 16) + '" ' + r.toFixed(2)); } } }); return bad; };
(async () => {
  const b = await chromium.launch(), pg = await (await b.newContext({ viewport: { width: 390, height: 900 } })).newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message)); await pg.emulateMedia({ reducedMotion: 'reduce' });
  const draft = () => pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1') || '{}'));
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.evaluate(() => localStorage.clear()); await pg.goto('http://127.0.0.1:8080/index.html#bloques/plantillas'); await pg.waitForSelector('.template-card:not([hidden])');
  ok(await pg.evaluate(ids => ids.every(id => !!document.querySelector(`.template-card[data-id="${id}"]`)), NEW), 'las 13 aparecen en la categoría Plantillas');
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/barras/apps'); await pg.waitForSelector('.gallery-item'); ok(await pg.locator('.gallery-item').count() === 7, 'Barras › De apps reales muestra las 7 barras nuevas');
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/tarjetas/comercio'); await pg.waitForSelector('.gallery-item'); ok(await pg.locator('.gallery-item').count() >= 9, 'Tarjetas › Comercio y pedidos agrupa las tarjetas de comercio');
  // Cada plantilla: contenido distinto por copia, sin desbordes y todos los textos legibles
  for (const id of NEW) {
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.evaluate(() => localStorage.clear()); await pg.goto('http://127.0.0.1:8080/index.html#bloques/plantillas'); await pg.waitForSelector('.template-card:not([hidden])');
    await pg.click(`.template-card[data-id=${id}] [data-act=use-template]`); await pg.waitForSelector('#screenTabs button'); await pg.waitForTimeout(300);
    const t = TT.get(id); ok(JSON.stringify((await draft()).selected) === JSON.stringify(t.blocks.map(x => x.id)), `${id}: carga sus bloques`);
    const hosts = await pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].map(h => ({ bid: h.dataset.bid, text: h.shadowRoot.textContent.replace(/\s+/g, ' ').trim() })));
    const reps = t.blocks.filter(x => x.repeat); ok(reps.every(r => { const hs = hosts.filter(h => h.bid === r.id); return hs.length === r.repeat && new Set(hs.map(h => h.text)).size === hs.length; }), `${id}: las copias repetidas traen contenido distinto`);
    ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${id}: sin desborde`);
    for (const s of ['inicio', 'perfil']) { if (!await pg.$(`#screenTabs [data-id=${s}]`)) continue; await pg.click(`#screenTabs [data-id=${s}]`); await pg.waitForTimeout(100); const bad = await pg.evaluate(CHECK); ok(bad.length === 0, `${id}/${s}: todos los textos se leen · ${bad.slice(0, 3).join(' | ')}`); }
  }
  // Selector de barra inferior: cambia la barra de toda la app y se puede deshacer
  await pg.click('#screenTabs [data-id=inicio]'); const navBefore = (await draft()).choices.nav;
  ok(await pg.evaluate(() => document.querySelectorAll('#navPick option').length >= 20), 'el selector lista todas las barras de la biblioteca');
  await pg.selectOption('#navPick', 'n-pastilla-activa'); ok((await draft()).choices.nav === 'n-pastilla-activa' && (await draft()).selected.filter(x => /^n-/.test(x)).length === 1 && await pg.evaluate(() => !!document.querySelector('#phoneNav .component-host').shadowRoot.querySelector('.pa')), 'elegir una barra la aplica y deja solo esa');
  await pg.click('#undoDraft'); ok((await draft()).choices.nav === navBefore, 'Deshacer devuelve la barra anterior');
  await pg.selectOption('#navPick', 'n-tres-minima'); await pg.click('#screenTabs [data-id=perfil]'); ok(await pg.evaluate(() => document.querySelectorAll('#phoneNav .component-host').length === 1) && await pg.evaluate(() => document.querySelector('#phoneNav .component-host').shadowRoot.querySelectorAll('button').length === 3), 'la barra elegida llega a todas las pantallas');
  // «Adaptar textos» no toca cifras ni copias propias
  await pg.click('#screenTabs [data-id=inicio]'); const before = await pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.textContent).join('|')); await pg.evaluate(() => document.querySelector('[data-act=adapt-text]').click()); await pg.waitForTimeout(300); ok((await pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.textContent).join('|'))) === before, '«Adaptar textos» no pisa los datos de ejemplo de estos bloques');
  ok(!errors.length, 'sin errores de página: ' + errors.join(' | '));
  await b.close(); console.log(`${n} comprobaciones de referencias correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
