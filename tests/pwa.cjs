/* Instalación como PWA: manifest, iconos, service worker, botón de Tinta, iOS y modo sin conexión. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; }; const web = path.join(__dirname, '../web');
const man = JSON.parse(fs.readFileSync(path.join(web, 'manifest.webmanifest'), 'utf8'));
ok(man.id && man.name && man.short_name && man.start_url && man.display === 'standalone' && man.scope, 'manifest con id, nombre, inicio, ámbito y standalone');
ok(man.icons.some(i => i.sizes === '192x192') && man.icons.some(i => i.sizes === '512x512' && (i.purpose || 'any') === 'any') && man.icons.some(i => i.purpose === 'maskable'), 'iconos 192, 512 y maskable');
ok(man.icons.concat(man.screenshots).every(i => fs.existsSync(path.join(web, i.src))), 'iconos y capturas existen');
ok(man.screenshots.some(s => s.form_factor === 'wide') && man.screenshots.some(s => s.form_factor === 'narrow'), 'capturas para móvil y escritorio');
const html = fs.readFileSync(path.join(web, 'index.html'), 'utf8');
ok(/rel="apple-touch-icon"/.test(html) && /apple-mobile-web-app-capable/.test(html) && /rel="manifest"/.test(html), 'metadatos de iOS y enlace al manifest');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 390, height: 800 } }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://localhost:8080/index.html'); await pg.waitForFunction(() => navigator.serviceWorker.controller || navigator.serviceWorker.getRegistration().then(r => r && r.active), null, { timeout: 15000 }); await pg.waitForTimeout(1500);
  const cdp = await ctx.newCDPSession(pg); await cdp.send('Page.enable');
  ok((await cdp.send('Page.getInstallabilityErrors')).installabilityErrors.length === 0, 'Chromium la considera instalable');
  ok((await cdp.send('Page.getAppManifest')).errors.length === 0, 'manifest sin errores');
  ok(await pg.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!(r && r.active); }), 'service worker activo');
  await pg.click('[data-act=menu]'); ok(await pg.locator('#installApp').isVisible(), 'botón «Instalar la app» en el menú');
  await pg.click('#installApp'); ok(await pg.locator('#installHelp').isVisible() && /Instalar app|Añadir/.test(await pg.locator('#installHelp').textContent()), 'sin aviso nativo: explica los pasos');
  await pg.evaluate(() => { window.__prompted = 0; const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = async () => { window.__prompted++; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); });
  ok(await pg.locator('#installApp').getAttribute('data-ready') === '1', 'captura el aviso nativo');
  await pg.click('#installApp'); ok(await pg.evaluate(() => window.__prompted) === 1, 'al pulsar lanza el aviso nativo del navegador');
  await pg.evaluate(() => window.dispatchEvent(new Event('appinstalled'))); ok(await pg.locator('#installApp').getAttribute('data-ready') === '0', 'tras instalar vuelve a su estado');
  await ctx.setOffline(true); await pg.reload(); ok(await pg.locator('#home').isVisible(), 'abre sin conexión');
  await ctx.setOffline(false);
  ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desbordamiento');
  ok(errors.length === 0, 'sin excepciones: ' + errors.join('|')); await b.close(); console.log(`${n} comprobaciones de instalación PWA correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
