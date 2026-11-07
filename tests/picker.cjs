/* Editor de contenido: vista previa, persistencia, aislamiento, exportación y XSS. */
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
    const before = await p.evaluate(() => JSON.stringify(S));
    await p.click('.blk[data-slot=cards] [data-act=change]');
    ok(await p.isVisible('#mPicker'), 'abre selector con comparación');
    const total = await p.locator('#pickerGrid .pick').count();
    ok(total > 1, 'muestra diseños del rol elegido');
    const current = await p.evaluate(() => S.blocks.cards);
    const candidate = await p.locator('#pickerGrid .pick').evaluateAll((els,id) => els.find(e => e.dataset.pick !== id).dataset.pick, current);
    await p.locator('[data-pick="' + candidate + '"]').click();
    ok(await p.evaluate(() => JSON.stringify(S)) === before, 'comparar no modifica el proyecto');
    ok(await p.locator('#pickerCurrent .pv').count() === 1 && await p.locator('#pickerCandidate .pv').count() === 1, 'renderiza actual y propuesta');
    ok(await p.locator('#pickerApply').isEnabled(), 'habilita aplicación explícita');
    await p.click('[data-act=pickerclose]');
    ok(await p.evaluate(() => JSON.stringify(S)) === before, 'cancelar conserva el estado');
    await p.click('.blk[data-slot=cards] [data-act=change]');
    await p.selectOption('#pickerMode', 'dark');
    const dark = await p.evaluate(() => SEED.filter(e => e.tab === 'Tarjetas' && e.mode === 'dark').length);
    ok(await p.locator('#pickerGrid .pick').count() === dark, 'filtra por tema original oscuro');
    await p.fill('#pickerSearch', 'zzxxq');
    ok(await p.locator('#pickerGrid .pick').count() === 0 && (await p.textContent('#pickerGrid')).includes('Sin resultados'), 'informa búsqueda vacía');
    await p.click('[data-act=pickerreset]');
    ok(await p.locator('#pickerGrid .pick').count() === total, 'restablece todos los filtros');
    await p.selectOption('#pickerSort', 'current');
    ok(await p.locator('#pickerGrid .pick').first().getAttribute('data-pick') === current, 'ordena actual primero');
    await p.selectOption('#pickerSort', 'name');
    const expected = await p.evaluate(() => SEED.filter(e => e.tab === 'Tarjetas').sort((a,b) => a.name.localeCompare(b.name,'es'))[0].id);
    ok(await p.locator('#pickerGrid .pick').first().getAttribute('data-pick') === expected, 'ordena por nombre');
    await p.locator('[data-pick="' + candidate + '"]').click();
    await p.click('#pickerApply');
    ok(await p.evaluate(() => S.blocks.cards) === candidate, 'aplica la propuesta');
    ok(!(await p.isVisible('#mPicker')), 'cierra tras aplicar');
    await p.locator('.topbar [data-act=undo]').click();
    ok(await p.evaluate(() => S.blocks.cards) === current, 'deshace la aplicación');
    await p.locator('.topbar [data-act=redo]').click();
    ok(await p.evaluate(() => S.blocks.cards) === candidate, 'rehace la aplicación');
    await p.click('.blk[data-slot=cards] [data-act=change]');
    ok(await p.locator('#pickerApply').isDisabled(), 'no vuelve a aplicar el diseño actual');
    await p.keyboard.press('Escape');
    ok(!(await p.isVisible('#mPicker')), 'Escape cancela');
    ok(await p.evaluate(() => document.activeElement.dataset.act === 'change'), 'devuelve el foco al bloque');
    ok(await p.evaluate(() => document.documentElement.scrollWidth === innerWidth), 'sin desbordamiento en móvil');
    ok(errors.length === 0, 'sin excepciones');
    console.log(pass + ' correctas, 0 fallidas');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
