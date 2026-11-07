/* Identidad visual única: el Editor y la biblioteca clásica usan la piel de Tinta. */
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
    ok(await p.evaluate(() => document.documentElement.dataset.theme) === 'light', 'tema claro por defecto en instalaciones nuevas');
    ok(await p.locator('.workspace-avatar img').evaluate(el => el.complete && el.naturalWidth === 384), 'avatar propio de Luma cargado');
    ok((await p.textContent('.agent-companion')).includes('Hola, soy Luma.'), 'identidad del agente en el editor');
    ok(await p.locator('.agent-companion img').getAttribute('alt') === 'Avatar de Luma', 'avatar tiene descripción accesible');
    ok(await p.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(243, 241, 237)', 'fondo de papel de Tinta (#f3f1ed), sin vidrio lavanda');
    ok(await p.evaluate(() => getComputedStyle(document.body).fontFamily.includes('Jakarta')), 'misma tipografía que Tinta');
    ok(await p.locator('.tinta-wordmark').isVisible() && await p.locator('.tinta-wordmark').getAttribute('href') === 'index.html', 'marca «estilos®» de Tinta que vuelve a la entrada');
    ok(!(await p.evaluate(() => [...document.styleSheets].some(s => /lavender/.test(s.href || '')))), 'ya no se carga la hoja lavanda');
    ok((await p.textContent('#readout')).includes('recetas locales'), 'no se presenta el motor local como un modelo de IA');
    for (const width of [320,390,768,1200,1440]) { await p.setViewportSize({width,height:1000}); ok(await p.evaluate(() => document.documentElement.scrollWidth === innerWidth), 'sin desbordamiento a '+width+' px'); }
    await p.click('#btnTheme');
    ok(await p.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'modo oscuro con la paleta oscura de Tinta');
    await p.reload();
    ok(await p.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'se respeta la preferencia de tema guardada');
    await p.goto('http://127.0.0.1:' + server.address().port + '/biblioteca.html?clasica=1');
    ok(await p.locator('.studio-welcome img').evaluate(el => el.complete && el.naturalWidth > 0), 'Luma visible también en biblioteca');
    ok((await p.textContent('.welcome-action')).includes('Diseñar con Luma'), 'entrada al editor con identidad del agente');
    ok(await p.locator('.studio-welcome').evaluate(el => getComputedStyle(el).backgroundColor === 'rgb(36, 36, 34)'), 'cabecera en tinta oscura como Tinta');
    ok(await p.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'misma preferencia visual en ambas páginas');
    ok(errors.length === 0, 'sin excepciones de navegador');
    console.log(pass + ' correctas, 0 fallidas');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
