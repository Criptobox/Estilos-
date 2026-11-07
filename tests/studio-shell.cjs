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
    await p.setViewportSize({width:1440,height:1000});
    ok(await p.isVisible('.studio-nav'), 'navegación lateral en escritorio');
    await p.click('.blk[data-slot=header] .meta');
    ok(await p.isVisible('#mContent'), 'seleccionar capa abre propiedades');
    ok(await p.locator('#mContent .sheet').getAttribute('role') === 'complementary', 'inspector no modal en escritorio');
    const bounds = await p.evaluate(() => { const c=document.querySelector('.canvas').getBoundingClientRect(),i=document.getElementById('mContent').getBoundingClientRect();return {right:c.right,left:i.left,y:i.y}; });
    ok(bounds.right <= bounds.left+1 && bounds.y < 100, 'inspector al lado del lienzo, sin superposición');
    const beforeCanvas = await p.locator('.canvas').boundingBox();
    await p.locator('#contentFields textarea').first().fill('Mi pantalla Studio');
    const afterCanvas = await p.locator('.canvas').boundingBox();
    ok(beforeCanvas.width === afterCanvas.width, 'editar no mueve el lienzo');
    await p.click('#btnTheme');
    await p.keyboard.press('Control+z');
    ok(!(await p.locator('#contentFields textarea').first().inputValue()).includes('Mi pantalla Studio'), 'atajo deshacer disponible con inspector abierto');
    await p.click('[data-studio-nav=closeinspector]');
    ok(await p.isVisible('#inspectorEmpty'), 'estado vacío orienta al cerrar propiedades');
    await p.locator('#scroll [data-slot=cards]').click({position:{x:5,y:5}});
    ok(await p.evaluate(() => contentSlot) === 'cards', 'selección directa en lienzo');
    await p.click('[data-studio-nav=closeinspector]');
    const order = await p.evaluate(() => SLOTS.map(s=>s.key).join(','));
    await p.locator('.blk[data-slot=header] .thumb').dragTo(p.locator('.blk[data-slot=search]'));
    ok(await p.evaluate(() => SLOTS.map(s=>s.key).join(',')) !== order, 'arrastra bloques para reordenarlos');
    await p.locator('.topbar [data-act=undo]').click();
    ok(await p.evaluate(() => SLOTS.map(s=>s.key).join(',')) === order, 'deshace arrastre');
    await p.click('[data-studio-nav=add]');
    await p.selectOption('#pickerSlotChoice','search');
    ok(await p.evaluate(() => pickerSlot) === 'search', 'selector permite elegir el rol de bloque');
    await p.keyboard.press('Escape');
    for(const width of [390,768,1024,1200,1440]){
      await p.setViewportSize({width,height:1000});
      ok(await p.evaluate(() => document.documentElement.scrollWidth === innerWidth), 'sin desbordamiento a '+width+' px');
    }
    await p.setViewportSize({width:390,height:844});
    await p.click('.blk[data-slot=header] .meta');
    ok(await p.locator('#mContent .sheet').getAttribute('role') === 'dialog', 'propiedades como diálogo en móvil');
    await p.waitForTimeout(250);
    const mobileBox=await p.locator('#mContent .sheet').boundingBox();
    ok(mobileBox.y > 0 && Math.abs(mobileBox.y+mobileBox.height-844)<2, 'panel móvil anclado abajo');
    await p.keyboard.press('Escape');
    await p.goto('http://127.0.0.1:' + server.address().port + '/biblioteca.html?clasica=1');
    await p.setViewportSize({width:1440,height:1000});
    await p.waitForTimeout(300);
    ok(await p.isVisible('.nav-projects'), 'acceso a proyectos desde biblioteca');
    const frameHeights=await p.locator('.mini .stage').evaluateAll(els=>els.map(el=>el.offsetHeight));
    ok(new Set(frameHeights).size===1, 'miniaturas con marcos de altura consistente');
    ok(await p.locator('.mini .pv').first().evaluate(el=>getComputedStyle(el).position==='absolute'), 'miniaturas ajustadas para mostrar diseño completo');
    const sharedTheme=await p.evaluate(()=>document.documentElement.dataset.theme);
    await p.click('.nav-projects');
    ok(await p.isVisible('#mProjects'), 'abre proyectos desde la navegación de biblioteca');
    ok(await p.evaluate(()=>document.documentElement.dataset.theme)===sharedTheme, 'tema compartido entre biblioteca y editor');
    ok(errors.length===0, 'sin excepciones');
    console.log(pass + ' correctas, 0 fallidas');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
