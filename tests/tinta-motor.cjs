/* Modo motor: una página del mismo origen (como FORJA) mete Tinta en un iframe y le pide instrucciones, leer la respuesta
   del modelo, dibujar la app completa y abrir al equipo de agentes. Nada se guarda en el almacenamiento. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const RECETA = { idea: 'Cafetería', bloques: [{ id: 'h-search' }, { id: 'c-coffee', copias: 2 }, { id: 'a-coral' }, { id: 'n-soft' }], paleta: 'mandarina' };
(async () => {
  const b = await chromium.launch(), pg = await (await b.newContext({ viewport: { width: 412, height: 900 } })).newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://127.0.0.1:8080/manifest.webmanifest');
  await pg.setContent('<!doctype html><html><body><iframe id="t" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe></body></html>');
  await pg.evaluate(() => { window.__listo = null; window.__resp = {}; window.__n = 0; addEventListener('message', ev => { const m = ev.data; if (m && m.tipo === 'tinta:listo') window.__listo = m; if (m && m.tipo === 'tinta:respuesta') window.__resp[m.id] = m; });
    window.pedir = (accion, datos, ms = 20000) => new Promise((res, rej) => { const id = ++window.__n; document.getElementById('t').contentWindow.postMessage({ tipo: 'tinta:pedir', id, accion, datos }, location.origin); const t0 = Date.now(); (function w() { if (window.__resp[id]) return res(window.__resp[id]); if (Date.now() - t0 > ms) return rej(new Error('sin respuesta a ' + accion)); setTimeout(w, 50); })(); });
    document.getElementById('t').src = '/crear.html?motor=1'; });
  await pg.waitForFunction(() => window.__listo, null, { timeout: 15000 }); ok((await pg.evaluate(() => window.__listo.api)) === 1, 'el motor avisa de que está listo');
  const ping = await pg.evaluate(() => pedir('ping')); ok(ping.ok && ping.datos.bloques > 200 && ping.datos.plantillas >= 40, 'ping: ' + JSON.stringify(ping.datos));
  const ins = await pg.evaluate(() => pedir('instrucciones', { idea: 'una cafetería con pedidos', actual: '' })); ok(ins.ok && /asistente de diseño/.test(ins.datos.sistema) && /h-search/.test(ins.datos.sistema) && /SOLO con este JSON/.test(ins.datos.prompt), 'da las instrucciones para el modelo');
  const mal = await pg.evaluate(() => pedir('leer', { texto: 'no sé' })); ok(mal.ok && mal.datos.ok === false && /SOLO con el JSON/.test(mal.datos.correccion), 'una respuesta mala trae el mensaje de corrección');
  const bien = await pg.evaluate(t => pedir('leer', { texto: 'Claro\n```json\n' + t + '\n```' }), JSON.stringify(RECETA)); ok(bien.datos.ok && bien.datos.receta.blocks.length === 4, 'lee la receta');
  const dib = await pg.evaluate(r => pedir('dibujar', { receta: r, idea: 'Una cafetería con pedidos' }), bien.datos.receta);
  ok(dib.ok && /<!doctype html>/i.test(dib.datos.html) && dib.datos.html.length > 20000, 'dibuja la app completa (' + (dib.datos.html || '').length + ' caracteres)');
  ok(dib.datos.pantallas.length >= 5 && dib.datos.pantallas[0].nombre === 'Inicio', 'con todas sus pantallas: ' + dib.datos.pantallas.map(p => p.nombre).join(', '));
  ok(dib.datos.borrador.palette === 'mandarina' && dib.datos.borrador.selected.length === 4, 'devuelve el borrador para reabrirlo en Tinta');
  const malo = await pg.evaluate(() => pedir('dibujar', { receta: { blocks: [{ id: 'no-existe' }] } })); ok(!malo.ok && /no es válida|Falta/.test(malo.error), 'una receta inválida se rechaza con motivo');
  const otro = await pg.evaluate(() => pedir('volar')); ok(!otro.ok && /desconocida/.test(otro.error), 'una acción desconocida se rechaza');
  // el equipo de agentes trabaja y devuelve la versión elegida ya dibujada
  const pEq = pg.evaluate(r => pedir('equipo', { receta: r, idea: 'Una cafetería con pedidos' }, 60000), bien.datos.receta);
  const fr = pg.frameLocator('#t'); await fr.locator('#equipoDialog[open] .ag').first().waitFor({ timeout: 15000 });
  ok(await fr.locator('#equipoDialog .ag').count() === 8, 'el equipo de 8 agentes aparece dentro de la app madre');
  await fr.locator('[data-eq=speed]').click(); await fr.locator('#eqChoose.on').waitFor({ timeout: 25000 }); await fr.locator('#eqSeg [data-idx="2"]').click(); await fr.locator('#eqGo').click();
  const eq = await pEq; ok(eq.ok && eq.datos.modo === 'critico' && /<!doctype html>/i.test(eq.datos.html) && eq.datos.plantilla.mode === 'dark', 'devuelve la versión elegida (Crítico, oscura) ya dibujada');
  // cancelar con ✕
  const pCan = pg.evaluate(r => pedir('equipo', { receta: r }, 30000), bien.datos.receta); await fr.locator('#equipoDialog[open] .ag').first().waitFor({ timeout: 15000 }); await fr.locator('[data-eq=close]').click();
  const can = await pCan; ok(!can.ok && /Cancelado/.test(can.error), 'cerrar al equipo cancela la petición');
  const guardado = await pg.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('estilos-tinta-prototype') || k.startsWith('estilos-tinta-projects'))); ok(guardado.length === 0, 'el motor no guarda nada en el almacenamiento: ' + guardado.join(','));
  ok(errors.length === 0, 'sin errores: ' + errors.join('|'));
  await b.close(); console.log(n + ' comprobaciones del modo motor correctas.');
})().catch(e => { console.error(e); process.exit(1); });
