/* Fotos grandes: salen del borrador (localStorage) hacia IndexedDB, vuelven al recargar y no se pierden al guardar de nuevo. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
(async () => {
  const b = await chromium.launch(), pg = await (await b.newContext({ viewport: { width: 412, height: 1000 } })).newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  const U = 'http://127.0.0.1:8080/crear.html', K = 'estilos-tinta-prototype-v1';
  const raw = () => pg.evaluate(k => localStorage.getItem(k) || '', K);
  const enBd = () => pg.evaluate(() => new Promise(res => { setTimeout(() => res(-2), 8000); const r = indexedDB.open('estilos-tinta-fotos', 1); r.onerror = () => res(-1); r.onblocked = () => res(-3); r.onsuccess = () => { const db = r.result; if (!db.objectStoreNames.contains('fotos')) return res(0); const q = db.transaction('fotos').objectStore('fotos').count(); q.onsuccess = () => res(q.result); }; }));
  await pg.goto(U + '#bloques/todo'); /* el contexto del navegador empieza vacío: sin borrados que bloqueen la base */
  ok(await pg.evaluate(() => typeof TintaStore === 'object' && TintaStore.available !== undefined), 'el almacén de fotos está cargado');
  // foto con ruido (no se comprime bien): pesa más de 30 KB incluso reducida
  const png = await pg.evaluate(() => { const c = document.createElement('canvas'); c.width = 700; c.height = 500; const g = c.getContext('2d'), d = g.createImageData(700, 500); for (let i = 0; i < d.data.length; i += 4) { d.data[i] = Math.random() * 255; d.data[i + 1] = Math.random() * 255; d.data[i + 2] = Math.random() * 255; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c.toDataURL('image/png').split(',')[1]; });
  const file = path.join(os.tmpdir(), 'tinta-foto-ruido.png'); fs.writeFileSync(file, Buffer.from(png, 'base64'));
  await pg.waitForFunction(() => document.getElementById('gallery')); await pg.evaluate(() => document.getElementById('gallery').classList.add('all'));
  await pg.waitForSelector('[data-act=select][data-id=c-coffee]'); await pg.click('[data-act=select][data-id=c-coffee]'); await pg.click('#reviewSelection'); await pg.waitForSelector('#review', { state: 'visible' });
  await pg.click('[data-act=edit-media][data-id=c-coffee]'); await pg.setInputFiles('[data-media-file]', file); await pg.waitForFunction(() => document.getElementById('mediaMessage').textContent.includes('Foto lista'), null, { timeout: 15000 });
  await pg.fill('[data-media-alt]', 'Mi foto grande'); await pg.click('#applyMedia'); await pg.waitForTimeout(600);
  const guardado = await raw(); ok(guardado.length > 0 && !guardado.includes('data:image'), 'la foto ya no está dentro del borrador'); ok(/"src":"idb:[a-z0-9-]+"/.test(guardado), 'en su lugar hay una referencia'); ok(guardado.length < 6000, 'el borrador pesa poco (' + guardado.length + ' caracteres)');
  const nbd = await enBd(); ok(nbd === 1, 'la foto está en IndexedDB (valor ' + nbd + ')');
  const ve = () => pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].some(h => [...h.shadowRoot.querySelectorAll('img')].some(i => /^data:image\//.test(i.getAttribute('src') || ''))));
  ok(await ve(), 'en pantalla se ve la foto completa');
  await pg.reload(); await pg.waitForFunction(() => document.getElementById('phoneContent') && document.querySelectorAll('#phoneContent .component-host').length > 0, null, { timeout: 15000 });
  ok(await ve(), 'tras recargar la foto vuelve desde IndexedDB');
  ok(!(await raw()).includes('data:image'), 'y el borrador sigue sin llevarla dentro');
  // editar otra cosa vuelve a guardar el borrador: la foto debe seguir referenciada
  await pg.evaluate(() => { const e = document.getElementById('idea'); e.value = 'Una cafetería con foto'; e.dispatchEvent(new Event('input', { bubbles: true })); }); await pg.waitForTimeout(300);
  ok(/"src":"idb:/.test(await raw()) && await enBd() === 1, 'guardar de nuevo conserva la referencia y no duplica la foto');
  // copia de seguridad: lleva la foto completa (no la referencia)
  const copia = await pg.evaluate(() => JSON.stringify(TintaBackup.create({ get: k => TintaStore.unpackText(localStorage.getItem(k)), set: () => {} }, '')));
  ok(/data:image\//.test(copia) && !/"src":"idb:/.test(copia), 'la copia de seguridad lleva la foto completa');
  ok(errors.length === 0, 'sin errores de página: ' + errors.join('|'));
  await b.close(); console.log(n + ' comprobaciones de fotos grandes correctas.');
})().catch(e => { console.error(e); process.exit(1); });
