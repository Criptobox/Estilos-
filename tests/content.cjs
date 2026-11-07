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
    await p.click('.blk[data-slot=header] [data-act=editcontent]');
    ok(await p.isVisible('#mContent'), 'abre el editor en móvil');
    ok(await p.locator('#contentFields textarea').count() > 0, 'detecta campos de texto');
    const id = await p.evaluate(() => S.blocks.header);
    const first = p.locator('#contentFields textarea').first();
    const original = await first.inputValue();
    await first.fill('Mi tienda personalizada');
    ok(await p.evaluate(id => partsFor(styled(id)).html.includes('Mi tienda personalizada'), id), 'actualiza el bloque');
    ok(await p.locator('#scroll').evaluate(el => [...el.querySelectorAll('*')].some(n => n.shadowRoot && n.shadowRoot.textContent.includes('Mi tienda personalizada'))), 'actualiza el lienzo en vivo');
    ok(await p.evaluate(() => exportHTML().includes('Mi tienda personalizada')), 'exporta el contenido');
    await first.fill('<img src=x onerror="window.attack=1"> & texto');
    ok(await p.evaluate(id => !partsFor(styled(id)).html.includes('<img src=x'), id), 'escapa etiquetas HTML');
    ok(await p.evaluate(() => exportHTML().includes('&lt;img')), 'exportación segura');
    ok(await p.evaluate(() => !window.attack), 'no ejecuta código inyectado');
    await first.fill('Mi tienda personalizada');
    await p.click('[data-act=donecontent]');
    ok(!(await p.isVisible('#mContent')), 'Listo cierra el editor');
    await p.reload();
    ok(await p.evaluate(id => partsFor(styled(id)).html.includes('Mi tienda personalizada'), id), 'conserva los cambios al recargar');
    await p.click('.blk[data-slot=header] [data-act=editcontent]');
    ok(await p.locator('#contentFields textarea').first().inputValue() === 'Mi tienda personalizada', 'reabre con el valor guardado');
    await p.locator('#contentFields textarea').first().fill('');
    ok(await p.evaluate(id => S.content[id][0] === '', id), 'permite vaciar un texto');
    await p.click('[data-act=resetcontent]');
    ok(await p.locator('#contentFields textarea').first().inputValue() === original, 'restaura los originales');
    ok(await p.evaluate(id => !S.content[id], id), 'borra las sustituciones al restaurar');
    await p.keyboard.press('Escape');
    ok(!(await p.isVisible('#mContent')), 'Escape cierra el editor');
    const coverage = await p.evaluate(() => Object.values(ENTRY).every(e => {
      const parsed = contentFields(designParts(styled(e.id)).html);
      parsed.fields.forEach(f => f.set('<script>alert(1)</script>'));
      return !parsed.root.content.querySelector('script');
    }));
    ok(coverage, 'todos los diseños admiten sustituciones sin inyectar HTML');
    ok(await p.evaluate(() => document.documentElement.scrollWidth === innerWidth), 'sin desbordamiento horizontal en móvil');
    ok(errors.length === 0, 'sin excepciones de navegador');
    console.log(pass + ' correctas, 0 fallidas');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
