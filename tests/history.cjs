/* Historial: cambios, grupos de escritura, teclado, orden, límite y exportación. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '../web');
let pass = 0;
function ok(v, m) { if (!v) throw Error(m); pass++; console.log('✓ ' + m); }
(async () => {
  const server = http.createServer((req, res) => {
    const file = path.join(root, req.url.split('?')[0] === '/' ? 'agente.html' : req.url.split('?')[0]);
    fs.readFile(file, (err, data) => { res.writeHead(err ? 404 : 200, { 'Content-Type': ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' })[path.extname(file)] || 'application/octet-stream' }); res.end(err ? '' : data); });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  let browser;
  try {
    browser = await chromium.launch();
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = []; p.on('pageerror', e => errors.push(e.message));
    await p.goto('http://127.0.0.1:' + server.address().port + '/agente.html');
    const undo = p.locator('.topbar [data-act=undo]'), redo = p.locator('.topbar [data-act=redo]');
    const snapshot = () => p.evaluate(() => { const stable = v => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v; return JSON.stringify(stable(S)); });
    const initial = await snapshot();
    ok(await undo.isDisabled() && await redo.isDisabled(), 'historial vacío al abrir');
    await p.click('.blk[data-slot=header] [data-act=lock]');
    const locked = await snapshot();
    ok(locked !== initial && await undo.isEnabled(), 'registra candado');
    await undo.click(); ok(await snapshot() === initial, 'deshace candado');
    await redo.click(); ok(await snapshot() === locked, 'rehace candado');
    await p.locator('body').click({position:{x:1,y:1}});
    await p.keyboard.press('Control+z'); ok(await snapshot() === initial, 'Ctrl+Z deshace');
    await p.keyboard.press('Control+Shift+z'); ok(await snapshot() === locked, 'Ctrl+Mayús+Z rehace');
    await undo.click();
    await p.click('.blk[data-slot=header] [data-act=down]');
    const reordered = await snapshot();
    ok(await redo.isDisabled(), 'nuevo cambio descarta la rama de rehacer');
    await undo.click(); ok(await snapshot() === initial, 'deshace orden');
    await redo.click(); ok(await snapshot() === reordered, 'rehace orden');
    await p.reload();
    ok(await p.evaluate(() => JSON.stringify(SLOTS.map(s => s.key))) === JSON.stringify(JSON.parse(reordered).order), 'conserva el orden al recargar');
    ok(await undo.isDisabled() && await redo.isDisabled(), 'historial limitado a la sesión');
    const radiusInitial = await p.evaluate(() => S.radius);
    await p.locator('#radius').evaluate(el => { [20,22,24].forEach(v => { el.value = v; el.dispatchEvent(new Event('input',{bubbles:true})); }); el.dispatchEvent(new Event('change',{bubbles:true})); });
    await undo.click(); ok(await p.evaluate(() => S.radius) === radiusInitial, 'agrupa movimiento del control de radio');
    await redo.click(); ok(await p.evaluate(() => S.radius) === 24, 'rehace el valor final del radio');
    await p.click('.blk[data-slot=header] [data-act=editcontent]');
    const input = p.locator('#contentFields textarea').first();
    const original = await input.inputValue();
    await input.fill('Mi marca'); await input.pressSequentially(' personalizada');
    await p.locator('#mContent [data-act=undo]').click();
    ok(await input.inputValue() === original, 'deshace la escritura como grupo dentro del editor');
    await p.locator('#mContent [data-act=redo]').click();
    ok(await input.inputValue() === 'Mi marca personalizada', 'rehace el contenido dentro del editor');
    ok(await p.evaluate(() => exportHTML().includes('Mi marca personalizada')), 'exporta el estado rehecho');
    await p.click('[data-act=donecontent]');
    const beforeSector = await snapshot();
    await p.click('.vlab[data-v=comida]');
    const afterSector = await snapshot();
    await undo.click(); ok(await snapshot() === beforeSector, 'deshace generación completa del sector en un paso');
    await redo.click(); ok(await snapshot() === afterSector, 'rehace generación sin volver a sortear');
    await p.evaluate(() => { for(let i=0;i<65;i++){ S.radius = i % 33; renderAll(); } });
    ok(await p.evaluate(() => historyStates.length <= 51), 'limita el historial a 50 cambios');
    ok(await p.evaluate(() => document.documentElement.scrollWidth === innerWidth), 'barra de historial sin desbordar móvil');
    ok(errors.length === 0, 'sin excepciones de navegador');
    console.log(pass + ' correctas, 0 fallidas');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
