/* Portapapeles nativo (app Android): si existe el puente EstilosAndroid se usa en vez de navigator.clipboard, que el WebView no siempre permite. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const ANSWER = '```json\n' + JSON.stringify({ idea: 'Cafetería', bloques: [{ id: 'h-search' }, { id: 'c-coffee', copias: 2 }, { id: 'a-coral' }, { id: 'n-soft' }] }) + '\n```';
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 412, height: 1000 } }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.addInitScript(() => { window.__clip = ''; window.__calls = []; window.EstilosAndroid = { copyText: t => { window.__clip = t; window.__calls.push('copy'); return true; }, readText: () => { window.__calls.push('read'); return window.__clip; }, saveFile: () => {} }; window.open = () => null; });
  await pg.goto('http://127.0.0.1:8080/crear.html'); await pg.waitForSelector('#openReceta'); await pg.click('#openReceta'); await pg.waitForSelector('#recetaDialog[open]');
  await pg.fill('#recIdea', 'Una cafetería con pedidos'); await pg.click('[data-chat=gemini]');
  await pg.waitForFunction(() => window.__calls.includes('copy'));
  ok(/Una cafetería con pedidos/.test(await pg.evaluate(() => window.__clip)), 'el prompt se copia por el puente nativo');
  ok(/Prompt copiado/.test(await pg.innerText('#recCopyNote')) && await pg.locator('#recPrompt').isHidden(), 'sin el aviso de «copia a mano»');
  await pg.evaluate(a => { window.__clip = a; }, ANSWER); await pg.click('#recPaste');
  await pg.waitForFunction(() => !document.getElementById('recetaDialog').open, null, { timeout: 10000 }); await pg.waitForSelector('#phoneContent .component-host');
  ok((await pg.evaluate(() => window.__calls)).includes('read'), 'la respuesta se lee por el puente nativo');
  const st = await pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1'))); ok(st.selected.join() === 'h-search,c-coffee,a-coral,n-soft', 'y arma la pantalla');
  // sin puente (navegador normal) sigue funcionando el camino de siempre
  ok(await pg.evaluate(() => nativeCopy('x') === true && nativeRead() === 'x'), 'util.js expone nativeCopy y nativeRead');
  await pg.evaluate(() => { delete window.EstilosAndroid; }); ok(await pg.evaluate(() => nativeCopy('x') === false && nativeRead() === null), 'sin puente devuelven false/null para que se use la web');
  ok(errors.length === 0, 'sin errores: ' + errors.join('|'));
  await b.close(); console.log(n + ' comprobaciones del portapapeles nativo correctas.');
})().catch(e => { console.error(e); process.exit(1); });
