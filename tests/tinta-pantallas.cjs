/* Todas las pantallas de la app: plan, vista previa navegable, exportación multi-pantalla y casos de barra distintos. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const S = require('../web/js/tinta-screens.js'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const bt = (t, a, c) => ({ text: t, aria: a, cls: c });
ok(JSON.stringify(S.mapNav([bt('Inicio'), bt('Explorar'), bt('Guardados'), bt('Perfil')])) === '["inicio","explorar","guardados","perfil"]', 'mapNav: barra de 4 con texto');
ok(JSON.stringify(S.mapNav([bt('Inicio'), bt('Buscar'), bt('', 'Crear', 'add'), bt('Ideas'), bt('Perfil')])) === '["inicio","explorar",null,"guardados","perfil"]', 'mapNav: barra de 5 con botón central de acción');
ok(JSON.stringify(S.mapNav([bt('Inicio'), bt(''), bt(''), bt('')])) === '["inicio","explorar","guardados","perfil"]', 'mapNav: iconos sin texto por posición');
ok(JSON.stringify(S.mapNav([bt('Home'), bt('Favoritos')])) === '["inicio","guardados"]' && S.mapNav([]).length === 0, 'mapNav: barras cortas y vacías');
const pl = S.plan({ headerId: 'h-search', plainHeaderId: 'h-minimal', cardId: 'c-coffee', actionId: 'a-coral', hasList: true, hasAvatar: true });
ok(pl.explorar[0].id === 'h-search' && pl.explorar[1].repeat === 4 && pl.guardados[0].id === 'h-minimal' && pl.guardados[1].repeat === 2 && pl.perfil.map(x => x.id).join() === 'h-minimal,lib-ava-3,lib-lis-1,a-coral', 'plan: Explorar con su cabecera y 4 tarjetas; Guardados y Perfil con cabecera sencilla');
ok(S.plan({ headerId: null, cardId: null, actionId: null }).explorar.length === 0, 'plan: sin bloques no inventa pantallas vacías');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  const draft = () => pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1')));
  const title = () => pg.evaluate(() => { const h = document.querySelector('#phoneContent .component-host'); return h.shadowRoot.querySelector('h1').textContent.replace(/\s+/g, ' ').trim(); });
  const tabs = () => pg.locator('#screenTabs button').allTextContents();
  await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.template-card');
  await pg.click('.palette-card[data-id=cafe] [data-act=use-palette]'); await pg.click('.motion-card[data-id=fade-up] [data-act=use-motion]');
  await pg.click('.template-card[data-id=tpl-cafeteria] [data-act=use-template]'); await pg.waitForSelector('#review', { state: 'visible' });
  ok((await draft()).multi === true && await pg.locator('#multiToggle').isChecked(), 'una plantilla activa «todas las pantallas»');
  ok(JSON.stringify((await tabs()).slice(0, 4)) === '["Inicio","Explorar","Guardados","Perfil"]', 'la vista previa ofrece las 4 pantallas de la barra');
  const t0 = await title(); ok(/pausa|rico|café/i.test(t0) && !/Algo bueno/.test(t0), 'Inicio: titular de la idea, no el genérico');
  const inicioCards = await pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.textContent.replace(/\s+/g, ' ')).join('|'));
  ok(!/Seleccionar producto/.test(inicioCards), 'sin el «Seleccionar producto» de demostración');
  const heads = {};
  for (const v of ['explorar', 'guardados', 'perfil']) { await pg.click(`#screenTabs [data-id=${v}]`); heads[v] = await title(); ok(await pg.locator(`#screenTabs [data-id=${v}]`).getAttribute('aria-pressed') === 'true', `pestaña ${v} activa`); }
  ok(/Explora el menú/.test(heads.explorar) && /Tus favoritos/.test(heads.guardados) && /Tu perfil/.test(heads.perfil), 'cada pantalla lleva su propio titular');
  ok(new Set(Object.values(heads).concat(t0)).size === 4, 'los cuatro titulares son distintos');
  await pg.click('#screenTabs [data-id=explorar]'); const exTexts = await pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.textContent.replace(/\s+/g, ' ')).join('|'));
  ok(await pg.locator('#phoneContent .component-host').count() === 5 && exTexts !== inicioCards, 'Explorar: cabecera + 4 tarjetas con contenido distinto al de Inicio');
  await pg.click('#screenTabs [data-id=perfil]'); ok(await pg.evaluate(() => { const t = [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.textContent).join(' '); return /Mis pedidos/.test(t) && /Editar mi perfil/.test(t) && !/Wi-Fi/.test(t); }), 'Perfil: avatar, lista de pedidos y acción «Editar mi perfil»');
  // Navegar tocando la barra dentro del teléfono.
  await pg.evaluate(() => document.querySelector('#phoneNav .component-host').shadowRoot.querySelectorAll('button')[1].click());
  ok(/Explora el menú/.test(await title()) && await pg.locator('#screenTabs [data-id=explorar]').getAttribute('aria-pressed') === 'true', 'tocar «Explorar» en la barra del teléfono cambia de pantalla');
  ok(await pg.evaluate(() => { const bs = document.querySelector('#phoneNav .component-host').shadowRoot.querySelectorAll('button'); return bs[1].classList.contains('on') && !bs[0].classList.contains('on'); }), 'la barra marca la pestaña activa');
  // Exportación
  await pg.click('#composeButton'); const dl = pg.waitForEvent('download'); await pg.click('[data-act=export]'); const file = path.join(os.tmpdir(), 'app-' + Date.now() + '.html'); await (await dl).saveAs(file);
  const html = fs.readFileSync(file, 'utf8'); ok(['inicio','explorar','guardados','perfil'].every(v => html.includes('data-screen="' + v + '"')) && html.includes('<script>(function(){var map=["inicio","explorar","guardados","perfil"]') && html.includes('.content[hidden]'), 'la exportación trae las 4 pantallas de la barra y el script de navegación');
  ok(html.includes('background:#f4ece1') && html.includes('data-m-entrance="fade-up"'), 'conserva la paleta y la animación en todas las pantallas');
  const ex = await b.newPage({ viewport: { width: 390, height: 844 } }); await ex.goto('file://' + file); await ex.waitForTimeout(500);
  const visible = () => ex.evaluate(() => [...document.querySelectorAll('[data-screen]')].filter(s => !s.hidden).map(s => s.dataset.screen).join());
  ok(await visible() === 'bienvenida', 'la página exportada abre en la Bienvenida');
  await ex.evaluate(() => document.querySelector('[data-screen=bienvenida] estilos-block').shadowRoot.querySelector('[data-go=acceso]').click()); await ex.evaluate(() => document.querySelector('[data-screen=acceso] estilos-block').shadowRoot.querySelector('.go').click()); ok(await visible() === 'inicio', 'Empezar → Entrar llega a Inicio');
  for (const [i, v] of [[2, 'guardados'], [3, 'perfil'], [1, 'explorar'], [0, 'inicio']]) { await ex.evaluate(i => document.querySelector('nav.dock estilos-block').shadowRoot.querySelectorAll('button')[i].click(), i); ok(await visible() === v, `exportada: la barra abre ${v}`); }
  ok(await ex.evaluate(() => { const b = document.querySelector('nav.dock estilos-block').shadowRoot.querySelectorAll('button'); return b[0].classList.contains('on') && !b[3].classList.contains('on'); }), 'exportada: la pestaña activa se actualiza');
  ok(await ex.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'exportada: sin desbordamiento en móvil'); fs.unlinkSync(file);
  // Interruptor, historial y avisos
  await pg.click('#multiToggle'); ok((await draft()).multi === false && (await tabs()).length === 0, 'desactivar deja solo la pantalla de inicio (sin pestañas)');
  await pg.click('#composeButton'); const dl2 = pg.waitForEvent('download'); await pg.click('[data-act=export]'); const f2 = path.join(os.tmpdir(), 'app1-' + Date.now() + '.html'); await (await dl2).saveAs(f2); const h2 = fs.readFileSync(f2, 'utf8'); fs.unlinkSync(f2);
  ok(!h2.includes('data-screen=') && !h2.includes('var map='), 'con una sola pantalla la exportación no lleva script de navegación');
  await pg.keyboard.press('Control+z'); ok((await draft()).multi === true && (await tabs()).length >= 4, 'Ctrl+Z vuelve a activar todas las pantallas');
  await pg.click('#screenTabs [data-id=perfil]'); await pg.click('[data-act=share-link]'); const link = await pg.inputValue('#shareLink'); const senderMulti = (await draft()).multi;
  const rx = await ctx.newPage(); await rx.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', '1'); localStorage.clear(); } }); await rx.goto(link); await rx.waitForSelector('#projectsDialog[open]'); await rx.waitForTimeout(300);
  ok(senderMulti === true && await rx.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-projects-v1'))[0].draft.multi) === true, 'el enlace compartido conserva «todas las pantallas»');
  // Sin idea de sector no se activa.
  const p2 = await ctx.newPage(); await p2.goto('http://127.0.0.1:8080/index.html#bloques'); await p2.waitForSelector('.gallery-item'); await p2.click('.gallery-item[data-id=h-minimal] [data-act=select]'); await p2.click('.gallery-item[data-id=c-coral] [data-act=select]'); await p2.click('.gallery-item[data-id=n-soft] [data-act=select]'); await p2.click('#reviewSelection'); await p2.waitForSelector('#review', { state: 'visible' });
  await p2.evaluate(() => { const e = document.getElementById('idea'); e.value = 'algo diferente'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await p2.click('#multiToggle'); ok(!(await p2.locator('#multiToggle').isChecked()) && /Cuéntame tu idea/.test(await p2.locator('#toast').textContent()), 'sin sector no se activa y pide la idea');
  // Otras barras: de 5 botones con acción central, y solo iconos.
  for (const [navId, expectTabs] of [['n-float', 4], ['n-dark', 4]]) {
    const ctx2 = await b.newContext({ viewport: { width: 1280, height: 1000 } }), q = await ctx2.newPage(); await q.addInitScript(d => localStorage.setItem('estilos-tinta-prototype-v1', d), JSON.stringify({ brief: 'Una app para mi cafetería', selected: ['h-search', 'c-coffee', 'a-coral', navId], choices: { header: 'h-search', nav: navId }, content: {}, repeat: {}, motion: {}, palette: null, multi: true, assets: {}, ui: {}, buttonStyles: {}, cardStyles: {} }));
    await q.goto('http://127.0.0.1:8080/index.html#pantalla'); await q.waitForSelector('#screenTabs button'); ok((await q.locator('#screenTabs button:not([data-id=bienvenida]):not([data-id=acceso]):not([data-id=detalle]):not([data-id=carrito]):not([data-id=listo]):not([data-id=ajustes]):not([data-id=chat])').count()) === expectTabs, `barra ${navId}: ${expectTabs} pantallas de barra`);
    if (navId === 'n-float') { const before = await q.evaluate(() => document.querySelector('#phoneContent .component-host').shadowRoot.querySelector('h1').textContent); await q.evaluate(() => document.querySelector('#phoneNav .component-host').shadowRoot.querySelector('button.add').click()); ok(await q.evaluate(() => document.querySelector('#phoneContent .component-host').shadowRoot.querySelector('h1').textContent) === before, 'el botón central de acción no cambia de pantalla'); }
    await ctx2.close();
  }
  // Nombre de la app en la marca de las cabeceras sencillas.
  { const c4 = await b.newContext({ viewport: { width: 1280, height: 1000 } }), w = await c4.newPage(); await w.addInitScript(d => localStorage.setItem('estilos-tinta-prototype-v1', d), JSON.stringify({ brief: 'Rumbo: una app de viajes para reservar', selected: ['h-minimal', 'c-coffee', 'a-dark', 'n-soft'], choices: { header: 'h-minimal', nav: 'n-soft' }, content: {}, repeat: {}, motion: {}, palette: null, multi: true, assets: {}, ui: {}, buttonStyles: {}, cardStyles: {} }));
    await w.goto('http://127.0.0.1:8080/index.html#pantalla'); await w.waitForSelector('#screenTabs button');
    const brand = () => w.evaluate(() => document.querySelector('#phoneContent .component-host').shadowRoot.textContent.replace(/\s+/g, ' '));
    await w.click('#screenTabs [data-id=perfil]'); const pf = await brand(); ok(/Rumbo/.test(pf) && !/studio/i.test(pf), 'la marca «studio» se sustituye por el nombre de la app («Rumbo: …» → Rumbo)');
    ok(!/Explora por estilo|Un lugar para lo que te inspira/.test(pf), 'Perfil no repite frases genéricas bajo el titular');
    await w.click('[data-act=adapt-text]'); await w.click('#screenTabs [data-id=inicio]'); ok(/Rumbo/.test(await brand()) && !/studio/i.test(await brand()), 'Inicio también lleva el nombre de la app tras «Adaptar textos»');
    await c4.close(); const c5 = await b.newContext({ viewport: { width: 1280, height: 1000 } }), y = await c5.newPage(); await y.addInitScript(d => localStorage.setItem('estilos-tinta-prototype-v1', d), JSON.stringify({ brief: 'Una app de viajes para reservar', selected: ['h-minimal', 'c-coffee', 'a-dark', 'n-soft'], choices: { header: 'h-minimal', nav: 'n-soft' }, content: {}, repeat: {}, motion: {}, palette: null, multi: true, assets: {}, ui: {}, buttonStyles: {}, cardStyles: {} }));
    await y.goto('http://127.0.0.1:8080/index.html#pantalla'); await y.waitForSelector('#screenTabs button'); await y.click('#screenTabs [data-id=perfil]'); ok(/Viajes/.test(await y.evaluate(() => document.querySelector('#phoneContent .component-host').shadowRoot.textContent)), 'sin nombre en la idea se usa el del sector (Viajes)'); await c5.close(); }
  const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto('http://127.0.0.1:8080/index.html#pantalla'); await m.waitForTimeout(300);
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desbordamiento en móvil');
  ok(errors.length === 0, 'sin excepciones: ' + errors.join('|')); await b.close(); console.log(`${n} comprobaciones de pantallas correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
