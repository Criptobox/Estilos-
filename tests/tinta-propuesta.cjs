/* «Armar una pantalla completa»: la idea elige una plantilla del tema, distinta cada vez, y el envío de siempre no cambia. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
(async () => {
  const b = await chromium.launch(), pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://127.0.0.1:8080/index.html'); await pg.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await pg.goto('http://127.0.0.1:8080/index.html');
  const draft = () => pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1') || '{}'));
    ok(await pg.locator('[data-act=full-idea]').count() === 1, 'el botón «Armar una pantalla completa» está en la idea');
  await pg.locator('[data-act=full-idea]').click(); ok(!(await draft()).selected || (await draft()).selected.length === 0, 'sin idea no arma nada');
  await pg.fill('#idea', 'Una app de cursos con agenda semanal');
  await pg.locator('[data-act=full-idea]').click(); await pg.waitForTimeout(400);
  const d1 = await draft(); ok(d1.selected.length >= 3 && d1.multi === true && d1.palette, 'arma una plantilla completa con su paleta');
  ok(d1.selected.every(id => /^(r-cu|n-cu|h-|c-|a-|n-|r-)/.test(id)), 'usa bloques de la familia del tema');
  await pg.locator('[data-act=go][data-page=home]').first().click(); await pg.waitForSelector('#idea', { state: 'visible' });
  await pg.locator('[data-act=full-idea]').click(); await pg.waitForTimeout(400);
  const d2 = await draft(); ok(d2.selected.length >= 3 && d2.selected.join() !== d1.selected.join(), 'al pulsar otra vez propone una plantilla distinta');
  // el envío de siempre sigue siendo la receta de cuatro bloques
  await pg.goto('http://127.0.0.1:8080/index.html'); await pg.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await pg.goto('http://127.0.0.1:8080/index.html');
  await pg.fill('#idea', 'Una app de cursos con agenda semanal'); await pg.locator('#briefForm [type=submit]').first().click(); await pg.waitForTimeout(400);
  const d3 = await draft(); ok(d3.selected.length === 4, 'el envío de siempre conserva la propuesta de cuatro bloques');
  ok(errors.length === 0, 'sin errores de página: ' + errors.join('|'));
  await b.close(); console.log(n + ' comprobaciones de propuesta completa correctas.');
})().catch(e => { console.error(e); process.exit(1); });
