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
    await pg.click('.site-header>nav [data-page=explore]'); await pg.waitForSelector('.lib-card');
    ok(await pg.locator('.lib-card').count() >= 15 && await pg.evaluate(() => getComputedStyle(document.querySelector('.selection-tray')).display === 'none'), 'la biblioteca abre con sus categorías y la bandeja oculta mientras no hay selección');
    await pg.click('.lib-card[data-cat=paletas]'); await pg.waitForSelector('.palette-card:not([hidden])'); ok(await pg.evaluate(() => document.getElementById('explore').dataset.kind === 'palettes' && document.querySelectorAll('.palette-card:not([hidden])').length === 48), 'una categoría muestra solo lo suyo (48 paletas)');
    await pg.click('.lib-back'); await pg.click('.lib-card[data-cat=tarjetas]'); await pg.waitForSelector('.gallery-item'); ok(await pg.evaluate(() => [...document.querySelectorAll('.gallery-item')].every(g => /Tarjetas/.test(g.querySelector('.role-tag').textContent))), 'Tarjetas solo enseña tarjetas');
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.waitForSelector('.gallery-item');
    ok(await pg.evaluate(() => getComputedStyle(document.getElementById('gallery')).gridTemplateColumns.split(' ').length === 2), 'galería en dos columnas');
    await pg.evaluate(() => document.querySelector('.gallery-item [data-act=select]').click()); ok(await pg.evaluate(() => { const t = document.querySelector('.selection-tray'), r = t.getBoundingClientRect(), nav = document.querySelector('.site-header>nav').getBoundingClientRect(); return getComputedStyle(t).display !== 'none' && r.bottom <= nav.top + 1; }), 'con selección, la bandeja aparece encima de la barra inferior');
    const vis = () => pg.evaluate(() => [...document.querySelectorAll('.gallery-item')].filter(x => x.getClientRects().length).length);
    await pg.evaluate(() => document.querySelector('[data-act=filter][data-filter=all]').click()); const total = await pg.locator('.gallery-item').count();
    ok(total > 100 && await vis() === 24 && await pg.locator('#galleryMore').isVisible(), 'la galería enseña 24 diseños y el botón «Ver todos»');
    await pg.evaluate(() => document.getElementById('galleryMore').click()); ok(await vis() === total && await pg.getAttribute('#galleryMore', 'aria-expanded') === 'true', '«Ver todos» despliega la galería completa');
    await pg.evaluate(() => document.getElementById('galleryMore').click()); ok(await vis() === 24, '«Ver menos» la recoge');
    await noOverflow('Los bloques'); await scan('Los bloques');
    await pg.evaluate(() => scrollTo(0, 0)); await pg.evaluate(() => document.querySelector('.template-card[data-id=tpl-cafeteria] [data-act=use-template]').click()); await pg.waitForSelector('#review', { state: 'visible' }); await pg.waitForTimeout(5000);
    ok(await pg.evaluate(() => { const c = document.querySelector('.composition-area').getBoundingClientRect(), p = document.querySelector('.review-panel').getBoundingClientRect(); return c.top < p.top && c.top + scrollY < 260; }), 'en «Tu pantalla» el lienzo con el móvil va primero');
    ok(await pg.evaluate(() => { const bs = [...document.querySelectorAll('#screenTabs > button')]; return bs.length === 11 && bs.every(b => { const t = b.querySelector('.tab-thumb'); return t && t.getAttribute('aria-hidden') === 'true' && t.inert && t.getBoundingClientRect().width > 40 && b.textContent.trim().length > 2; }); }), 'cada pantalla tiene su miniatura (decorativa) y su nombre');
    await pg.evaluate(() => document.querySelector('#screenTabs > [data-id=chat]').click()); await pg.waitForTimeout(200); ok(await pg.evaluate(() => { const t = document.getElementById('screenTabs'), c = t.querySelector('[aria-pressed=true]'); const r = c.getBoundingClientRect(), tr = t.getBoundingClientRect(); return c.dataset.id === 'chat' && r.left >= tr.left - 1 && r.right <= tr.right + 1; }), 'la tira se desplaza hasta la pantalla elegida');
    await noOverflow('Tu pantalla'); await scan('Tu pantalla');
    ok(!errors.length, 'sin errores: ' + errors.join(' | ')); await pg.close();
  }
  // En escritorio la navegación sigue arriba
  const d = await b.newPage({ viewport: { width: 1280, height: 900 } }); await d.goto('http://127.0.0.1:8080/index.html');
  ok(await d.evaluate(() => getComputedStyle(document.querySelector('.site-header>nav')).position !== 'fixed' && getComputedStyle(document.querySelector('.tab-extra')).display === 'none'), 'en escritorio no cambia la navegación');
  await b.close(); console.log(`${n} comprobaciones del diseño estudio correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
