/* Paletas oscuras y guardián de contraste: 19 paletas oscuras, cada texto de cada pantalla de cada plantilla
   llega a WCAG AA (claro, oscuro y sin paleta), la biblioteca no se oscurece y la exportación lleva lo mismo. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const P = require('../web/js/tinta-palettes.js'), D = require('../web/js/tinta-dark.js'), TT = require('../web/js/tinta-templates.js');
const dark = P.LIST.filter(p => p.dark);
ok(dark.length === 19 && dark.every(p => D.isDark(p)) && P.LIST.filter(p => !p.dark).every(p => !D.isDark(p)), 'hay 19 paletas oscuras y las 47 claras no se tratan como oscuras');
ok(dark.every(p => P.contrast(p.ink, p.surface) >= 7 && P.contrast(p.ink, p.bg) >= 7), 'en cada paleta oscura el texto principal contrasta ≥ 7:1 con fondo y superficie');
const noche = { ...P.get('noche'), muted: D.muted(P.get('noche')) };
const css = D.css('.a{background:linear-gradient(#fff,#f6f4ed);color:#242421;border:1px solid #e7e3d8}.b button{background:#242421;color:#fff}.c{background:#ff704b;color:#fff}', noche);
ok(!/#fff\b|#ffffff|#f6f4ed|#e7e3d8/i.test(css.split('.c{')[0]) && css.includes(noche.line) && css.includes('#ff704b'), 'la capa oscura cambia fondos y bordes claros, conserva los colores vivos');
ok(/\.b button\{background:#ff7a59/.test(css), 'un botón negro pasa al acento de la paleta');
ok(D.html('<div style="background:#fff"><svg><rect fill="#fff"/></svg></div>', noche).includes('fill="#fff"'), 'las ilustraciones SVG no se tocan');
const CHECK = (sel) => { const L = c => { const [r, g, b] = c.slice(0, 3).map(v => v / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4); return r * .2126 + g * .7152 + b * .0722; }, CR = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const rgb = s => { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : null; }, up = e => e.parentElement || (e.parentNode && e.parentNode.host) || null;
  const bgOf = e => { for (let x = e; x && x.nodeType === 1; x = up(x)) { const c = getComputedStyle(x); if (c.backgroundImage !== 'none') { const m = c.backgroundImage.match(/rgba?\([^)]*\)/g); if (m) { const v = m.map(rgb).filter(v => v.length < 4 || v[3] > .5); if (v.length) return v; } } const v = rgb(c.backgroundColor); if (v && (v.length < 4 || v[3] > .5)) return [v]; } return [[255, 255, 255]]; };
  const bad = []; document.querySelectorAll(sel || '#phoneContent .component-host, #phoneNav .component-host').forEach(h => { const w = document.createTreeWalker(h.shadowRoot, NodeFilter.SHOW_TEXT); while (w.nextNode()) { const t = w.currentNode; if (!t.textContent.trim()) continue; const e = t.parentElement; if (e.closest('svg,style') || !e.getClientRects().length) continue; const c = getComputedStyle(e); let op = 1; for (let x = e; x && x.nodeType === 1 && !(x.classList && x.classList.contains('component-host')); x = up(x)) op *= +getComputedStyle(x).opacity; const fg = rgb(c.color), a = (fg[3] ?? 1) * op, size = parseFloat(c.fontSize), need = (size >= 18.66 || (size >= 14 && +c.fontWeight >= 700)) ? 3 : 4.5; for (const bg of bgOf(e)) { const r = CR(fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a)), bg); if (r < need) bad.push('"' + t.textContent.trim().slice(0, 16) + '" ' + r.toFixed(2)); } } }); return bad; };
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message)); await pg.emulateMedia({ reducedMotion: 'reduce' });
  const draft = () => pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1') || '{}'));
  async function setup(tpl, pal) {
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.waitForSelector('.template-card'); await pg.click(`.template-card[data-id=${tpl}] [data-act=use-template]`); await pg.waitForSelector('#review', { state: 'visible' });
    const cur = (await draft()).palette || null;
    if (cur !== pal) { await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.click(`.palette-card[data-id=${pal || cur}] [data-act=use-palette]`); }
    assert.equal((await draft()).palette || null, pal || null);
    await pg.goto('http://127.0.0.1:8080/index.html#pantalla'); await pg.waitForSelector('#phoneContent .component-host');
  }
  for (const pal of [null, 'tinta', 'noche', 'neon', 'lujo']) {
    const bad = [];
    for (const t of TT.LIST) { await setup(t.id, pal); for (const s of await pg.$$eval('#screenTabs button', bs => bs.map(x => x.dataset.id))) { await pg.click(`#screenTabs [data-id=${s}]`); await pg.waitForTimeout(80); (await pg.evaluate(CHECK)).forEach(x => bad.push(t.id + '/' + s + ' ' + x)); } }
    ok(bad.length === 0, `${pal || 'sin paleta'}: todos los textos de las 8 plantillas × todas sus pantallas llegan a AA · ${bad.slice(0, 4).join(' | ')}`);
  }
  // Con paleta oscura: pantalla oscura, biblioteca sin oscurecer, exportación oscura y con las correcciones.
  await setup('tpl-cafeteria', 'noche');
  ok(await pg.evaluate(() => getComputedStyle(document.querySelector('.phone-screen')).backgroundColor === 'rgb(15, 18, 32)'), 'la pantalla toma el fondo de la paleta oscura');
  ok(await pg.evaluate(() => { const h = document.querySelector('#phoneContent .component-host').shadowRoot; return /color-scheme:dark/.test(h.querySelector('style').textContent); }), 'los bloques de la pantalla pasan a modo noche');
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.waitForSelector('.gallery-item[data-id=c-coffee] .component-host');
  ok(await pg.evaluate(() => !/color-scheme:dark/.test(document.querySelector('.gallery-item[data-id=c-coffee] .component-host').shadowRoot.querySelector('style').textContent)), 'la biblioteca sigue clara con una paleta oscura');
  await pg.goto('http://127.0.0.1:8080/index.html#pantalla'); await pg.waitForSelector('#phoneContent .component-host');
  await pg.click('#composeButton'); const dl = pg.waitForEvent('download'); await pg.click('[data-act=export]'); const file = path.join(os.tmpdir(), 'osc-' + Date.now() + '.html'); await (await dl).saveAs(file); const html = fs.readFileSync(file, 'utf8');
  ok(/color-scheme:dark/.test(html) && /#0f1220/i.test(html), 'la exportación sale en modo noche');
  const ex = await (await b.newPage({ viewport: { width: 390, height: 900 } })); await ex.emulateMedia({ reducedMotion: 'reduce' }); await ex.goto('file://' + file); await ex.waitForTimeout(300);
  const exBad = await ex.evaluate(CHECK, 'estilos-block');
  ok(await ex.evaluate(() => document.querySelectorAll('estilos-block').length > 3) && exBad.length === 0, 'en la exportación todos los textos llegan a AA · ' + exBad.slice(0, 3).join(' | '));
  ok(!errors.length, 'sin errores de página: ' + errors.join(' | '));
  await b.close(); console.log(`${n} comprobaciones de paletas oscuras y contraste correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
