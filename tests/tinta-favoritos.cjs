/* Biblioteca única en Tinta: favoritos compartidos con la clásica, filtro, menú y redirección. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 390, height: 800 } }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message)); await pg.addInitScript(() => addEventListener('DOMContentLoaded', () => { const g = document.getElementById('gallery'); if (g) g.classList.add('all'); }));
  await pg.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('estilos-favs-v1', JSON.stringify(['tar-1', 'otro-id-clasico', '<script>'])); } });
  await pg.goto('http://127.0.0.1:8080/index.html'); await pg.click('[data-act=menu]');
  ok(!(await pg.locator('#siteMenu a[href="biblioteca.html"]').count()), 'el menú ya no lleva a la biblioteca antigua');
  await pg.click('#siteMenu [data-page=explore]'); await pg.waitForSelector('.lib-card'); await pg.click('.lib-all'); await pg.waitForSelector('.gallery-item'); ok(await pg.locator('#explore').isVisible(), '«Biblioteca de diseños» abre Los bloques sin salir de Tinta');
  ok(await pg.locator('#favCount').textContent() === '1', 'hereda los favoritos de la biblioteca clásica (tar-1 → lib-tar-1)');
  ok(await pg.locator('.gallery-item[data-id=lib-tar-1] .fav-button').getAttribute('aria-pressed') === 'true', 'tar-1 aparece marcado');
  await pg.locator('.gallery-item[data-id=lib-tar-3] .fav-button').click();
  ok(await pg.locator('#favCount').textContent() === '2' && await pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-favs-v1')).filter(x => x !== 'script').join(',')) === 'tar-1,tar-3,otro-id-clasico', 'guardar escribe el formato clásico y conserva ids que Tinta no conoce');
  await pg.click('#favToggle'); ok(await pg.locator('.gallery-item').count() === 2, 'el filtro muestra solo los favoritos');
  await pg.locator('.gallery-item[data-id=lib-tar-1] .fav-button').click(); ok(await pg.locator('.gallery-item').count() === 1, 'quitar uno lo retira de la lista filtrada');
  await pg.locator('.gallery-item .fav-button').click(); ok(await pg.locator('.gallery-item').count() === 0 && await pg.locator('#emptyGallery').isVisible(), 'sin favoritos muestra el estado vacío');
  await pg.click('#favToggle'); ok(await pg.locator('.gallery-item').count() > 100, 'quitar el filtro vuelve a mostrar todo');
  ok(await pg.locator('.gallery-item[data-id=lib-tar-3] .fav-button').getAttribute('aria-label').then(t => /Guardar en favoritos/.test(t)), 'etiqueta accesible coherente');
  await pg.locator('.gallery-item[data-id=lib-tar-3] .fav-button').focus(); await pg.keyboard.press('Enter'); ok(await pg.locator('#favCount').textContent() === '1', 'funciona con teclado');
  ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desbordamiento en móvil');
  await pg.goto('http://127.0.0.1:8080/biblioteca.html'); await pg.waitForURL(/index\.html#bloques$/); ok(await pg.locator('#explore').isVisible(), 'biblioteca.html lleva a Tinta');
  const sc = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, '../web/manifest.webmanifest'), 'utf8')).shortcuts; ok(sc.every(s => !/biblioteca\.html/.test(s.url)), 'los atajos de la app no apuntan a la biblioteca antigua');
  await pg.goto('http://127.0.0.1:8080/agente.html'); ok(await pg.locator('a[href="biblioteca.html"]').count() === 0, 'el Agente enlaza a la biblioteca de Tinta');
  ok(errors.length === 0, 'sin excepciones: ' + errors.join('|')); await b.close(); console.log(`${n} comprobaciones de biblioteca única y favoritos correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
