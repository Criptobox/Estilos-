/* Conectar una IA: clave → lista real de modelos → prueba de cada uno → solo se usan los que responden → generar la pantalla (con reintento). */
const { chromium } = require('playwright'); const assert = require('node:assert/strict');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
(async () => {
  const b = await chromium.launch(), pg = await (await b.newContext({ viewport: { width: 412, height: 1000 } })).newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }; let chats = 0, authSeen = [];
  await pg.route('https://mock.test/**', async route => {
    const q = route.request(), u = q.url();
    if (q.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    authSeen.push(q.headers()['authorization']);
    if (u.endsWith('/models')) return route.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'modelo-bueno' }, { id: 'modelo-retirado' }, { id: 'text-embedding-9' }] }) });
    const body = JSON.parse(q.postData() || '{}');
    if (body.model === 'modelo-retirado') return route.fulfill({ status: 404, headers: CORS, contentType: 'application/json', body: '{"error":"The model does not exist"}' });
    const prompt = (body.messages || []).map(m => m.content).join('\n');
    if (/Responde otra vez SOLO/.test(prompt)) { chats++; return route.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: '```json\n' + JSON.stringify({ idea: 'Cafetería', bloques: [{ id: 'h-search' }, { id: 'c-coffee', copias: 2 }, { id: 'a-coral' }, { id: 'n-soft' }], paleta: 'mandarina' }) + '\n```' } }] }) }); }
    if (/IDEA:/.test(prompt)) { chats++; return route.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: 'Claro, te lo preparo enseguida.' } }] }) }); }
    return route.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: 'hola' } }] }) });
  });
  await pg.goto('http://127.0.0.1:8080/crear.html'); await pg.waitForSelector('#openReceta');
  await pg.click('#openReceta'); await pg.fill('#recIdea', 'Una cafetería con pedidos');
  ok(/Aún no hay una IA/.test(await pg.innerText('#recAiNote')), 'sin IA conectada se avisa');
  await pg.click('#recAi'); await pg.waitForSelector('#iaDialog[open]'); ok(true, 'sin IA, «Generar» abre la conexión');
  await pg.click('[data-act=ia-provider][data-id=custom]'); await pg.fill('#iaBase', 'http://mock.test/v1'); await pg.fill('#iaKey', 'sk-secreta'); await pg.click('#iaConnect');
  ok(/https/.test(await pg.innerText('#iaStatus')), 'una dirección sin https se rechaza');
  await pg.fill('#iaBase', 'https://mock.test/v1'); await pg.click('#iaConnect');
  await pg.waitForFunction(() => /responden/.test(document.getElementById('iaStatus').textContent), null, { timeout: 15000 });
  ok(await pg.locator('#iaModels li.ok').count() === 1 && await pg.locator('#iaModels li.bad').count() === 1, 'un modelo responde y otro no existe');
  ok(!(await pg.innerText('#iaModels')).includes('embedding'), 'no prueba los embeddings');
  ok((await pg.innerText('#iaModels li.bad')).includes('no reconoce'), 'explica por qué falló');
  ok(/modelo-bueno/.test(await pg.innerText('#iaActive')), 'el modelo bueno queda activo');
  ok(authSeen.every(a => a === 'Bearer sk-secreta'), 'la clave viaja como Bearer solo al proveedor');
  const guardado = await pg.evaluate(() => localStorage.getItem('estilos-tinta-ia-v1')); ok(guardado.includes('modelo-bueno') && guardado.includes('sk-secreta'), 'queda guardado en el dispositivo');
  ok(!(await pg.evaluate(() => localStorage.getItem('estilos-tinta-prototype-v1') || '')).includes('sk-secreta'), 'la clave no entra en el borrador');
  await pg.click('[data-act=close-ia]');
  ok(/mock|Otro|modelo-bueno/.test(await pg.innerText('#recAiNote')), 'la receta muestra la IA conectada');
  await pg.click('#recAi'); await pg.waitForFunction(() => !document.getElementById('recetaDialog').open, null, { timeout: 15000 }); await pg.waitForSelector('#phoneContent .component-host');
  ok(chats === 2, 'primera respuesta mala → se reintenta con las correcciones (' + chats + ' llamadas)');
  const st = await pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1')));
  ok(st.selected.join() === 'h-search,c-coffee,a-coral,n-soft' && st.palette === 'mandarina', 'la pantalla se arma con la respuesta corregida');
  await pg.reload(); await pg.evaluate(() => { location.hash = '#idea'; }); await pg.waitForSelector('#openReceta', { state: 'visible' }); await pg.click('#openReceta'); ok(/modelo-bueno/.test(await pg.innerText('#recAiNote')), 'la conexión sobrevive a recargar');
  await pg.click('#recIaBtn'); await pg.click('[data-act=ia-forget]'); ok(!(await pg.evaluate(() => localStorage.getItem('estilos-tinta-ia-v1'))).includes('sk-secreta'), 'olvidar borra la clave');
  ok(errors.length === 0, 'sin errores de página: ' + errors.join('|'));
  await b.close(); console.log(n + ' comprobaciones de conexión con IA correctas.');
})().catch(e => { console.error(e); process.exit(1); });
