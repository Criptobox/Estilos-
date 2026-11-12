/* Tipografías: 12 letras para toda la pantalla, selector rápido en «Tu pantalla», galería sin huecos, se guardan y llegan a la exportación. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 412, height: 1000 }, acceptDownloads: true }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  const U = 'http://127.0.0.1:8080/index.html', draft = () => pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1') || '{}'));
  await pg.goto(U + '#bloques'); ok(await pg.locator('.lib-card[data-cat=tipografias]').count() === 1 && /12 diseños/.test(await pg.textContent('.lib-card[data-cat=tipografias]')), 'el inicio de la biblioteca trae la categoría Tipografías');
  await pg.goto(U + '#bloques/tipografias'); await pg.waitForSelector('.font-card:not([hidden])');
  ok(await pg.locator('.font-card:not([hidden])').count() === 12 && await pg.locator('.lib-subs a').count() === 4 && await pg.locator('.gallery-item').count() === 0, 'la categoría muestra las 12 letras con 3 subcategorías y sin la lista de bloques');
  const fill = await pg.evaluate(() => { const r = document.querySelector('#fontRow').getBoundingClientRect(), cs = [...document.querySelectorAll('.font-card:not([hidden])')].map(c => c.getBoundingClientRect()); return { gap: r.right - Math.max(...cs.map(c => c.right)), cols: new Set(cs.map(c => Math.round(c.left))).size }; });
  ok(fill.cols === 2 && fill.gap < 6, 'las tarjetas llenan el ancho en dos columnas');
  await pg.goto(U + '#bloques/tipografias/clasicas'); await pg.waitForSelector('.font-card:not([hidden])'); ok(await pg.locator('.font-card:not([hidden])').count() === 3, 'Clásicas con serifa muestra 3');
  await pg.goto(U + '#bloques/plantillas'); await pg.waitForSelector('.template-card'); await pg.locator('.template-card[data-id="tpl-cafeteria"] [data-act=use-template]').click(); await pg.waitForSelector('#fontPick');
  ok(await pg.locator('#fontPick option').count() === 13, 'el selector de «Tu pantalla» trae «Original» y las 12 letras');
  const familia = () => pg.evaluate(() => { const h = [...document.querySelectorAll('#phoneContent .component-host')].find(x => x.shadowRoot && x.shadowRoot.querySelector('h1,h2,h3,b')); return getComputedStyle(h.shadowRoot.querySelector('h1,h2,h3,b')).fontFamily; });
  const antes = await familia(); await pg.selectOption('#fontPick', 'tecnica'); await pg.waitForTimeout(300);
  const mono = await familia(); ok((await draft()).font === 'tecnica' && /monospace|mono|Courier|Consolas|Menlo/i.test(mono) && mono !== antes, 'elegir «Técnica» cambia la letra de los bloques y se guarda: ' + mono.slice(0, 40));
  await pg.selectOption('#fontPick', 'editorial'); await pg.waitForTimeout(300); ok(/Georgia|serif/i.test(await familia()), '«Editorial» usa una serifa');
  ok(await pg.evaluate(() => { const hs = [...document.querySelectorAll('#phoneContent .component-host')]; return hs.every(h => [...h.shadowRoot.querySelectorAll('button')].every(bt => /Georgia|serif/i.test(getComputedStyle(bt).fontFamily))); }), 'también los botones heredan la letra');
  await pg.reload(); await pg.waitForSelector('#fontPick'); ok(await pg.locator('#fontPick').inputValue() === 'editorial' && (await draft()).font === 'editorial', 'la letra elegida se recuerda al recargar');
  await pg.goto(U + '#bloques/tipografias'); await pg.waitForSelector('.font-card'); ok(await pg.locator('.font-card[data-id=editorial].on').count() === 1 && await pg.locator('#fontSummary:not([hidden])').count() === 1, 'la tarjeta en uso queda marcada y el resumen lo dice');
  await pg.locator('.font-card[data-id=editorial] [data-act=use-font]').click(); ok((await draft()).font === null, 'pulsar otra vez la quita');
  await pg.locator('.font-card[data-id=jakarta] [data-act=use-font]').click(); await pg.locator('[data-act=go][data-page=review]').first().click(); await pg.waitForSelector('#composeButton'); await pg.click('#composeButton'); await pg.waitForSelector('#resultActions', { state: 'visible' });
  const dl = pg.waitForEvent('download'); await pg.click('[data-act=export]'); const file = await dl; const html = require('node:fs').readFileSync(await file.path(), 'utf8');
  ok(/font-family:Jakarta,system-ui/.test(html), 'la exportación lleva la tipografía elegida');
  ok(errors.length === 0, 'sin errores de página: ' + errors.join('|'));
  await b.close(); console.log(n + ' comprobaciones de tipografías correctas.');
})().catch(e => { console.error(e); process.exit(1); });
