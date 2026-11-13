/* Lanzadores a chats web: copiar el prompt, abrir el chat, pegar la respuesta copiada y crear la pantalla. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const ANSWER = '```json\n' + JSON.stringify({ idea: 'Cafetería', bloques: [{ id: 'h-search' }, { id: 'c-coffee', copias: 2 }, { id: 'a-coral' }, { id: 'n-soft' }], paleta: 'mandarina' }) + '\n```';
async function nuevo(b, perms) { const ctx = await b.newContext({ viewport: { width: 412, height: 1000 }, permissions: perms }); const pg = await ctx.newPage(); await pg.addInitScript(() => { window.__opened = []; window.open = (u, t, f) => { window.__opened.push([u, t, f]); return null; }; }); pg.errs = []; pg.on('pageerror', e => pg.errs.push(e.message)); await pg.goto('http://127.0.0.1:8080/crear.html'); await pg.waitForSelector('#openReceta'); await pg.click('#openReceta'); await pg.waitForSelector('#recetaDialog[open]'); return pg; }
(async () => {
  const b = await chromium.launch();
  let pg = await nuevo(b, ['clipboard-read', 'clipboard-write']);
  const names = await pg.$$eval('#recChats button', e => e.map(x => x.textContent.replace(' ↗', ''))); ok(['ChatGPT', 'Claude', 'Gemini', 'GLM'].every(x => names.includes(x)), 'hay lanzadores: ' + names.join(', '));
  await pg.fill('#recIdea', ''); await pg.click('[data-chat=claude]'); ok(await pg.locator('#recMsg .err').count() === 1 && (await pg.evaluate(() => window.__opened)).length === 0, 'sin idea no abre nada');
  await pg.fill('#recIdea', 'Una cafetería con pedidos'); await pg.click('[data-chat=claude]');
  await pg.waitForFunction(() => window.__opened.length === 1);
  const op = await pg.evaluate(() => window.__opened[0]); ok(op[0] === 'https://claude.ai/new' && /noopener/.test(op[2]), 'abre Claude en otra pestaña de forma segura');
  const clip = await pg.evaluate(() => navigator.clipboard.readText()); ok(/Una cafetería con pedidos/.test(clip) && /h-search/.test(clip), 'antes de abrir, copia el prompt con la idea y el catálogo');
  ok(/Pégalo en Claude/.test(await pg.innerText('#recCopyNote')), 'explica qué hacer');
  await pg.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  ok(await pg.locator('#recPaste.ready').count() === 1, 'al volver, resalta «Pegar y crear»');
  await pg.evaluate(a => navigator.clipboard.writeText(a), ANSWER); await pg.click('#recPaste');
  await pg.waitForFunction(() => !document.getElementById('recetaDialog').open, null, { timeout: 10000 }); await pg.waitForSelector('#phoneContent .component-host');
  const st = await pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1')));
  ok(st.selected.join() === 'h-search,c-coffee,a-coral,n-soft' && st.palette === 'mandarina' && st.repeat['c-coffee'] === 2, 'la respuesta pegada arma la pantalla');
  ok(pg.errs.length === 0, 'sin errores: ' + pg.errs.join('|'));
  // portapapeles vacío
  await pg.evaluate(() => { location.hash = '#idea'; }); await pg.waitForSelector('#openReceta', { state: 'visible' }); await pg.click('#openReceta'); await pg.evaluate(() => navigator.clipboard.writeText(' ')); await pg.click('#recPaste'); await pg.waitForFunction(() => document.getElementById('recMsg').textContent.length > 0);
  const vm = await pg.innerText('#recMsg'); ok(/nada copiado/.test(vm), 'portapapeles vacío: lo dice: [' + vm + '] ' + await pg.evaluate(() => document.getElementById('recetaDialog').open));
  await pg.context().close();
  // sin permiso para leer lo copiado (móvil, WebView): se pide pegar a mano
  pg = await nuevo(b, ['clipboard-write']); await pg.click('#recPaste'); await pg.waitForFunction(() => document.getElementById('recMsg').textContent.length > 0);
  ok(/Mantén pulsado/.test(await pg.innerText('#recMsg')) && await pg.evaluate(() => document.activeElement.id) === 'recAnswer', 'sin permiso de lectura: enfoca el recuadro y explica cómo pegar');
  ok(pg.errs.length === 0, 'sin errores: ' + pg.errs.join('|'));
  await b.close(); console.log(n + ' comprobaciones de lanzadores a chats correctas.');
})().catch(e => { console.error(e); process.exit(1); });
