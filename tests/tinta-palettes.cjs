/* Paletas de color: datos legibles, capa sobre fondo/tarjetas/botones, estilos propios primero, exportación e historial. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const P = require('../web/js/tinta-palettes.js'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
ok(P.LIST.length === 48 && new Set(P.LIST.map(p => p.id)).size === 48 && P.LIST.every(P.valid), 'hay 48 paletas con id único y colores hex válidos');
ok(P.LIST.every(p => P.contrast(p.ink, p.surface) >= 7 && P.contrast(p.ink, p.bg) >= 7), 'el texto se lee con contraste AAA sobre tarjetas y fondo');
ok(P.LIST.every(p => P.contrast(p.accent, P.onAccent(p.accent)) >= 4.5), 'el texto de los botones cumple AA sobre el acento');
ok(P.LIST.every(p => P.contrast(p.accent, p.bg) >= 1.5 && p.accent !== p.accent2), 'el acento se distingue del fondo');
ok(P.normalize('oceano') === 'oceano' && P.normalize('nada') === null && P.normalize({}) === null && P.normalize('<x>') === null, 'normalize solo acepta ids conocidos');
ok(P.onAccent('#ffffff') === '#111111' && P.onAccent('#000000') === '#ffffff', 'onAccent elige blanco o negro según el fondo');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  const draft = () => pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1')));
  await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.palette-card');
  ok(await pg.locator('.palette-card').count() === 48 && await pg.locator('.palette-strip i').count() === 240, 'la biblioteca muestra 48 paletas con sus 5 franjas');
  await pg.click('.template-card[data-id=tpl-cafeteria] [data-act=use-template]'); await pg.waitForSelector('#review', { state: 'visible' });
  const base = await pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.innerHTML).join('|'));
  await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.palette-card');
  await pg.click('.palette-card[data-id=oceano] [data-act=use-palette]');
  ok((await draft()).palette === 'oceano' && await pg.locator('.palette-card[data-id=oceano] button').getAttribute('aria-pressed') === 'true', 'se guarda la paleta y el botón indica «En uso»');
  await pg.goto('http://127.0.0.1:8080/index.html#pantalla'); await pg.waitForSelector('#phoneContent .component-host');
  ok(await pg.evaluate(() => getComputedStyle(document.querySelector('.phone-screen')).backgroundColor) === 'rgb(234, 243, 246)', 'el fondo de la pantalla toma el color de la paleta');
  const styled = await pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.innerHTML).join('|'));
  ok(styled !== base && /tinta-card-surface/.test(styled) && /tinta-styled-button/.test(styled), 'tarjetas y botones reciben la capa de paleta');
  ok(/rgb\(14, 116, 144\)/.test(styled), 'el botón usa el acento de la paleta');
  ok(/Paleta: Océano/.test(await pg.locator('#paletteSummary').textContent()), 'el resumen indica la paleta activa');
  // Un estilo propio de tarjeta manda sobre la paleta.
  const cardId = await pg.evaluate(() => document.querySelector('select[data-repeat]').dataset.repeat);
  const own = await pg.evaluate(() => ({ ...TintaCardStyle.defaults({ color: '#f7f5ec' }), format: 'solid', background: '#123456', textMode: 'original' }));
  { const d = await draft(); d.cardStyles = { [cardId]: own }; await pg.evaluate(x => localStorage.setItem('estilos-tinta-prototype-v1', JSON.stringify(x)), d); await pg.reload(); await pg.waitForSelector('#phoneContent .component-host');
    ok(await pg.evaluate(() => /rgb\(18, 52, 86\)/.test([...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.innerHTML).join('|'))), 'el estilo propio de la tarjeta manda sobre la paleta'); }
  await pg.click('#composeButton'); const dl = pg.waitForEvent('download'); await pg.click('[data-act=export]'); const file = path.join(os.tmpdir(), 'pal-' + Date.now() + '.html'); await (await dl).saveAs(file); const html = fs.readFileSync(file, 'utf8'); fs.unlinkSync(file);
  ok(html.includes('background:#eaf3f6') && html.includes('#eaf3f6 30%'), 'la exportación usa el fondo de la paleta');
  await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.palette-card');
  await pg.click('.palette-card[data-id=rosa] [data-act=use-palette]'); ok((await draft()).palette === 'rosa' && await pg.locator('.palette-card[data-id=oceano] button').getAttribute('aria-pressed') === 'false', 'elegir otra paleta sustituye a la anterior');
  await pg.keyboard.press('Control+z'); ok((await draft()).palette === 'oceano' && await pg.locator('.palette-card[data-id=oceano] button').getAttribute('aria-pressed') === 'true', 'Ctrl+Z vuelve a la paleta anterior y la biblioteca lo refleja');
  await pg.click('.palette-card[data-id=oceano] [data-act=use-palette]'); ok((await draft()).palette === null, 'volver a pulsar la quita');
  await pg.click('.palette-card[data-id=bosque] [data-act=use-palette]'); const senderDraft = await draft();
  await pg.goto('http://127.0.0.1:8080/index.html#pantalla'); await pg.waitForSelector('#phoneContent .component-host'); await pg.click('[data-act=share-link]'); const link = await pg.inputValue('#shareLink');
  const rx = await ctx.newPage(); await rx.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', '1'); localStorage.clear(); } }); await rx.goto(link); await rx.waitForSelector('#projectsDialog[open]'); await rx.waitForTimeout(300);
  ok(await rx.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-projects-v1'))[0].draft.palette) === 'bosque' && senderDraft.palette === 'bosque', 'el enlace compartido conserva la paleta');
  const bad = await b.newContext({ viewport: { width: 1280, height: 900 } }), bp = await bad.newPage(); await bp.addInitScript(d => localStorage.setItem('estilos-tinta-prototype-v1', d), JSON.stringify({ ...senderDraft, palette: '<img src=x onerror=1>' }));
  await bp.goto('http://127.0.0.1:8080/index.html#pantalla'); await bp.waitForSelector('#phoneContent .component-host'); ok(await bp.evaluate(() => getComputedStyle(document.querySelector('.phone-screen')).backgroundColor) === 'rgb(245, 244, 239)', 'una paleta inválida en el borrador se ignora');
  const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto('http://127.0.0.1:8080/index.html#bloques'); await m.waitForSelector('.palette-card');
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desbordamiento en móvil');
  ok(errors.length === 0, 'sin excepciones: ' + errors.join('|')); await b.close(); console.log(`${n} comprobaciones de paletas correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
