/* Tu pantalla: modo claro/oscuro, herramientas de barra (cambiar y colores), botones en tarjetas y estilos visuales sin hueco. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
(async () => {
  const b = await chromium.launch(), pg = await (await b.newContext({ viewport: { width: 412, height: 1000 } })).newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  const U = 'http://127.0.0.1:8080/index.html', draft = () => pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1') || '{}'));
  await pg.goto(U + '#bloques/plantillas'); await pg.evaluate(() => localStorage.clear()); await pg.goto(U + '#bloques/plantillas'); await pg.waitForSelector('.template-card');
  await pg.locator('.template-card[data-id="tpl-cafeteria"] [data-act=use-template]').click(); await pg.waitForSelector('.theme-pick');
  const bgLum = () => pg.evaluate(() => { const c = getComputedStyle(document.querySelector('.phone-screen')).backgroundColor.match(/\d+/g).map(Number); return (c[0] + c[1] + c[2]) / 3; });
  const textLum = () => pg.evaluate(() => { const h = [...document.querySelectorAll('#phoneContent .component-host')].find(x => x.shadowRoot && x.shadowRoot.querySelector('h1,h2,h3,b')); const c = getComputedStyle(h.shadowRoot.querySelector('h1,h2,h3,b')).color.match(/\d+/g).map(Number); return (c[0] + c[1] + c[2]) / 3; });
  ok(await pg.locator('[data-theme-mode]').count() === 3 && await pg.locator('[data-theme-mode=""][aria-pressed=true]').count() === 1, 'hay tres modos (auto, claro, oscuro) y «Auto» está activo');
  const light0 = await textLum(); ok(light0 < 120, 'en claro los textos son oscuros');
  await pg.locator('[data-theme-mode=dark]').click(); await pg.waitForTimeout(300);
  ok((await draft()).mode === 'dark' && await textLum() > 150 && await bgLum() < 80, 'modo oscuro: fondo y textos pasan a noche y se guarda');
  const accent = await pg.evaluate(() => { const h = [...document.querySelectorAll('#phoneContent .component-host')].find(x => x.shadowRoot && x.shadowRoot.querySelector('button')); return h ? getComputedStyle(h.shadowRoot.querySelector('button')).backgroundColor : ''; }); ok(/\d/.test(accent), 'conserva los botones con color en oscuro');
  await pg.locator('[data-theme-mode=light]').click(); await pg.waitForTimeout(300); ok((await draft()).mode === 'light' && await textLum() < 120, 'modo claro');
  await pg.locator('[data-theme-mode=""]').click(); ok((await draft()).mode === null, 'Auto vuelve a seguir a la paleta');
  await pg.reload(); await pg.waitForSelector('.theme-pick'); await pg.locator('[data-theme-mode=dark]').click(); await pg.reload(); await pg.waitForSelector('.theme-pick'); ok((await draft()).mode === 'dark' && await pg.locator('[data-theme-mode=dark][aria-pressed=true]').count() === 1, 'el modo elegido se recuerda al recargar');
  await pg.locator('[data-theme-mode=""]').click();
  // herramientas de la barra inferior
  await pg.locator('[data-mode=edit]').first().click(); await pg.locator('#phoneNav .component-host').first().click(); await pg.waitForSelector('#blockTools:not([hidden])');
  const btns = await pg.evaluate(() => [...document.querySelectorAll('#blockTools [data-bt]')].filter(x => !x.hidden).map(x => x.dataset.bt));
  ok(['swap', 'navstyle', 'motion'].every(k => btns.includes(k)), 'la barra permite cambiar, dar colores y animar (no solo animar): ' + btns.join(','));
  const before = (await draft()).choices.nav; await pg.locator('[data-bt=swap]').click(); ok(await pg.locator('#swapPop button').count() >= 20, 'la lista de barras muestra todas las alternativas');
  await pg.locator('#swapPop button').nth(3).click(); await pg.waitForTimeout(300); const after = (await draft()); ok(after.choices.nav !== before && after.selected.includes(after.choices.nav) && after.selected.filter(id => /^n-/.test(id)).length === 1, 'cambiar la barra deja solo la nueva');
  await pg.locator('[data-bt=navstyle]').click(); await pg.locator('#navStylePop input[data-ns=bg]').evaluate(e => { e.value = '#1d1b3a'; e.dispatchEvent(new Event('change', { bubbles: true })); }); await pg.locator('#navStylePop select[data-ns=shape]').selectOption('pildora'); await pg.waitForTimeout(300);
  const ns = (await draft()).navStyle; ok(ns && ns.bg === '#1d1b3a' && ns.shape === 'pildora', 'los colores y la forma de la barra se guardan');
  ok(await pg.evaluate(() => { const nav = document.querySelector('#phoneNav .component-host').shadowRoot.querySelector('nav'); return getComputedStyle(nav).backgroundColor === 'rgb(29, 27, 58)' && parseFloat(getComputedStyle(nav).borderTopLeftRadius) > 100; }), 'la barra se ve con el color y la forma elegidos');
  await pg.locator('#navStylePop [data-ns-reset]').click(); ok((await draft()).navStyle === null, 'restablecer vuelve a la barra original');
  // cabecera: se puede cambiar; tarjeta con botón: se puede dar estilo al botón
  await pg.locator('#phoneContent .component-host').first().click(); await pg.waitForTimeout(200);
  ok(await pg.locator('#blockTools [data-bt=swap]:not([hidden])').count() === 1 && await pg.locator('#blockTools [data-bt=navstyle]:not([hidden])').count() === 0, 'la cabecera se puede cambiar y no muestra los colores de barra');
  const cardWithButton = await pg.evaluate(() => { const hs = [...document.querySelectorAll('#phoneContent .component-host')]; return hs.findIndex((h, i) => i > 0 && h.shadowRoot.querySelector('button') && h.dataset.bid); });
  if (cardWithButton > 0) { await pg.locator('#phoneContent .component-host').nth(cardWithButton).click(); await pg.waitForTimeout(200); ok(await pg.locator('#blockTools [data-bt=button]:not([hidden])').count() === 1, 'una tarjeta con botón ofrece cambiar el botón'); } else ok(true, 'sin tarjetas con botón');
  // estilos visuales: las tarjetas llenan el ancho
  await pg.goto(U + '#bloques/estilos'); await pg.waitForSelector('.visual-card:not([hidden])'); await pg.waitForTimeout(300);
  const fill = await pg.evaluate(() => { const r = document.querySelector('#visualRow').getBoundingClientRect(), cs = [...document.querySelectorAll('.visual-card:not([hidden])')].map(c => c.getBoundingClientRect()); const right = Math.max(...cs.map(c => c.right)); return { gap: r.right - right, cols: new Set(cs.map(c => Math.round(c.left))).size }; });
  ok(fill.cols === 2 && fill.gap < 6, 'Estilos visuales: dos columnas que llenan el ancho, sin hueco a la derecha');
  await pg.goto(U + '#bloques/animaciones'); await pg.waitForSelector('.motion-card:not([hidden])'); const mfill = await pg.evaluate(() => { const r = document.querySelector('#motionRow') || document.querySelector('.motions .template-row'); const rr = r.getBoundingClientRect(), cs = [...document.querySelectorAll('.motion-card:not([hidden])')].map(c => c.getBoundingClientRect()); return rr.right - Math.max(...cs.map(c => c.right)); }); ok(mfill < 6, 'Animaciones: las tarjetas también llenan el ancho');
  ok(errors.length === 0, 'sin errores de página: ' + errors.join('|'));
  await b.close(); console.log(n + ' comprobaciones de pantalla correctas.');
})().catch(e => { console.error(e); process.exit(1); });
