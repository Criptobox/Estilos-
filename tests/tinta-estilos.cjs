/* Más estilos: estilos de tarjeta de un toque, colores y formas de botón, y 48 paletas (38 claras y 10 oscuras). */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const PR = require('../web/js/tinta-presets.js'), PA = require('../web/js/tinta-palettes.js'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const HEX = /^#[0-9a-f]{6}$/i;
ok(PR.CARD_PRESETS.length === 12 && new Set(PR.CARD_PRESETS.map(p => p.id)).size === 12, 'hay 12 estilos de tarjeta con id único');
ok(PR.CARD_PRESETS.every(p => ['solid', 'gradient'].includes(p.v.format) && ['original', 'custom'].includes(p.v.textMode) && ['none', 'soft', 'raised'].includes(p.v.shadow) && ['background', 'secondary', 'foreground', 'borderColor'].every(k => HEX.test(p.v[k])) && p.v.radius >= 0 && p.v.radius <= 48 && p.v.padding >= 0 && p.v.padding <= 32 && p.v.borderWidth >= 0 && p.v.borderWidth <= 8 && p.v.angle >= 0 && p.v.angle <= 360), 'todos respetan los rangos del inspector (sin CSS libre)');
ok(PR.CARD_PRESETS.filter(p => p.v.textMode === 'custom').every(p => PA.contrast(p.v.foreground, p.v.format === 'gradient' ? p.v.background : p.v.background) >= 4.5 && (p.v.format !== 'gradient' || PA.contrast(p.v.foreground, p.v.secondary) >= 4.5)), 'los estilos con texto propio tienen contraste suficiente con su fondo');
ok(PR.CARD_PRESETS.filter(p => p.v.textMode === 'original').every(p => PA.contrast('#242421', p.v.background) >= 7), 'los estilos claros conservan texto oscuro legible (≥ 7:1)');
ok(PR.BUTTON_COLORS.length === 13 && PR.BUTTON_COLORS.every(([, c]) => HEX.test(c) && PA.contrast(c, '#ffffff') >= 4.5), '13 colores de botón, todos con texto blanco ≥ 4.5:1');
ok(PA.LIST.length === 48 && new Set(PA.LIST.map(p => p.id)).size === 48 && PA.LIST.every(PA.valid) && PA.LIST.every(p => PA.contrast(p.ink, p.surface) >= 7 && PA.contrast(p.ink, p.bg) >= 7 && PA.contrast(p.accent, PA.onAccent(p.accent)) >= 4.5), '48 paletas legibles (AAA en texto, AA en botón)');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  const draft = () => pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1')));
  await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.template-card');
  ok(await pg.locator('.palette-card').count() === 48, 'la biblioteca muestra las 48 paletas');
  await pg.click('.template-card[data-id=tpl-tienda] [data-act=use-template]'); await pg.waitForSelector('#review', { state: 'visible' });
  const cardId = await pg.evaluate(() => document.querySelector('[data-act=card-style]').dataset.id);
  await pg.click(`[data-act=card-style][data-id=${cardId}]`); await pg.waitForSelector('#cardStyleDialog[open]');
  ok(await pg.locator('#cardPresets button').count() === 12, 'el diálogo de tarjeta ofrece los 12 estilos listos');
  for (const id of ['grafito', 'coral', 'contorno']) {
    await pg.click(`#cardPresets [data-id=${id}]`); const p = PR.getCard(id).v;
    ok(await pg.locator('#cardStyleFormat').inputValue() === p.format && await pg.locator('#cardStyleRadius').inputValue() === String(p.radius) && await pg.locator('#cardStyleBackground').inputValue().then(v => v.toLowerCase() === p.background) && await pg.locator(`#cardPresets [data-id=${id}]`).getAttribute('aria-pressed') === 'true', `«${id}» rellena el formulario y se marca como activo`);
  }
  await pg.click('#cardPresets [data-id=oceano]'); await pg.click('[data-act=apply-card-style]'); await pg.waitForSelector('#cardStyleDialog', { state: 'hidden' });
  const st = (await draft()).cardStyles[cardId]; ok(st && st.format === 'gradient' && st.background.toLowerCase() === '#0b5f78' && st.textMode === 'custom', 'aplicar guarda el estilo «Océano» en el borrador (validado)');
  ok(await pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].some(h => /linear-gradient/.test(h.shadowRoot.innerHTML))), 'la pantalla muestra la tarjeta con degradado');
  await pg.keyboard.press('Control+z'); ok(!((await draft()).cardStyles[cardId]), 'Ctrl+Z deshace el estilo de tarjeta');
  // Botones: colores y formas
  const btnId = await pg.evaluate(() => document.querySelector('[data-act=button-style]').dataset.id); await pg.click(`[data-act=button-style][data-id=${btnId}]`); await pg.waitForSelector('#buttonStyleDialog[open]');
  ok(await pg.locator('[data-act=style-preset]').count() === 13 && await pg.locator('[data-act=style-format]').count() === 4, 'el diálogo de botón ofrece 13 colores y 4 formas');
  await pg.click('[data-act=style-preset][data-color="#0e7490"]'); await pg.click('[data-act=style-format][data-format=outline]');
  ok(await pg.locator('#styleFormat').inputValue() === 'outline' && (await pg.locator('#styleForeground').inputValue()).toLowerCase() === '#0e7490', 'la forma «Contorno» usa el color elegido también para el texto (legible)');
  await pg.click('[data-act=style-format][data-format=gradient]'); ok((await pg.locator('#styleForeground').inputValue()).toLowerCase() === '#ffffff' && await pg.locator('#styleFormat').inputValue() === 'gradient', 'la forma «Degradado» vuelve al texto blanco');
  await pg.click('[data-act=apply-button-style]'); await pg.waitForSelector('#buttonStyleDialog', { state: 'hidden' }); const bs = (await draft()).buttonStyles[btnId]; ok(bs && bs.format === 'gradient' && bs.background.toLowerCase() === '#0e7490', 'aplicar guarda el estilo del botón');
  // Paletas nuevas
  await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.palette-card');
  for (const id of ['mostaza', 'lima', 'pizarra']) { await pg.click(`.palette-card[data-id=${id}] [data-act=use-palette]`); ok((await draft()).palette === id, `la paleta «${id}» se aplica`); }
  const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto('http://127.0.0.1:8080/index.html#pantalla'); await m.waitForTimeout(300); ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desbordamiento en móvil');
  const mm = await b.newPage({ viewport: { width: 390, height: 800 } }); await mm.goto('http://127.0.0.1:8080/index.html#bloques'); await mm.waitForSelector('.template-card'); await mm.click('.template-card[data-id=tpl-viajes] [data-act=use-template]'); await mm.waitForSelector('#review', { state: 'visible' }); await mm.click('[data-act=card-style]'); await mm.waitForSelector('#cardStyleDialog[open]'); ok(await mm.evaluate(() => { const r = document.getElementById('cardStyleDialog').getBoundingClientRect(); return document.documentElement.scrollWidth <= innerWidth && r.left >= 0 && r.right <= innerWidth; }), 'el diálogo con estilos cabe en móvil');
  ok(errors.length === 0, 'sin excepciones: ' + errors.join('|')); await b.close(); console.log(`${n} comprobaciones de estilos correctas.`);
})().catch(e => { console.error(e.message); process.exit(1); });
