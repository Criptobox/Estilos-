/* Paleta desde una foto o un logo: se sube una imagen, se previsualiza, se guarda, se usa, persiste al recargar y se elimina. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
(async () => {
  const b = await chromium.launch(), pg = await (await b.newContext({ viewport: { width: 412, height: 1000 } })).newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://127.0.0.1:8080/crear.html#bloques/paletas'); await pg.waitForSelector('#paletteRow .palette-card');
  const png = await pg.evaluate(() => { const c = document.createElement('canvas'); c.width = 200; c.height = 200; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 200, 200); g.fillStyle = '#1b7f4c'; g.beginPath(); g.arc(100, 100, 70, 0, 7); g.fill(); return c.toDataURL('image/png').split(',')[1]; });
  const file = path.join(os.tmpdir(), 'tinta-logo-verde.png'); fs.writeFileSync(file, Buffer.from(png, 'base64'));
  const antes = await pg.locator('#paletteRow .palette-card').count();
  await pg.setInputFiles('#paletteImgFile', file); await pg.waitForSelector('#paletteImgDialog[open]');
  ok(await pg.locator('#palImgSwatches i').count() >= 2, 'muestra los colores encontrados');
  const acc = await pg.evaluate(() => TintaColores.paletteFrom(document.createElement('canvas').getContext('2d').createImageData(1, 1).data.fill(255)).palette.accent);
  ok(/^#/.test(acc), 'el módulo de colores está disponible');
  await pg.click('[data-pal-mode=oscuro]'); ok(await pg.locator('[data-pal-mode=oscuro]').getAttribute('aria-pressed') === 'true', 'cambia a modo oscuro');
  await pg.fill('#palImgName', 'Verde marca'); await pg.click('[data-act=save-palette-img]');
  await pg.waitForFunction(() => !document.getElementById('paletteImgDialog').open);
  ok(await pg.locator('#paletteRow .palette-card').count() === antes + 1, 'aparece la tarjeta nueva');
  ok(await pg.locator('.palette-card[data-id^=mia-]').innerText().then(t => t.includes('Verde marca')), 'con su nombre');
  const st = await pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1')).palette); ok(/^mia-/.test(st), 'queda aplicada en el borrador');
  await pg.reload(); await pg.waitForSelector('.palette-card[data-id^=mia-]');
  ok(await pg.evaluate(() => /^mia-/.test(JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1')).palette)), 'sobrevive a recargar');
  ok(await pg.locator('#paletteSummary').innerText().then(t => t.includes('Verde marca')), 'sigue en uso');
  await pg.click('.palette-card[data-id^=mia-] [data-act=delete-palette]');
  ok(await pg.locator('.palette-card[data-id^=mia-]').count() === 0, 'se elimina');
  ok(await pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1')).palette == null), 'y se quita del borrador');
  // archivo no válido
  fs.writeFileSync(path.join(os.tmpdir(), 'x.png'), 'no soy una imagen'); await pg.setInputFiles('#paletteImgFile', path.join(os.tmpdir(), 'x.png')); await pg.waitForTimeout(500);
  ok(!(await pg.evaluate(() => document.getElementById('paletteImgDialog').open)), 'una imagen rota no abre el diálogo');
  ok(errors.length === 0, 'sin errores de página: ' + errors.join('|'));
  await b.close(); console.log(n + ' comprobaciones de paleta desde imagen correctas.');
})().catch(e => { console.error(e); process.exit(1); });
