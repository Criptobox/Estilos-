/* Adaptar textos a la idea: motor puro + flujo en Tinta (aplicar, respetar ediciones, deshacer). */
const { chromium } = require('playwright'); const assert = require('node:assert/strict');
const T = require('../web/js/tinta-sectors.js'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
ok(T.detect('Mi cafetería con pedidos').id === 'comida' && T.detect('una tienda de ropa').id === 'tienda' && T.detect('Mis finanzas').id === 'finanzas', 'detecta sectores');
ok(T.detect('CLÍNICA y citas').id === 'salud' && T.detect('algo diferente') === null && T.detect('') === null, 'acentos, mayúsculas y sin sector');
ok(T.SECTORS.length === 8 && T.SECTORS.every(s => ['titles', 'actions', 'notes', 'highlights', 'numbers', 'texts', 'placeholders'].every(k => s[k].length >= (k === 'placeholders' ? 1 : 3))), 'cada sector tiene sus reservas de texto');
const out = T.fill('comida', [{ label: 'Título', value: 'Ingresos' }, { label: 'Destacado', value: '$24,380' }, { label: 'Acción', value: 'Ver' }, { label: 'Acción', value: 'Ver reporte' }, { label: 'Nota', value: '3' }, { label: 'Texto', value: '★' }]);
ok(out.length === 6 && out[0] && /\$|min|\d/.test(out[1]) && out[2] === null && out[3] && out[4] === null && out[5] === null, 'rellena títulos/números/acciones y conserva insignias, iconos y etiquetas cortas');
ok(T.fill('nada', []) === null, 'sector desconocido → null');
ok(T.SECTORS.every(s => T.fill(s.id, [{ label: 'Título', value: 'Un título medio' }, { label: 'Texto', value: 'Texto largo de ejemplo para el bloque' }]).every(v => typeof v === 'string' && v.length < 60)), 'los textos caben (sin desbordar)');
(async () => {
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 1280, height: 900 } }), errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://127.0.0.1:8080/crear.html'); await pg.click('[data-idea=comida]'); await pg.locator('#briefForm [type=submit]').click(); await pg.waitForSelector('.gallery-item');
  await pg.click('#reviewSelection'); await pg.waitForSelector('#review', { state: 'visible' });
  const st = () => pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1')).content || {});
  const preview = () => pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot.textContent.replace(/\\s+/g, ' ')).join('|'));
  const setIdea = v => pg.evaluate(v => { const e = document.getElementById('idea'); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  // «Ayúdame a empezar» ya trae textos del sector: aquí se parte de bloques sin editar para probar el botón «Adaptar textos».
  ok(Object.keys(await st()).length > 0, 'la propuesta llega con textos del sector');
  for (const id of Object.keys(await st())) { await pg.click(`[data-act=edit-text][data-id=${id}]`); await pg.click('[data-act=reset-text]'); }
  ok(Object.keys(await st()).length === 0, 'restaurar deja los bloques sin editar');
  const html0 = await preview();
  await pg.click('[data-act=adapt-text]');
  const content = Object.keys(await st()); ok(content.length > 0, 'guarda textos en los bloques elegidos');
  ok(!content.some(id => id.startsWith('n-')), 'no toca las barras de navegación');
  ok(/Adaptados|adaptados/.test(await pg.locator('#toast').textContent()) && /Comida y café/.test(await pg.locator('#toast').textContent()), 'avisa del sector');
  const html1 = await preview(); ok(html1 !== html0, 'la vista previa cambia');
  ok(Object.values(await st()).flat().every(t => typeof t === 'string' && !/[<>]/.test(t)), 'solo texto, sin HTML');
  const firstId = Object.keys(await st())[0]; await pg.click(`[data-act=edit-text][data-id=${firstId}]`); await pg.fill('#textFields textarea', 'Mío'); await pg.click('#textForm [type=submit]');
  const snapshot = JSON.stringify((await st())[firstId]); ok(JSON.parse(snapshot)[0] === 'Mío', 'edición manual guardada'); await pg.click('[data-act=adapt-text]');
  ok(JSON.stringify((await st())[firstId]) === snapshot, 'respeta lo editado a mano');
  ok(/respetan|nada que adaptar/.test(await pg.locator('#toast').textContent()), 'avisa de lo respetado');
  await pg.click(`[data-act=edit-text][data-id=${firstId}]`); await pg.click('[data-act=reset-text]'); for (const id of Object.keys(await st())) { await pg.click(`[data-act=edit-text][data-id=${id}]`); await pg.click('[data-act=reset-text]'); }
  ok(Object.keys(await st()).length === 0, 'restaurar deja el diseño original'); await setIdea('algo diferente'); await pg.click('[data-act=adapt-text]');
  ok(/No reconoc/.test(await pg.locator('#toast').textContent()) && Object.keys(await st()).length === 0, 'sin sector no cambia nada y lo explica');
  await setIdea('Mi cafetería'); await pg.click('[data-act=adapt-text]'); ok(Object.keys(await st()).length > 0, 'vuelve a adaptar');
  await pg.keyboard.press('Control+z'); ok(Object.keys(await st()).length === 0, 'se puede deshacer con Ctrl+Z');
  const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto('http://127.0.0.1:8080/crear.html'); await m.click('[data-idea=tienda]'); await m.locator('#briefForm [type=submit]').click(); await m.waitForSelector('.gallery-item'); await m.click('#reviewSelection');
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desbordamiento en móvil');
  ok(errors.length === 0, 'sin excepciones: ' + errors.join('|')); await b.close(); console.log(`${n} comprobaciones de adaptación de textos correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
