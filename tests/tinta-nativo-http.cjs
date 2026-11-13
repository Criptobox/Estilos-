/* Peticiones nativas (app Android): si existe el puente EstilosAndroid.httpRequest, las IA y GitHub salen por la app (sin CORS) y fetch no se usa. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
(async () => {
  const b = await chromium.launch(), pg = await (await b.newContext({ viewport: { width: 412, height: 1000 } })).newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.addInitScript(() => {
    window.__native = []; window.__fetchHttps = 0; const f = window.fetch.bind(window); window.fetch = (u, i) => { if (/^https:/.test(String(u))) window.__fetchHttps++; return f(u, i); };
    const b64 = s => btoa(unescape(encodeURIComponent(s)));
    window.EstilosAndroid = {
      saveFile() {}, copyText: () => true, readText: () => '', httpCancel() {},
      httpRequest(id, method, url, headers, body) {
        window.__native.push({ id, method, url, headers: JSON.parse(headers), body });
        setTimeout(() => {
          if (/nvidia/.test(url) && /\/models$/.test(url)) return window.__nativeHttpDone(id, 200, b64(JSON.stringify({ data: [{ id: 'meta/llama-ok' }, { id: 'viejo/retirado' }] })), '');
          if (/nvidia/.test(url) && /chat\/completions/.test(url)) { const m = JSON.parse(body).model; return m === 'viejo/retirado' ? window.__nativeHttpDone(id, 404, b64('{"error":"model not found"}'), '') : window.__nativeHttpDone(id, 200, b64(JSON.stringify({ choices: [{ message: { content: 'hola ñ' } }] })), ''); }
          if (/groq/.test(url)) return window.__nativeHttpDone(id, 0, '', 'Unable to resolve host');
          window.__nativeHttpDone(id, 404, b64('{}'), '');
        }, 20);
      }
    };
  });
  await pg.goto('http://127.0.0.1:8080/crear.html'); await pg.waitForSelector('#openReceta'); await pg.click('#openReceta'); await pg.click('#recIaBtn'); await pg.waitForSelector('#iaDialog[open]');
  await pg.click('[data-act=ia-provider][data-id=nvidia]'); await pg.fill('#iaKey', 'nvapi-secreta'); await pg.click('#iaConnect');
  await pg.waitForFunction(() => /responden/.test(document.getElementById('iaStatus').textContent), null, { timeout: 15000 });
  const calls = await pg.evaluate(() => window.__native);
  ok(calls.length >= 3 && calls.every(c => c.url.startsWith('https://integrate.api.nvidia.com/')), 'todas las peticiones salen por la app, solo a NVIDIA (' + calls.length + ')');
  ok(calls.every(c => c.headers.Authorization === 'Bearer nvapi-secreta'), 'la clave viaja en la cabecera, no en la dirección'); ok(calls.some(c => c.method === 'GET') && calls.some(c => c.method === 'POST'), 'GET para la lista y POST para probar');
  ok(await pg.evaluate(() => window.__fetchHttps) === 0, 'no se usó fetch del navegador (sin CORS)');
  ok(await pg.locator('#iaModels li.ok').count() === 1 && await pg.locator('#iaModels li.bad').count() === 1, 'un modelo responde y el retirado se descarta');
  ok(/En uso: NVIDIA NIM · meta\/llama-ok/.test(await pg.innerText('#iaActive')), 'queda activo el que responde');
  // error de red nativo → mensaje claro
  await pg.click('[data-act=ia-provider][data-id=groq]'); await pg.fill('#iaKey', 'gsk-x'); await pg.click('#iaConnect');
  await pg.waitForFunction(() => /Sin respuesta/.test(document.getElementById('iaStatus').textContent), null, { timeout: 15000 }); ok(await pg.locator('#iaStatus.err').count() === 1, 'un fallo de red se explica');
  // chat por el puente (UTF-8 bien decodificado)
  const txt = await pg.evaluate(async () => { const r = await nativeFetch('https://integrate.api.nvidia.com/v1/chat/completions', { method: 'POST', headers: {}, body: JSON.stringify({ model: 'meta/llama-ok' }) }); return (await r.json()).choices[0].message.content; }); ok(txt === 'hola ñ', 'el cuerpo en UTF-8 llega bien');
  ok(await pg.evaluate(() => nativeFetch('http://localhost/x', {}) === null && nativeFetch('file:///etc/passwd', {}) === null), 'solo https pasa por el puente nativo');
  ok(errors.length === 0, 'sin errores de página: ' + errors.join('|'));
  await b.close(); console.log(n + ' comprobaciones de peticiones nativas correctas.');
})().catch(e => { console.error(e); process.exit(1); });
