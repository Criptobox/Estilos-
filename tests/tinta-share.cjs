/* Compartir por enlace: codificación, copia, recepción como copia en Mis proyectos, enlaces inválidos y seguridad. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const T = require('../web/js/tinta-share.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
(async () => {
  const d = { brief: 'café', selected: ['lib-tar-1'], choices: { header: null, nav: null }, content: { 'lib-tar-1': ['Hola'] }, ui: {}, buttonStyles: {}, cardStyles: {}, assets: { 'lib-tar-1': 'data:image/png;base64,AAAA' } };
  const { code, compressed } = await T.encode(d); const back = await T.decode('#' + code);
  ok(compressed && /^t1=[A-Za-z0-9_-]+$/.test(code), 'codifica comprimido (#t1=…)');
  ok(back.brief === 'café' && back.selected[0] === 'lib-tar-1' && back.content['lib-tar-1'][0] === 'Hola', 'ida y vuelta sin pérdida');
  ok(Object.keys(back.assets).length === 0 && !code.includes('AAAA'), 'las imágenes subidas no viajan en el enlace');
  ok(T.isShareHash('#t1=abc') && !T.isShareHash('#p1=abc') && !T.isShareHash('#bloques/todo') && !T.isShareHash('#t1=a b'), 'solo reconoce enlaces de Tinta');
  let failed = 0; for (const bad of ['#t1=!!!', '#t1=AAAA', '#t0=bm8gZXMganNvbg']) { try { if ((await T.decode(bad)) === null) failed++; } catch (e) { failed++; } } ok(failed === 3, 'enlaces corruptos se rechazan (null o error), nunca se aceptan');
  const bomb = Buffer.from('x'.repeat(10)).toString('base64url'); ok((await T.decode('#t0=' + bomb).catch(() => 'err')) === 'err', 'JSON inválido se rechaza');

  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://127.0.0.1:8080/index.html'); await pg.click('[data-idea=comida]'); await pg.locator('#briefForm [type=submit]').click(); await pg.waitForSelector('#phoneContent *'); await pg.evaluate(() => { location.hash = '#bloques/todo'; }); await pg.waitForSelector('.gallery-item');
  await pg.click('#reviewSelection'); await pg.waitForSelector('#review', { state: 'visible' });
  await pg.click('[data-act=adapt-text]');
  await pg.click('[data-act=share-link]');
  const link = await pg.inputValue('#shareLink'); ok(/^http:\/\/127\.0\.0\.1:8080\/index\.html#t1=/.test(link), 'genera el enlace con la dirección actual');
  ok(await pg.evaluate(() => navigator.clipboard.readText()) === link, 'lo copia al portapapeles');
  ok(/No incluye imágenes/.test(await pg.locator('#shareNote').textContent()) && await pg.locator('#shareBox').isVisible(), 'avisa de que no incluye imágenes y muestra el enlace');
  const orig = await pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1')));

  const rx = await ctx.newPage(); await rx.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', '1'); localStorage.clear(); } });
  await rx.goto(link); await rx.waitForSelector('#projectsDialog[open]');
  ok(!(await rx.evaluate(() => location.hash)), 'limpia el # de la dirección tras importar');
  const projects = await rx.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-projects-v1')));
  ok(projects.length === 1 && /^Compartido · /.test(projects[0].name), 'se guarda como copia «Compartido · …» en Mis proyectos');
  ok(JSON.stringify(projects[0].draft.selected) === JSON.stringify(orig.selected) && JSON.stringify(projects[0].draft.content) === JSON.stringify(orig.content), 'conserva bloques y textos adaptados');
  ok(await rx.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1') || '{"selected":[]}').selected.length) === 0, 'no pisa el borrador de quien recibe el enlace');
  ok(/Copia guardada/.test(await rx.locator('#projectMessage').textContent()), 'confirma que se guardó');

  const bad = await ctx.newPage(); await bad.goto('http://127.0.0.1:8080/index.html#t1=AAAA'); await bad.waitForSelector('#toast.on');
  ok(/no es válido/.test(await bad.locator('#toast').textContent()) && await bad.locator('#home').isVisible() && !(await bad.evaluate(() => location.hash)), 'un enlace inválido avisa y deja la app usable');
  const evil = await T.encode({ brief: '<img src=x onerror=window.__pwn=1>', selected: ['bloque-que-no-existe'], choices: {}, content: {}, ui: {}, buttonStyles: {}, cardStyles: {} });
  const ev = await ctx.newPage(); await ev.goto('http://127.0.0.1:8080/index.html#' + evil.code); await ev.waitForSelector('#toast.on');
  ok(/no es válido/.test(await ev.locator('#toast').textContent()) && !(await ev.evaluate(() => window.__pwn)), 'bloques desconocidos se rechazan y no se ejecuta HTML');
  const xss = await T.encode({ brief: '<img src=x onerror=window.__pwn=1>', selected: ['lib-tar-1'], choices: { header: null, nav: null }, content: { 'lib-tar-1': ['<img src=x onerror=window.__pwn=1>'] }, ui: {}, buttonStyles: {}, cardStyles: {} });
  const xp = await ctx.newPage(); await xp.goto('http://127.0.0.1:8080/index.html#' + xss.code); await xp.waitForSelector('#projectsDialog[open]'); await xp.waitForTimeout(500);
  ok(!(await xp.evaluate(() => window.__pwn)) && !(await xp.locator('#projectsDialog img[src=x]').count()), 'el texto malicioso se muestra como texto, no se ejecuta');
  const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto('http://127.0.0.1:8080/index.html#pantalla'); await m.waitForTimeout(300);
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desbordamiento en móvil');
  ok(errors.length === 0, 'sin excepciones: ' + errors.join('|')); await b.close(); console.log(`${n} comprobaciones de compartir por enlace correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
