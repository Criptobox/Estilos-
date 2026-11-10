/* Diseño «estudio» en móvil (390 px): barra superior de una línea, barra inferior fija, mosaico de la biblioteca,
   el lienzo antes que la lista en «Tu pantalla», sin desbordes, y accesibilidad WCAG AA en claro y oscuro. */
const { chromium } = require('playwright'); const axe = require('axe-core'); const assert = require('node:assert/strict');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const EXCLUDE = [['#phoneContent'], ['#phoneNav'], ['.template-frame'], ['.gallery-item .component-host'], ['.detail-stage'], ['.component-host']];
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }), errors = []; pg.on('pageerror', e => errors.push(e.message));
    await pg.addInitScript(t => localStorage.setItem('estilos-tinta-ui-theme-v1', t), theme);
    const scan = async name => { await pg.addScriptTag({ content: axe.source }); const r = await pg.evaluate(async e => await axe.run({ exclude: e }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }), EXCLUDE); const bad = r.violations.filter(v => ['critical', 'serious'].includes(v.impact)); ok(bad.length === 0, `${theme} · ${name}: accesible · ` + bad.map(v => v.id + ' ' + v.nodes.slice(0, 2).map(x => x.target.join(' ').slice(0, 50)).join(' | ')).join('; ')); };
    const noOverflow = async name => ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme} · ${name}: sin desborde horizontal`);
    await pg.goto('http://127.0.0.1:8080/index.html'); await pg.waitForTimeout(300);
    const bar = await pg.evaluate(() => { const nav = document.querySelector('.site-header>nav'), r = nav.getBoundingClientRect(), cs = getComputedStyle(nav); return { fixed: cs.position === 'fixed', bottom: innerHeight - r.bottom, tabs: [...nav.querySelectorAll('button')].filter(x => x.getClientRects().length).map(x => x.textContent.replace(/\d+/g, '').trim()) }; });
    ok(bar.fixed && bar.bottom >= 0 && bar.bottom < 30 && bar.tabs.join() === 'Tu idea,Los bloques,Tu pantalla,Proyectos', 'barra inferior fija con 4 destinos');
    ok(await pg.evaluate(() => document.querySelector('.site-header').getBoundingClientRect().height <= 64 && document.getElementById('undoDraft').getBoundingClientRect().top < 60), 'barra superior de una línea con deshacer/rehacer dentro');
    ok(await pg.evaluate(() => document.getElementById('briefForm').getBoundingClientRect().bottom < innerHeight), 'el cuadro de la idea y su botón caben en la primera pantalla');
    await noOverflow('Tu idea'); await scan('Tu idea');
    await pg.click('.site-header>nav [data-page=explore]'); await pg.waitForSelector('.gallery-item');
    ok(await pg.locator('.bento .tile').count() === 5 && await pg.evaluate(() => getComputedStyle(document.querySelector('.selection-tray')).display === 'none'), 'mosaico de 5 secciones y bandeja oculta mientras no hay selección');
    ok(await pg.evaluate(() => { const g = getComputedStyle(document.getElementById('gallery')).gridTemplateColumns.split(' ').length; return g === 2; }), 'galería en dos columnas');
    await pg.click('.bento [data-jump=palTitle]'); await pg.waitForTimeout(700); ok(await pg.evaluate(() => { const r = document.getElementById('palTitle').getBoundingClientRect(); return r.top >= -5 && r.top < innerHeight * .6; }), 'el mosaico salta a su sección');
    await pg.click('.bento [data-jump-filter=cards]', { force: true }).catch(async () => { await pg.evaluate(() => document.querySelector('.bento [data-jump-filter=cards]').click()); }); await pg.waitForTimeout(300);
    ok(await pg.evaluate(() => document.querySelector('[data-act=filter][data-filter=cards]').getAttribute('aria-pressed') === 'true'), '«Tarjetas» del mosaico aplica el filtro');
    await pg.evaluate(() => document.querySelector('.gallery-item [data-act=select]').click()); ok(await pg.evaluate(() => { const t = document.querySelector('.selection-tray'), r = t.getBoundingClientRect(), nav = document.querySelector('.site-header>nav').getBoundingClientRect(); return getComputedStyle(t).display !== 'none' && r.bottom <= nav.top + 1; }), 'con selección, la bandeja aparece encima de la barra inferior');
    await noOverflow('Los bloques'); await scan('Los bloques');
    await pg.evaluate(() => scrollTo(0, 0)); await pg.evaluate(() => document.querySelector('.template-card[data-id=tpl-cafeteria] [data-act=use-template]').click()); await pg.waitForSelector('#review', { state: 'visible' }); await pg.waitForTimeout(5000);
    ok(await pg.evaluate(() => { const c = document.querySelector('.composition-area').getBoundingClientRect(), p = document.querySelector('.review-panel').getBoundingClientRect(); return c.top < p.top && c.top + scrollY < 260; }), 'en «Tu pantalla» el lienzo con el móvil va primero');
    await noOverflow('Tu pantalla'); await scan('Tu pantalla');
    ok(!errors.length, 'sin errores: ' + errors.join(' | ')); await pg.close();
  }
  // En escritorio la navegación sigue arriba
  const d = await b.newPage({ viewport: { width: 1280, height: 900 } }); await d.goto('http://127.0.0.1:8080/index.html');
  ok(await d.evaluate(() => getComputedStyle(document.querySelector('.site-header>nav')).position !== 'fixed' && getComputedStyle(document.querySelector('.tab-extra')).display === 'none'), 'en escritorio no cambia la navegación');
  await b.close(); console.log(`${n} comprobaciones del diseño estudio correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
