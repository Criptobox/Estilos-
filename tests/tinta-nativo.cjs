/* Puente con la app de Android: si existe window.EstilosAndroid, exportar entrega el archivo a la app (con su nombre y tipo) y no intenta una descarga del navegador. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const util = fs.readFileSync(path.join(__dirname, '../web/js/util.js'), 'utf8');
ok(/function nativeSave\(blob, name\)/.test(util) && /EstilosAndroid/.test(util), 'util.js trae el ayudante nativeSave');
for (const f of ['crear.js', 'agente.js', 'export.js', 'project-backup.js']) ok(/nativeSave\(/.test(fs.readFileSync(path.join(__dirname, '../web/js/' + f), 'utf8')), f + ' entrega las descargas a la app cuando existe el puente');
const kt = fs.readFileSync(path.join(__dirname, '../app/src/main/java/com/estilos/app/MainActivity.kt'), 'utf8');
ok(/@JavascriptInterface/.test(kt) && /ACTION_CREATE_DOCUMENT/.test(kt) && /onShowFileChooser/.test(kt) && /allowFileAccess = false/.test(kt) && /"EstilosAndroid"/.test(kt), 'MainActivity expone el puente, guarda con el selector del sistema, abre el selector de archivos y cierra el acceso a archivos');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 412, height: 1000 }, acceptDownloads: true }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  let downloads = 0; pg.on('download', () => downloads++);
  await pg.addInitScript(() => { window.__saved = []; window.EstilosAndroid = { saveFile: (name, mime, b64) => window.__saved.push({ name, mime, b64 }) }; });
  const U = 'http://127.0.0.1:8080/index.html';
  await pg.goto(U + '#bloques/plantillas'); await pg.evaluate(() => localStorage.clear()); await pg.goto(U + '#bloques/plantillas'); await pg.waitForSelector('.template-card');
  await pg.locator('.template-card[data-id="tpl-cafeteria"] [data-act=use-template]').click(); await pg.waitForSelector('#composeButton');
  await pg.click('#composeButton'); await pg.waitForSelector('#resultActions', { state: 'visible' }); await pg.click('[data-act=export]'); await pg.waitForFunction(() => window.__saved.length === 1, null, { timeout: 5000 });
  const s = await pg.evaluate(() => window.__saved[0]); const html = Buffer.from(s.b64, 'base64').toString('utf8');
  ok(s.name === 'mi-pantalla-estilos.html' && /^text\/html/.test(s.mime), 'el HTML se entrega a la app con su nombre y tipo');
  ok(/<estilos-block/.test(html) && /<!doctype html|<html/i.test(html), 'el contenido es el HTML completo de la pantalla');
  await pg.waitForTimeout(500); ok(downloads === 0, 'no se intenta una descarga del navegador');
  ok(errors.length === 0, 'sin errores de página: ' + errors.join('|'));
  // sin puente (navegador normal) la descarga sigue funcionando
  const pg2 = await ctx.newPage(); await pg2.addInitScript(() => { delete window.EstilosAndroid; }); let d2 = 0; pg2.on('download', () => d2++);
  await pg2.goto(U + '#bloques/plantillas'); await pg2.waitForSelector('.template-card'); await pg2.locator('.template-card[data-id="tpl-cafeteria"] [data-act=use-template]').click(); await pg2.waitForSelector('#composeButton'); await pg2.click('#composeButton'); await pg2.waitForSelector('#resultActions', { state: 'visible' });
  const dl = pg2.waitForEvent('download'); await pg2.click('[data-act=export]'); const file = await dl; ok(file.suggestedFilename() === 'mi-pantalla-estilos.html', 'sin el puente, el navegador descarga el HTML como siempre');
  await b.close(); console.log(n + ' comprobaciones del puente con Android correctas.');
})().catch(e => { console.error(e); process.exit(1); });
