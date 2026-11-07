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
    await p.evaluate(() => { S.brief = 'Tienda de café'; S.content[S.blocks.header] = ['Café propio']; renderAll(); });
    await p.click('#btnProjects');
    await p.fill('#projectName', 'Café propio'); await p.click('[data-act=saveproject]');
    const downloadEvent = p.waitForEvent('download'); await p.click('[data-act=exportbackup]');
    const download = await downloadEvent, backup = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    ok(backup.format === 'estilos-studio-projects' && backup.version === 1, 'exporta formato versionado');
    ok(backup.projects.length === 1 && backup.projects[0].name === 'Café propio', 'exporta proyectos guardados');
    ok(Object.values(backup.projects[0].state.content)[0][0] === 'Café propio', 'incluye textos personalizados');
    const upload = async data => { await p.locator('#backupFile').setInputFiles({name:'respaldo.json',mimeType:'application/json',buffer:Buffer.from(typeof data === 'string' ? data : JSON.stringify(data))}); await p.waitForFunction(() => document.getElementById('mProjects').getAttribute('aria-busy') !== 'true'); };
    const status = () => p.textContent('#projectStatus');
    const before = await p.evaluate(() => JSON.stringify(S));
    await upload(backup);
    ok(await p.isVisible('#backupPreview'), 'muestra vista previa antes de importar');
    ok(await p.locator('.project-row').count() === 1, 'validar no escribe proyectos');
    await p.click('[data-act=cancelimport]');
    ok(await p.locator('.project-row').count() === 1 && !(await p.isVisible('#backupPreview')), 'cancelar no importa');
    await upload(backup); await p.click('[data-act=confirmimport]');
    ok(await p.locator('.project-row').count() === 2, 'importa como copia nueva');
    ok(await p.evaluate(() => new Set(projects.map(p => p.id)).size) === 2, 'genera identificadores nuevos');
    ok(await p.evaluate(() => JSON.stringify(S)) === before, 'no altera borrador ni diseño actual');
    ok(await p.evaluate(() => projects[0].state.brief) === backup.projects[0].state.brief, 'conserva brief importado');
    const failures = [
      ['JSON roto', '{oops'],
      ['versión desconocida', {...backup,version:99}],
      ['JSON ajeno', {foo:'bar'}],
      ['lista vacía', {...backup,projects:[]}],
      ['color peligroso', {...backup,projects:[{...backup.projects[0],state:{...backup.projects[0].state,palette:{acc:'url(javascript:x)',acc2:'#123456',page:'#FFFFFF'}}}]}],
      ['bloque desconocido', {...backup,projects:[{...backup.projects[0],state:{...backup.projects[0].state,blocks:{...backup.projects[0].state.blocks,header:'unknown'}}}]}],
      ['orden inválido', {...backup,projects:[{...backup.projects[0],state:{...backup.projects[0].state,order:[]}}]}],
      ['radio fuera de rango', {...backup,projects:[{...backup.projects[0],state:{...backup.projects[0].state,radius:1000}}]}]
    ];
    for(const [label,bad] of failures){ await upload(bad); ok((await status()).includes('No se importó'), 'rechaza ' + label); }
    ok(await p.locator('.project-row').count() === 2, 'archivos inválidos no dejan importaciones parciales');
    await upload({...backup,projects:[{...backup.projects[0],name:'<img src=x onerror=alert(1)>'}]});
    ok(await p.locator('#backupNames img').count() === 0, 'vista previa escapa nombres HTML');
    await p.click('[data-act=cancelimport]');
    await p.locator('#backupFile').setInputFiles({name:'grande.json',mimeType:'application/json',buffer:Buffer.alloc(8*1024*1024+1,32)});
    ok((await status()).includes('8 MB'), 'rechaza archivos superiores a 8 MB');
    await upload(backup);
    await p.evaluate(() => { const original = Storage.prototype.setItem; window.restoreStorage = () => Storage.prototype.setItem = original; Storage.prototype.setItem = function(k,v){if(k===PROJECTS_KEY)throw Error('Quota');return original.call(this,k,v)}; });
    await p.click('[data-act=confirmimport]');
    ok((await status()).includes('No se pudo guardar') && await p.locator('.project-row').count() === 2, 'fallo de almacenamiento conserva proyectos existentes');
    await p.evaluate(() => window.restoreStorage());
    await p.click('[data-act=confirmimport]');
    ok(await p.locator('.project-row').count() === 3, 'permite reintentar tras fallo de escritura');
    ok(await p.evaluate(() => document.documentElement.scrollWidth === innerWidth), 'sin desbordamiento móvil');
    ok(errors.length === 0, 'sin excepciones');
    console.log(pass + ' correctas, 0 fallidas');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
