/* Biblioteca organizada: categorías y subcategorías por tipo; cada bloque en una sola; rutas, búsqueda y accesibilidad. */
const { chromium } = require('playwright'); const axe = require('axe-core'); const assert = require('node:assert/strict');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const T = require('../web/js/tinta-taxonomy.js'), P = require('../web/js/tinta-palettes.js');
ok(T.CATEGORIES.length === 16 && new Set(T.CATEGORIES.map(c => c.id)).size === 16, 'hay 16 categorías con id único');
ok(T.CATEGORIES.filter(c => c.roles).every(c => c.subs.length >= 2 && c.subs.every(s => s.ids.length >= 1)) && T.CATEGORIES.filter(c => c.roles).every(c => new Set(c.subs.flatMap(s => s.ids)).size === c.subs.flatMap(s => s.ids).length), 'las categorías de bloques tienen subcategorías con bloques y ningún bloque en dos');
ok(T.parseRoute('#bloques').view === 'hub' && T.parseRoute('#bloques/todo').view === 'todo' && T.parseRoute('#bloques/tarjetas/viajes').sub === 'viajes' && T.parseRoute('#bloques/nada').view === 'hub' && T.parseRoute('#pantalla').page === 'review', 'las rutas se interpretan bien (y las inválidas vuelven al inicio)');
ok(T.PALETTE_SUBS.every(s => P.LIST.some(p => T.paletteMatch(p, s.id))) && P.LIST.every(p => ['neutros', 'rojos', 'verdes', 'azules', 'violetas'].includes(T.paletteFamily(p))), 'todas las familias de paletas tienen paletas y cada paleta tiene familia');
const EXCLUDE = [['.gallery-item .component-host'], ['.template-frame'], ['.component-host']];
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }), errors = []; pg.on('pageerror', e => errors.push(e.message)); await pg.addInitScript(t => localStorage.setItem('estilos-tinta-ui-theme-v1', t), theme);
    const scan = async name => { await pg.addScriptTag({ content: axe.source }); const r = await pg.evaluate(async e => await axe.run({ exclude: e }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }), EXCLUDE); const bad = r.violations.filter(v => ['critical', 'serious'].includes(v.impact)); ok(bad.length === 0, `${theme} · ${name}: accesible · ` + bad.map(v => v.id + ' ' + v.nodes.slice(0, 2).map(x => x.target.join(' ').slice(0, 50)).join('|')).join('; ')); };
    const view = () => pg.evaluate(() => document.getElementById('explore').dataset.view + '/' + document.getElementById('explore').dataset.kind);
    await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.lib-card');
    ok(await pg.locator('.lib-card').count() === 17 && await view() === 'hub/' && await pg.locator('.gallery-item').count() === 0, `${theme}: el inicio muestra 16 categorías y «Todo el catálogo», sin la lista de bloques`);
    ok(await pg.evaluate(() => [...document.querySelectorAll('.lib-card:not(.lib-all) .lc-count')].every(c => /\d+ (diseños|favoritos)/.test(c.textContent))), `${theme}: cada categoría dice cuántos diseños tiene`);
    ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme}: el inicio no desborda`); await scan('inicio');
    // Cada bloque está en una categoría; los conteos del inicio cuadran con lo que muestra cada una
    let total = 0; const cats = await pg.$$eval('.lib-card:not(.lib-all)', cs => cs.map(c => c.dataset.cat));
    for (const c of cats.filter(c => !['plantillas', 'paletas', 'guardados', 'animaciones', 'estilos'].includes(c))) { await pg.goto('http://127.0.0.1:8080/index.html#bloques/' + c); await pg.waitForSelector('.lib-subs a'); const shown = await pg.locator('.gallery-item').count(); const chip = +(await pg.textContent('.lib-subs a[aria-current=page] span')); ok(shown === chip && shown > 0, `${theme} · ${c}: «Todo» (${chip}) coincide con lo que se ve (${shown})`); total += shown; }
    ok(total + 6 === 241, `${theme}: las categorías de bloques (+6 microinteracciones) suman los 241 diseños, ninguno sin clasificar (${total + 6})`);
    // Subcategorías: filtran y el número del chip coincide
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/barras'); await pg.waitForSelector('.lib-subs a'); const subs = await pg.$$eval('.lib-subs a:not([aria-current])', a => a.map(x => [x.getAttribute('href'), +x.querySelector('span').textContent]));
    for (const [href, cnt] of subs) { await pg.goto('http://127.0.0.1:8080/index.html' + href); await pg.waitForSelector('.gallery-item'); ok(await pg.locator('.gallery-item').count() === cnt, `${theme}: ${href} muestra ${cnt}`); }
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/barras/flotantes'); await pg.waitForSelector('.gallery-item'); ok(await pg.evaluate(() => [...document.querySelectorAll('.gallery-item')].every(g => /Barra inferior/.test(g.querySelector('.role-tag').textContent))), `${theme}: Barras solo enseña barras`);
    ok(await view() === 'cat/block' && await pg.evaluate(() => !document.querySelector('.templates').offsetParent && !document.querySelector('.palettes').offsetParent && !document.querySelector('.explore-toolbar').offsetParent), `${theme}: una categoría oculta plantillas, paletas y filtros generales`);
    await scan('barras');
    // Atrás vuelve a las categorías; navegar con el botón del navegador también
    await pg.click('.lib-back'); await pg.waitForSelector('.lib-card'); ok(await view() === 'hub/', `${theme}: «← Categorías» vuelve al inicio`);
    await pg.goBack(); await pg.waitForSelector('.lib-subs a'); ok((await view()).startsWith('cat/'), `${theme}: el botón Atrás del navegador vuelve a la categoría`);
    // Especiales
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/paletas/oscuras'); await pg.waitForSelector('.palette-card:not([hidden])'); ok(await pg.locator('.palette-card:not([hidden])').count() === 19 && await view() === 'cat/palettes', `${theme}: Paletas › Oscuras muestra las 19 oscuras`);
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/paletas/verdes'); await pg.waitForSelector('.palette-card:not([hidden])'); ok(await pg.locator('.palette-card:not([hidden])').count() === 8, `${theme}: Paletas › Verdes muestra 8`);
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/animaciones/card'); await pg.waitForSelector('.motion-card:not([hidden])'); ok(await pg.locator('.motion-card:not([hidden])').count() === 5 && await pg.locator('.gallery-item').count() === 0, `${theme}: Animaciones › Tarjetas muestra las 5 de tarjeta`);
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/animaciones/micro'); await pg.waitForSelector('.gallery-item'); ok(await pg.locator('.gallery-item').count() === 6 && await pg.locator('.motion-card:not([hidden])').count() === 0 || !(await pg.locator('.motions').isVisible()), `${theme}: Animaciones › Microinteracciones muestra sus 6 bloques`);
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/plantillas'); await pg.waitForSelector('.template-card:not([hidden])'); ok(await pg.locator('.template-card:not([hidden])').count() === 26, `${theme}: Plantillas muestra las 26`);
    // Búsqueda dentro de una categoría y global
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/tarjetas'); await pg.waitForSelector('.gallery-item'); await pg.fill('#libSearch', 'destino'); ok(await pg.locator('.gallery-item').count() >= 1 && await pg.locator('.gallery-item').count() < 33, `${theme}: buscar dentro de Tarjetas filtra`); 
    await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.lib-card'); await pg.fill('#libHubSearch', 'robot'); await pg.waitForSelector('.gallery-item'); ok(await view() === 'todo/todo' && await pg.locator('.gallery-item').count() >= 2, `${theme}: la búsqueda global abre «Todo» con resultados`);
    // Elegir un bloque, ver la bandeja y que «Seguir eligiendo» recuerde la categoría
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/botones'); await pg.waitForSelector('.gallery-item'); await pg.evaluate(() => document.querySelector('.gallery-item [data-act=select]').click()); await pg.click('#reviewSelection'); await pg.waitForSelector('#review', { state: 'visible' }); await pg.evaluate(() => document.querySelector('#review .page-heading [data-page=explore]').click()); await pg.waitForSelector('.lib-subs a'); ok(/#bloques\/botones$/.test(await pg.evaluate(() => location.hash)), `${theme}: «Seguir eligiendo» vuelve a la categoría donde estabas`);
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/guardados/elegidos'); await pg.waitForSelector('.gallery-item'); ok(await pg.locator('.gallery-item').count() === 1, `${theme}: Favoritos y recientes › Elegidos muestra lo elegido`);
    await scan('guardados');
    ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme}: sin desborde horizontal`);
    ok(!errors.length, `${theme}: sin errores: ` + errors.join(' | ')); await pg.close();
  }
  await b.close(); console.log(`${n} comprobaciones de categorías correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
