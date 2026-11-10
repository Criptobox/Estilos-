/* Editar bloques desde la vista previa: modo Probar/Editar, selección, barra flotante (texto, diseño, botón, animación, orden). */
const { chromium } = require('playwright'); const axe = require('axe-core'); const assert = require('node:assert/strict');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    const pg = await b.newPage({ viewport: vp }), errors = []; pg.on('pageerror', e => errors.push(e.message));
    const draft = () => pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1') || '{}'));
    const tag = vp.width < 500 ? 'móvil' : 'escritorio';
    await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.template-card'); await pg.click('.template-card[data-id=tpl-cafeteria] [data-act=use-template]'); await pg.waitForSelector('#screenTabs button'); await pg.waitForTimeout(400);
    ok(await pg.locator('#blockTools').isHidden() && await pg.getAttribute('[data-mode=play]', 'aria-pressed') === 'true', `${tag}: por defecto se prueba y no hay barra`);
    // En modo Probar tocar una tarjeta abre el detalle (no cambia)
    await pg.evaluate(() => document.querySelector('#phoneContent .component-host[data-role=cards]').shadowRoot.querySelector('article,div').click()); ok(await pg.$eval('#screenTabs [aria-pressed=true]', x => x.dataset.id) === 'detalle', `${tag}: en modo Probar la tarjeta sigue abriendo el detalle`);
    await pg.click('#screenTabs [data-id=inicio]'); await pg.click('[data-mode=edit]');
    ok(await pg.getAttribute('[data-mode=edit]', 'aria-pressed') === 'true' && await pg.$eval('#phoneContent', x => x.classList.contains('editing')), `${tag}: modo Editar activo`);
    await pg.evaluate(() => document.querySelector('#phoneContent .component-host[data-role=cards]').shadowRoot.querySelector('article,div').click());
    ok(await pg.$eval('#screenTabs [aria-pressed=true]', x => x.dataset.id) === 'inicio' && await pg.locator('#blockTools').isVisible() && await pg.locator('#phoneContent .component-host[data-sel]').count() >= 1, `${tag}: en modo Editar tocar un bloque lo selecciona, no navega`);
    const name = await pg.textContent('#blockTools .bt-name'); ok(name.length > 3, `${tag}: la barra muestra el nombre («${name}»)`);
    // Animación desde la barra
    await pg.click('[data-bt=motion]'); ok(await pg.locator('#motionPop button').count() >= 21, `${tag}: «Animar» lista las animaciones`);
    await pg.click('#motionPop [data-motion=scale]'); ok((await draft()).motion.entrance === 'scale' && await pg.getAttribute('#motionPop [data-motion=scale]', 'aria-pressed') === 'true', `${tag}: aplicar una animación la guarda y se marca`);
    await pg.click('#motionPop [data-motion=scale]'); ok(!(await draft()).motion.entrance, `${tag}: pulsarla otra vez la quita`);
    ok(await pg.locator('#blockTools').isVisible() && await pg.locator('#phoneContent .component-host[data-sel]').count() >= 1, `${tag}: la selección se conserva al animar`);
    // Texto
    await pg.click('[data-bt=text]'); ok(await pg.locator('#textDialog').isVisible(), `${tag}: «Texto» abre el editor de textos de ese bloque`); await pg.keyboard.press('Escape');
    // Diseño de tarjeta (si la tarjeta lo admite)
    const hasCard = await pg.locator('[data-bt=card]').isVisible(); if (hasCard) { await pg.click('[data-bt=card]'); ok(await pg.locator('#cardStyleDialog').isVisible(), `${tag}: «Diseño» abre el diseño de la tarjeta`); await pg.keyboard.press('Escape'); }
    // Mover: elegir una tarjeta con hermanas
    const before = (await draft()).selected.join(); await pg.evaluate(() => { const hs = [...document.querySelectorAll('#phoneContent .component-host[data-role=cards]')]; hs[hs.length - 1].shadowRoot.querySelector('article,div').click(); });
    if (await pg.locator('[data-bt=up]').isEnabled()) { await pg.click('[data-bt=up]'); ok((await draft()).selected.join() !== before, `${tag}: ↑ cambia el orden de los bloques`); }
    // Accesibilidad con la barra abierta
    await pg.addScriptTag({ content: axe.source }); const r = await pg.evaluate(async () => await axe.run({ include: [['#blockTools'], ['.edit-modes']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })); const bad = r.violations.filter(v => ['critical', 'serious'].includes(v.impact)); ok(bad.length === 0, `${tag}: barra accesible · ` + bad.map(v => v.id + ' ' + v.nodes.slice(0, 2).map(x => x.target.join(' ')).join('|')).join(';'));
    ok(await pg.evaluate(() => { const t = document.getElementById('blockTools').getBoundingClientRect(); return t.left >= 0 && t.right <= innerWidth + 1 && t.bottom <= innerHeight; }) && await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tag}: la barra cabe en pantalla`);
    await pg.click('[data-bt=close]'); ok(await pg.locator('#blockTools').isHidden(), `${tag}: ✕ deja de editar el bloque`);
    await pg.click('[data-mode=play]'); ok(await pg.locator('#blockTools').isHidden() && !(await pg.$eval('#phoneContent', x => x.classList.contains('editing'))), `${tag}: volver a Probar oculta la barra`);
    ok(!errors.length, `${tag}: sin errores: ` + errors.join(' | ')); await pg.close();
  }
  await b.close(); console.log(`${n} comprobaciones de edición de bloques correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
