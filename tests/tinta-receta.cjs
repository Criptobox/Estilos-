/* Crear con un chat de IA: prompt, pegar respuesta, validar, reparar y armar la pantalla con los bloques de Tinta. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 412, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://127.0.0.1:8080/crear.html'); await pg.waitForSelector('#openReceta');
  await pg.click('#openReceta'); await pg.waitForSelector('#recetaDialog[open]');
  await pg.fill('#recIdea', 'Una cafetería con pedidos y barra inferior'); await pg.click('[data-act=rec-copy]');
  const prompt = await pg.evaluate(() => navigator.clipboard.readText());
  ok(prompt.includes('Una cafetería con pedidos') && prompt.includes('h-search') && prompt.includes('SOLO con este JSON'), 'el prompt copiado lleva la idea, el catálogo y las reglas');
  ok(prompt.length < 9000, 'el prompt es corto (' + prompt.length + ')');
  // respuesta rota → mensajes y botón de corrección
  await pg.fill('#recAnswer', 'no sé qué decir'); await pg.click('[data-act=rec-build]');
  ok(await pg.locator('#recMsg .err').count() >= 1 && await pg.locator('#recFix').isVisible(), 'una respuesta sin JSON da un error claro y ofrece corregir');
  await pg.click('#recFix'); ok((await pg.evaluate(() => navigator.clipboard.readText())).includes('SOLO con el JSON'), 'copia el mensaje de corrección');
  // respuesta con ruido, un id inventado y sin barra: se repara
  const ans = 'Claro 😊\n```json\n' + JSON.stringify({ idea: 'Cafetería', bloques: [{ id: 'h-search' }, { id: 'c-coffee', copias: 3 }, { id: 'inventado' }, { id: 'a-coral' }], paleta: 'azul-cobalto', modo: 'claro', textos: { 'h-search': ['Buenos días', 'Tu café te espera'] } }) + '\n```';
  await pg.fill('#recAnswer', ans); await pg.click('[data-act=rec-build]');
  await pg.waitForFunction(() => !document.getElementById('recetaDialog').open); await pg.waitForSelector('#phoneContent .component-host');
  const st = await pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1')));
  ok(st.selected.join() === 'h-search,c-coffee,a-coral,n-soft', 'pantalla armada y barra inferior añadida: ' + st.selected.join());
  ok(st.repeat['c-coffee'] === 3, 'copias aplicadas'); ok(st.palette === 'azul-cobalto', 'paleta aplicada');
  ok((st.content['h-search'] || []).includes('Buenos días'), 'texto del chat aplicado');
  ok(st.brief.includes('cafetería') || st.brief.includes('Cafetería'), 'la idea del usuario se conserva');
  ok(await pg.locator('#phoneContent .component-host').count() >= 4, 'la pantalla se ve con sus bloques');
  await pg.keyboard.press('Control+z'); await pg.waitForTimeout(300);
  ok(!(await pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1')).selected)).includes('c-coffee'), 'se puede deshacer');
  ok(errors.length === 0, 'sin errores de página: ' + errors.join('|'));
  await b.close(); console.log(n + ' comprobaciones de receta con IA correctas.');
})().catch(e => { console.error(e); process.exit(1); });
