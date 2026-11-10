/* Componentes para apps: 17 bloques (gráficos, calendario, tareas, filtros, formularios, avisos, hojas). */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const src = fs.readFileSync(path.join(__dirname, '../web/js/tinta-widgets.js'), 'utf8');
const ids = [...src.matchAll(/id: '(w-[a-z-]+)', role: '([a-z]+)'/g)].map(m => m[1]), roles = new Set([...src.matchAll(/id: 'w-[a-z-]+', role: '([a-z]+)'/g)].map(m => m[1]));
ok(ids.length === 17 && new Set(ids).size === 17, 'hay 17 componentes con id único');
ok(['data', 'widgets', 'list', 'inputs', 'forms', 'notices', 'sheets'].every(r => roles.has(r)), 'cubren datos, widgets, listas, entradas, formularios, avisos y hojas');
ok(!/<script|javascript:|\bon[a-z]+=|@import|url\((?!#)|<iframe|<img/i.test(src), 'sin scripts, manejadores, imágenes ni recursos externos');
const CHECK = () => { const L = c => { const [r, g, b] = c.slice(0, 3).map(v => v / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4); return r * .2126 + g * .7152 + b * .0722; }, CR = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const rgb = s => { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : null; }, up = e => e.parentElement || (e.parentNode && e.parentNode.host) || null;
  const bgOf = e => { for (let x = e; x && x.nodeType === 1; x = up(x)) { const c = getComputedStyle(x); if (c.backgroundImage !== 'none') { const m = c.backgroundImage.match(/rgba?\([^)]*\)/g); if (m) { const v = m.map(rgb).filter(v => v.length < 4 || v[3] > .5); if (v.length) return v; } } const v = rgb(c.backgroundColor); if (v && (v.length < 4 || v[3] > .5)) return [v]; } return [[255, 255, 255]]; };
  const bad = []; document.querySelectorAll('#phoneContent .component-host').forEach(h => { const w = document.createTreeWalker(h.shadowRoot, NodeFilter.SHOW_TEXT); while (w.nextNode()) { const t = w.currentNode; if (!t.textContent.trim()) continue; const e = t.parentElement; if (e.closest('svg,style') || !e.getClientRects().length) continue; const c = getComputedStyle(e); let op = 1; for (let x = e; x && x.nodeType === 1 && !(x.classList && x.classList.contains('component-host')); x = up(x)) op *= +getComputedStyle(x).opacity; const fg = rgb(c.color), a = (fg[3] ?? 1) * op, size = parseFloat(c.fontSize), need = (size >= 18.66 || (size >= 14 && +c.fontWeight >= 700)) ? 3 : 4.5; for (const bg of bgOf(e)) { const r = CR(fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a)), bg); if (r < need) bad.push('"' + t.textContent.trim().slice(0, 16) + '" ' + r.toFixed(2)); } } }); return bad; };
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 390, height: 900 } }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message)); await pg.emulateMedia({ reducedMotion: 'reduce' });
  await pg.addInitScript(() => addEventListener('DOMContentLoaded', () => { const g = document.getElementById('gallery'); if (g) g.classList.add('all'); }));
  await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.gallery-item');
  ok(await pg.evaluate(ids => ids.every(id => { const h = document.querySelector(`.gallery-item[data-id="${id}"] .component-host`); return h && h.shadowRoot.textContent.trim().length > 5; }), ids), 'los 17 aparecen en la biblioteca con contenido');
  ok(await pg.evaluate(() => [...document.querySelectorAll('.gallery-item .role-tag')].every(t => !/undefined/.test(t.textContent))), 'ninguna ficha muestra «undefined» en su etiqueta de categoría');
  ok(await pg.evaluate(() => [...document.querySelectorAll('#catalogCategory option')].some(o => o.value === 'flow') && document.querySelector('.gallery-item[data-id="f-chat"] .role-tag').textContent.startsWith('Pantallas de recorrido')), 'las pantallas de recorrido tienen su categoría');
  await pg.fill('#catalogSearch', 'calendario'); ok(await pg.locator('.gallery-item[data-id=w-calendario]').count() === 1, 'se encuentran con el buscador'); await pg.fill('#catalogSearch', '');
  ok(await pg.evaluate(ids => ids.every(id => { const host = document.querySelector(`.gallery-item[data-id="${id}"] .component-host`); return host.scrollWidth <= host.clientWidth + 1; }), ids), 'ninguno desborda su tarjeta en móvil');
  // Se pueden elegir, componer y exportar; «Adaptar textos» no pisa cifras y fechas
  const draft = { brief: 'Una app para mi cafetería', selected: ['h-minimal', ...ids, 'n-soft'], choices: { header: 'h-minimal', nav: 'n-soft' }, content: {}, repeat: {}, motion: {}, palette: null, multi: false, flows: null, assets: {}, ui: {}, buttonStyles: {}, cardStyles: {} };
  const compose = async pal => { await pg.evaluate(([d, pal]) => { d.palette = pal; localStorage.setItem('estilos-tinta-prototype-v1', JSON.stringify(d)); }, [draft, pal]); await pg.goto('http://127.0.0.1:8080/index.html#pantalla'); await pg.reload(); await pg.waitForSelector('#phoneContent .component-host'); await pg.waitForTimeout(400); };
  await compose(null); ok(await pg.locator('#phoneContent .component-host').count() >= 18, 'se componen con el resto de bloques en la pantalla');
  const before = await pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].find(h => h.dataset.bid === 'w-calendario').shadowRoot.textContent.replace(/\s+/g, ' '));
  await pg.click('[data-act=adapt-text]'); await pg.waitForTimeout(300);
  const after = await pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].find(h => h.dataset.bid === 'w-calendario').shadowRoot.textContent.replace(/\s+/g, ' '));
  ok(before === after && /Marzo 2026/.test(after), '«Adaptar textos a mi idea» no pisa el calendario ni las cifras');
  const adapted = await pg.evaluate(() => { const c = JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1')).content; return Object.keys(c).filter(k => k.startsWith('w-')); }); ok(adapted.every(k => ['w-filtros', 'w-contacto', 'w-pago', 'w-valoracion', 'w-avisos', 'w-dialogo', 'w-hoja'].includes(k)), 'solo se adaptan los componentes de texto libre');
  for (const pal of [null, 'noche', 'olivo']) { await compose(pal); const bad = await pg.evaluate(CHECK); ok(bad.length === 0, `${pal || 'sin paleta'}: todos los textos de los componentes se leen · ${bad.slice(0, 4).join(' | ')}`); }
  ok(!errors.length, 'sin errores de página: ' + errors.join(' | '));
  await b.close(); console.log(`${n} comprobaciones de componentes correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
