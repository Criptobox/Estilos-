/* Animaciones: datos, biblioteca, vista previa, exportación, historial, enlace y «reducir movimiento». */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const M = require('../web/js/tinta-motion.js'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
ok(M.LIST.length === 21 && new Set(M.LIST.map(m => m.id)).size === 21 && M.LIST.every(m => M.KINDS[m.kind]), 'hay 21 animaciones con id único y tipo válido');
ok(M.LIST.filter(m => m.kind === 'entrance').length === 12 && M.LIST.filter(m => m.kind === 'card').length === 5 && M.LIST.filter(m => m.kind === 'action').length === 4, '12 de entrada, 5 de tarjeta y 4 de botón');
ok(M.LIST.filter(m => m.kind === 'entrance').every(m => M.CSS.includes('data-m-entrance=' + m.id + ']') && M.CSS.includes('@keyframes tm-' + m.id)), 'cada entrada tiene su regla y sus keyframes');
ok(/prefers-reduced-motion:reduce/.test(M.CSS), 'el CSS respeta «reducir movimiento»');
ok(JSON.stringify(M.normalize({ entrance: 'fade-up', card: 'fade-up', action: 'nada', x: 1 })) === '{"entrance":"fade-up"}' && JSON.stringify(M.normalize(null)) === '{}' && JSON.stringify(M.normalize([1])) === '{}', 'normalize descarta ids de otro tipo, desconocidos y formas raras');
ok(M.attrs({ entrance: 'pop', card: 'lift', action: 'pulse' }, 'cards', 3)['data-m-card'] === 'lift' && !M.attrs({ card: 'lift' }, 'actions', 0)['data-m-card'] && M.attrs({ action: 'pulse' }, 'actions', 0)['data-m-action'] === 'pulse' && M.attrs({ entrance: 'fade' }, 'nav', 20).style === '--i:12', 'atributos por rol y cascada acotada');
const as = M.attrString({ 'data-m-entrance': 'a"><script>', style: '--i:1' }); ok(!/[<>']/.test(as) && (as.match(/"/g) || []).length === 4, 'attrString no deja escapar HTML ni comillas');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  const draft = () => pg.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-prototype-v1')));
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.waitForSelector('.motion-card');
  ok(await pg.locator('.motion-card').count() === 21, 'la biblioteca muestra las 21 animaciones');
  ok(await pg.evaluate(() => [...document.querySelectorAll('.motion-box')].every(e => getComputedStyle(e, e.dataset.mAction === 'shine' ? '::after' : null).animationName !== 'none')), 'las 21 demos se mueven en vivo');
  await pg.click('.template-card[data-id=tpl-cafeteria] [data-act=use-template]'); await pg.waitForSelector('#review', { state: 'visible' });
  await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.waitForSelector('.motion-card');
  await pg.click('.motion-card[data-id=fade-up] [data-act=use-motion]'); await pg.click('.motion-card[data-id=lift] [data-act=use-motion]'); await pg.click('.motion-card[data-id=pulse] [data-act=use-motion]');
  ok(JSON.stringify((await draft()).motion) === '{"entrance":"fade-up","card":"lift","action":"pulse"}', 'guarda una animación de cada tipo en el borrador');
  ok(await pg.locator('.motion-card[data-id=fade-up] button').getAttribute('aria-pressed') === 'true', 'el botón indica «En uso»');
  await pg.click('.motion-card[data-id=pop] [data-act=use-motion]'); ok((await draft()).motion.entrance === 'pop' && await pg.locator('.motion-card[data-id=fade-up] button').getAttribute('aria-pressed') === 'false', 'elegir otra entrada sustituye a la anterior');
  await pg.keyboard.press('Control+z'); ok((await draft()).motion.entrance === 'fade-up' && await pg.locator('.motion-card[data-id=fade-up] button').getAttribute('aria-pressed') === 'true', 'Ctrl+Z deshace el cambio de animación y la biblioteca lo refleja');
  await pg.goto('http://127.0.0.1:8080/index.html#pantalla'); await pg.waitForSelector('#phoneContent .component-host');
  const info = await pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host,#phoneNav .component-host')].map(h => ({ e: h.getAttribute('data-m-entrance'), c: h.getAttribute('data-m-card'), a: h.getAttribute('data-m-action'), i: h.style.getPropertyValue('--i'), an: getComputedStyle(h).animationName })));
  ok(info.every(x => x.e === 'fade-up' && x.an.includes('tm-fade-up')), 'todos los bloques entran con la animación elegida');
  ok(info.map(x => +x.i).every((v, i, arr) => i === 0 || v > arr[i - 1]), 'la cascada escalona los bloques');
  ok(info.filter(x => x.c).length >= 1 && info.filter(x => x.a).length === 1, 'elevar solo en tarjetas y pulso solo en el botón principal');
  ok(/Animaciones: /.test(await pg.locator('#motionSummary').textContent()), 'el resumen lista las animaciones activas');
  // Cada animación se aplica de verdad en el navegador.
  const base = await draft(); const apply = async m => { await pg.evaluate(([d, mo]) => { d.motion = mo; localStorage.setItem('estilos-tinta-prototype-v1', JSON.stringify(d)); }, [base, m]); await pg.reload(); await pg.waitForSelector('#phoneContent .component-host'); };
  const names = async sel => pg.evaluate(sel => [...document.querySelectorAll(sel)].map(h => getComputedStyle(h).animationName), '#phoneContent .component-host');
  for (const m of M.LIST.filter(x => x.kind === 'entrance')) { await apply({ entrance: m.id }); const an = await names(); ok(an.every(x => x.includes('tm-' + m.id)), `entrada «${m.name}» aplicada (tm-${m.id})`); }
  for (const m of M.LIST.filter(x => x.kind === 'action' && x.id !== 'shine')) { await apply({ action: m.id }); ok((await pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host[data-m-action]')].map(h => getComputedStyle(h).animationName))).some(x => x.includes('tm-' + m.id)), `botón «${m.name}» aplicado`); }
  await apply({ action: 'shine' }); ok(await pg.evaluate(() => { const h = document.querySelector('#phoneContent .component-host[data-m-action=shine]'); return getComputedStyle(h, '::after').animationName.includes('tm-shine') && getComputedStyle(h).overflow === 'hidden'; }), 'botón «Destello»: el brillo recorre el botón sin salirse');
  await apply({ card: 'float' }); ok((await pg.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host[data-m-card]')].map(h => getComputedStyle(h).animationName))).every(x => x.includes('tm-float')), 'tarjetas «Flotar» en bucle');
  for (const id of ['tilt', 'press', 'glow']) { await apply({ card: id }); const host = pg.locator('#phoneContent .component-host[data-m-card]').first(); await host.scrollIntoViewIfNeeded(); const t0 = await host.evaluate(h => getComputedStyle(h).transform + '|' + getComputedStyle(h).filter); await host.hover(); await pg.waitForTimeout(400); const t1 = await host.evaluate(h => getComputedStyle(h).transform + '|' + getComputedStyle(h).filter); ok(t0 !== t1, `tarjeta «${M.get(id).name}»: cambia al pasar el cursor`); }
  await apply({ entrance: 'fade-up', card: 'lift', action: 'pulse' });

  await pg.click('#composeButton'); const dl = pg.waitForEvent('download'); await pg.click('[data-act=export]'); const file = path.join(os.tmpdir(), 'mo-' + Date.now() + '.html'); await (await dl).saveAs(file);
  const html = fs.readFileSync(file, 'utf8'); fs.unlinkSync(file);
  ok(html.includes('@keyframes tm-fade-up') && /<estilos-block data-m-entrance="fade-up" style="--i:0"/.test(html) && html.includes('prefers-reduced-motion:reduce') && html.includes('data-m-action="pulse"'), 'la exportación incluye keyframes, atributos y «reducir movimiento»');
  const senderDraft = await draft(); await pg.click('[data-act=share-link]'); const link = await pg.inputValue('#shareLink');
  const rx = await ctx.newPage(); await rx.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', '1'); localStorage.clear(); } }); await rx.goto(link); await rx.waitForSelector('#projectsDialog[open]'); await rx.waitForTimeout(300);
  ok(Object.keys(await rx.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-projects-v1'))[0].draft.motion)).length >= 1, 'el enlace compartido conserva las animaciones');
  const rm = await b.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } }), rp = await rm.newPage(); await rp.addInitScript(d => localStorage.setItem('estilos-tinta-prototype-v1', d), JSON.stringify(Object.assign(senderDraft, { motion: { entrance: 'pop', card: 'lift', action: 'pulse' } })));
  await rp.goto('http://127.0.0.1:8080/index.html#pantalla'); await rp.waitForSelector('#phoneContent .component-host');
  ok(await rp.evaluate(() => [...document.querySelectorAll('#phoneContent .component-host')].every(h => getComputedStyle(h).animationName === 'none')), 'con «reducir movimiento» no hay animaciones');
  const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await m.waitForSelector('.motion-card');
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desbordamiento en móvil');
  ok(errors.length === 0, 'sin excepciones: ' + errors.join('|')); await b.close(); console.log(`${n} comprobaciones de animaciones correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
