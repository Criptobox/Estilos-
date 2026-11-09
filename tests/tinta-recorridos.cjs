/* Pantallas de recorrido: bienvenida, acceso, detalle, carrito, ¡listo!, ajustes y chat, enlazadas en la vista
   del móvil y en la exportación; se eligen por app y el carrito solo aparece en comercios. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const S = require('../web/js/tinta-screens.js'), src = fs.readFileSync(path.join(__dirname, '../web/js/tinta-flows.js'), 'utf8');
ok(S.FLOWS.length === 7 && S.flowsFor('tienda').includes('carrito') && !S.flowsFor('salud').includes('carrito'), '7 pantallas de recorrido; el carrito solo en comercios');
ok(S.resolve('carrito', ['inicio', 'listo']) === 'listo' && S.resolve('chat', ['inicio']) === 'inicio' && S.resolve('perfil', ['inicio', 'perfil']) === 'perfil', 'si un destino no existe se va al siguiente con sentido');
ok(!/<script|javascript:|\bon[a-z]+=|@import|url\((?!#)|<iframe|<img/i.test(src), 'los bloques no llevan scripts ni recursos externos');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  const draft = () => pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1') || '{}'));
  const tabs = () => pg.$$eval('#screenTabs button', bs => bs.map(x => x.dataset.id));
  const current = () => pg.$eval('#screenTabs [aria-pressed=true]', x => x.dataset.id);
  const tap = (sel, i = 0) => pg.evaluate(([sel, i]) => { const el = [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.querySelector(sel)).filter(Boolean)[i]; if (!el) throw Error('no ' + sel); el.click(); }, [sel, i]);
  const text = () => pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.textContent).join(' ').replace(/\s+/g, ' '));
  await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.gallery-item');
  ok(await pg.evaluate(fl => fl.every(f => !!document.querySelector(`.gallery-item[data-id="f-${f}"]`)), S.FLOWS), 'las 7 pantallas están en la biblioteca');
  await pg.click('.template-card[data-id=tpl-cafeteria] [data-act=use-template]'); await pg.waitForSelector('#screenTabs button');
  ok((await tabs()).join() === 'inicio,explorar,guardados,perfil,bienvenida,acceso,detalle,carrito,listo,ajustes,chat', 'cafetería: 4 pestañas + 7 pantallas de recorrido');
  ok(await pg.locator('#flowList [data-flow]').count() === 7 && await pg.locator('#flowList [data-flow]:checked').count() === 7, 'se pueden elegir una a una (todas marcadas al empezar)');
  // Recorrido de compra en la vista del móvil
  await pg.click('#screenTabs [data-id=inicio]'); await pg.evaluate(() => { const h = document.querySelector('#phoneContent .component-host[data-role=cards]'); h.shadowRoot.querySelector('article,div').click(); });
  ok(await current() === 'detalle', 'tocar una tarjeta abre el detalle');
  const det = await text(); ok(/Café de la casa/.test(det) && /\$4\.50/.test(det) && await pg.evaluate(() => document.getElementById('phoneNav').hidden), 'el detalle trae el producto del sector y oculta la barra');
  await tap('[data-go=carrito]'); ok(await current() === 'carrito' && /Capuchino[\s\S]*\$19\.90/.test(await text()), 'Añadir lleva al carrito con productos y total sumado');
  await tap('[data-go=back]'); ok(await current() === 'detalle', 'el botón Volver regresa a la pantalla anterior');
  await tap('[data-go=carrito]'); await tap('[data-go=listo]'); ok(await current() === 'listo' && /¡Pedido en camino!/.test(await text()), 'Pagar lleva a la confirmación del sector');
  await tap('[data-go=inicio]'); ok(await current() === 'inicio' && !(await pg.evaluate(() => document.getElementById('phoneNav').hidden)), 'y de vuelta al inicio con la barra');
  // Bienvenida → Acceso → Inicio; Ajustes → Chat
  await pg.click('#screenTabs [data-id=bienvenida]'); await tap('[data-go=acceso]'); ok(await current() === 'acceso', 'Empezar abre el acceso'); await tap('.go[data-go=inicio]'); ok(await current() === 'inicio', 'Entrar abre el inicio');
  await pg.click('#screenTabs [data-id=ajustes]'); const sw = () => pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.querySelector('[role=switch]')).find(Boolean).getAttribute('aria-checked'));
  const before = await sw(); await tap('[role=switch]'); ok(before !== await sw(), 'los interruptores de Ajustes se pueden activar');
  await tap('[data-go=chat]'); ok(await current() === 'chat' && /Cafetería IA|IA/.test(await text()) && /desayunar/.test(await text()), 'Hablar con el asistente abre el chat con la mascota y una conversación del sector');
  ok(await pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].some(h => h.shadowRoot.querySelector('.rb svg'))), 'el chat muestra el robot');
  // Quitar el carrito: «Añadir» va directo a la confirmación
  await pg.uncheck('#flowList [data-flow=carrito]'); ok(!(await tabs()).includes('carrito') && (await draft()).flows.length === 6, 'desmarcar Carrito lo quita de la app y se guarda');
  await pg.click('#screenTabs [data-id=detalle]'); await tap('[data-go=carrito]'); ok(await current() === 'listo', 'sin carrito, Añadir lleva a la confirmación');
  // Exportación: pantallas incluidas, empieza en Bienvenida y navega
  await pg.click('#composeButton'); const dl = pg.waitForEvent('download'); await pg.click('[data-act=export]'); const file = path.join(os.tmpdir(), 'rec-' + Date.now() + '.html'); await (await dl).saveAs(file); const html = fs.readFileSync(file, 'utf8');
  ok(['bienvenida', 'acceso', 'detalle', 'listo', 'ajustes', 'chat'].every(f => html.includes(`data-screen="${f}"`)) && !html.includes('data-screen="carrito"'), 'la exportación incluye las pantallas elegidas');
  const ex = await ctx.newPage(); await ex.setViewportSize({ width: 390, height: 860 }); await ex.goto('file://' + file); await ex.waitForTimeout(200);
  const vis = () => ex.evaluate(() => document.querySelector('[data-screen]:not([hidden])').dataset.screen), tapEx = sel => ex.evaluate(sel => { const el = [...document.querySelectorAll('[data-screen]:not([hidden]) estilos-block')].map(h => h.shadowRoot.querySelector(sel)).filter(Boolean)[0]; el.click(); }, sel);
  ok(await vis() === 'bienvenida' && await ex.evaluate(() => document.querySelector('nav.dock').hidden), 'la app exportada abre en la bienvenida, sin barra');
  await tapEx('[data-go=acceso]'); ok(await vis() === 'acceso', 'exportada: Empezar → Acceso'); await tapEx('.go[data-go=inicio]'); ok(await vis() === 'inicio' && !(await ex.evaluate(() => document.querySelector('nav.dock').hidden)), 'exportada: Entrar → Inicio con barra');
  await ex.evaluate(() => [...document.querySelectorAll('[data-screen=inicio] estilos-block[data-card]')][0].shadowRoot.querySelector('article,div').click()); ok(await vis() === 'detalle', 'exportada: una tarjeta abre el detalle');
  await tapEx('[data-go=back]'); ok(await vis() === 'inicio', 'exportada: Volver');
  // Un sector sin comercio no tiene carrito
  await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.template-card'); await pg.click('.template-card[data-id=tpl-salud] [data-act=use-template]'); await pg.waitForSelector('#screenTabs button');
  ok(!(await tabs()).includes('carrito') && (await tabs()).includes('listo'), 'salud: sin carrito'); await pg.click('#screenTabs [data-id=listo]'); ok(/¡Cita agendada!/.test(await text()), 'salud: «¡Cita agendada!»');
  ok(!errors.length, 'sin errores de página: ' + errors.join(' | '));
  await b.close(); console.log(`${n} comprobaciones de pantallas de recorrido correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
