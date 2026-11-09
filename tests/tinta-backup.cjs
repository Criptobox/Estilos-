/* Copia de seguridad completa: formato, validación, restauración no destructiva e idempotente, y flujo en la app. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const B = require('../web/js/tinta-backup.js'), MS = require('../web/js/tinta-mystyles.js'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const mem = (init = {}) => { const m = new Map(Object.entries(init).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])); return { get: k => m.has(k) ? m.get(k) : null, set: (k, v) => m.set(k, String(v)), m }; };
const K = B.K, draft = (ids, brief = 'café') => ({ brief, selected: ids, choices: { header: null, nav: null }, content: {}, assets: {}, ui: {}, buttonStyles: {}, cardStyles: {} });
const style = (id, name) => ({ id, tab: 'Botones', name, ref: '', desc: '', colors: ['#ff0000'], radius: '16', tip: '', mode: 'light', v: '', code: '' });
const A = mem({ [K.projects]: [{ id: 't-a', name: 'Mi café', updated: '2026-01-01', draft: draft(['h-search']) }], [K.user]: { added: [style('u1', 'Botón uno')], edits: { 'tar-1': { name: 'X' } }, deleted: ['tar-2'] }, [K.favs]: ['tar-1', 'tar-3'], [K.recent]: ['tar-3'], [K.theme]: 'dark', [K.draft]: draft(['c-coral']), 'otra-clave': 'no debe salir', [K.studioProjects]: [{ id: 'p1', name: 'Estudio', state: { a: 1 } }] });
const pack = B.create(A, '12.18'); const text = JSON.stringify(pack);
ok(pack.app === 'estilos' && pack.format === B.FORMAT && pack.version === 1 && pack.appVersion === '12.18' && !('otra-clave' in pack.data) && Object.keys(pack.data).length === 7, 'create: formato, versión y solo claves conocidas');
const insp = B.inspect(text); ok(insp.summary.projects === 1 && insp.summary.styles === 1 && insp.summary.favs === 2 && insp.summary.recent === 1 && insp.summary.studioProjects === 1 && insp.summary.draft === true && insp.summary.theme === true, 'inspect: resumen correcto');
const bad = (t, re) => { try { B.inspect(t); return false; } catch (e) { return re.test(e.message); } };
ok(bad('', /vacío/) && bad('no json', /JSON válido/) && bad('{"a":1}', /No es una copia/) && bad(JSON.stringify({ ...pack, version: 9 }), /más nueva/) && bad(JSON.stringify({ ...pack, data: 5 }), /no contiene datos/), 'inspect: rechaza vacío, no-JSON, otro formato, versión futura y sin datos');
ok(bad('x'.repeat(B.MAX_BYTES + 1), /8 MB/) && bad(JSON.stringify({ ...pack, data: { [K.projects]: 'x' } }), /proyectos/) && bad(JSON.stringify({ ...pack, data: { [K.favs]: {} } }), /favoritos/) && bad(JSON.stringify({ ...pack, data: { [K.draft]: { selected: 3 } } }), /borrador/), 'inspect: tamaño y tipos inválidos');
const hostile = B.inspect(JSON.stringify({ ...pack, data: { __proto__: { polluted: 1 }, 'constructor': 1, 'evil': 2, [K.projects]: [{ id: 't', name: 'ok', draft: draft(['a']) }, { id: 1 }, null, { id: 'x', name: 'y', draft: { selected: [1] } }] } }));
ok(hostile.summary.projects === 1 && !({}).polluted && !('evil' in hostile.data), 'inspect: ignora claves ajenas, filtra proyectos inválidos y no contamina prototipos');
ok(B.inspect(JSON.stringify({ ...pack, data: { [K.projects]: Array.from({ length: 80 }, (_, i) => ({ id: 't' + i, name: 'p' + i, draft: draft(['a']) })) } })).summary.projects === 30, 'inspect: máximo 30 proyectos');
// Restauración en un almacén vacío
const E = mem(); const r1 = B.merge(insp.data, E, { normalizeStyle: raw => MS.normalize(raw) });
ok(r1.projects === 1 && r1.styles === 1 && r1.favs === 2 && r1.draft === 'adoptado' && r1.theme === true && r1.studioProjects === 1, 'merge en vacío: añade proyectos, estilos, favoritos, borrador, tema y proyectos del Editor');
ok(JSON.parse(E.get(K.user)).added[0].name === 'Botón uno' && JSON.parse(E.get(K.user)).edits['tar-1'].name === 'X' && JSON.parse(E.get(K.user)).deleted[0] === 'tar-2' && JSON.parse(E.get(K.projects))[0].id !== 't-a', 'estilos, ediciones y borrados llegan; los proyectos reciben id nuevo');
// Idempotencia
const r2 = B.merge(B.inspect(text).data, E, { normalizeStyle: raw => MS.normalize(raw) });
ok(r2.projects === 0 && r2.styles === 0 && r2.favs === 0 && r2.studioProjects === 0 && JSON.parse(E.get(K.projects)).length === 1, 'restaurar dos veces lo mismo no duplica nada');
// No destructivo con datos propios
const C = mem({ [K.projects]: [{ id: 't-mio', name: 'Mi proyecto', updated: 'x', draft: draft(['n-soft']) }], [K.user]: { added: [style('u1', 'Distinto')], edits: { 'tar-1': { name: 'Mío' } }, deleted: [] }, [K.favs]: ['tar-9'], [K.theme]: 'light', [K.draft]: draft(['a-dark'], 'mi idea') });
const r3 = B.merge(B.inspect(text).data, C, { normalizeStyle: raw => MS.normalize(raw) });
const u = JSON.parse(C.get(K.user)); const pr = JSON.parse(C.get(K.projects));
ok(u.added.length === 2 && u.added.find(x => x.name === 'Distinto').id === 'u1' && u.added.find(x => x.name === 'Botón uno').id !== 'u1', 'un estilo con el mismo id pero distinto se conserva y el importado recibe id nuevo');
ok(u.edits['tar-1'].name === 'Mío' && JSON.parse(C.get(K.favs)).join() === 'tar-9,tar-1,tar-3' && C.get(K.theme) === 'light', 'lo que ya tenías manda: ediciones, orden de favoritos y tema');
ok(pr.some(p => p.id === 't-mio') && pr.length === 3 && pr.some(p => p.name === 'Borrador de la copia') && JSON.parse(C.get(K.draft)).brief === 'mi idea' && r3.draft === 'como proyecto', 'tu borrador no se pisa: el de la copia entra como proyecto');
ok(B.merge({ [K.projects]: Array.from({ length: 5 }, (_, i) => ({ id: 'q' + i, name: 'n' + i, draft: draft(['a']) })) }, mem({ [K.projects]: Array.from({ length: 29 }, (_, i) => ({ id: 'e' + i, name: 'e' + i, draft: draft(['z']) })) })).projects === 1, 'respeta el máximo de 30 proyectos');
ok(B.merge({ [K.user]: { added: [{ nope: 1 }, style('u5', 'ok')] } }, mem(), { normalizeStyle: raw => MS.normalize(raw) }).styles === 1, 'un estilo inválido se descarta sin romper el resto');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }), pg = await ctx.newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://127.0.0.1:8080/index.html'); await pg.evaluate(d => { for (const [k, v] of Object.entries(d)) localStorage.setItem(k, JSON.stringify(v)); }, { [K.projects]: [{ id: 't-a', name: 'Mi café', updated: '2026-01-01', draft: draft(['h-search', 'c-coffee', 'a-coral', 'n-soft']) }], [K.favs]: ['tar-1', 'tar-3'], [K.recent]: ['tar-3'], [K.user]: { added: [style('uAbc', 'Mi botón de prueba')], edits: {}, deleted: [] } });
  await pg.reload(); await pg.click('[data-act=menu]'); await pg.click('[data-act=backup-open]'); await pg.waitForSelector('#backupDialog[open]');
  const now = await pg.locator('#backupNow').textContent(); ok(/1 proyecto de Tinta/.test(now) && /1 estilo propio/.test(now) && /2 favoritos/.test(now), 'el diálogo resume lo que tienes ahora');
  const dl = pg.waitForEvent('download'); await pg.click('[data-act=backup-download]'); const d1 = await dl; ok(/^estilos-copia-\d{4}-\d{2}-\d{2}\.json$/.test(d1.suggestedFilename()), 'descarga con nombre estilos-copia-AAAA-MM-DD.json');
  const file = path.join(os.tmpdir(), 'bk-' + Date.now() + '.json'); await d1.saveAs(file); const pkg = JSON.parse(fs.readFileSync(file, 'utf8')); ok(pkg.format === 'estilos-backup' && pkg.data[K.projects].length === 1 && pkg.data[K.user].added[0].name === 'Mi botón de prueba', 'el archivo contiene los datos reales');
  ok(/Copia descargada/.test(await pg.locator('#backupMessage').textContent()), 'confirma la descarga');
  // Restaurar en otro navegador (contexto limpio)
  const c2 = await b.newContext({ viewport: { width: 1280, height: 900 } }), q = await c2.newPage(); await q.goto('http://127.0.0.1:8080/index.html'); await q.click('[data-act=menu]'); await q.click('[data-act=backup-open]'); await q.waitForSelector('#backupDialog[open]');
  ok(/Todavía no hay nada/.test(await q.locator('#backupNow').textContent()), 'sin datos lo dice');
  await q.setInputFiles('#backupFile', file); await q.waitForSelector('#backupPreview:not([hidden])'); const items = await q.locator('#backupList li').allTextContents();
  ok(items.length >= 3 && items.some(t => /proyecto de Tinta/.test(t)) && items.some(t => /estilo propio/.test(t)), 'muestra qué contiene antes de aplicar');
  ok(await q.evaluate(() => localStorage.getItem('estilos-user-v2')) === null, 'ver el archivo no modifica nada todavía');
  await Promise.all([q.waitForNavigation({ waitUntil: 'load' }), q.click('[data-act=backup-apply]')]); await q.waitForSelector('#toast.on');
  ok(/Copia restaurada/.test(await q.locator('#toast').textContent()), 'restaura y avisa');
  ok(await q.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-projects-v1')).length) === 1 && await q.evaluate(() => TINTA_LIBRARY.some(b => b.mine && b.name === 'Mi botón de prueba')), 'los proyectos y los estilos propios llegan, y el estilo aparece en la biblioteca');
  await q.click('[data-act=menu]'); await q.click('[data-act=backup-open]'); await q.setInputFiles('#backupFile', file); await q.waitForSelector('#backupPreview:not([hidden])');
  await Promise.all([q.waitForNavigation({ waitUntil: 'load' }), q.click('[data-act=backup-apply]')]); await q.waitForSelector('#toast.on');
  ok(/ya estaba/.test(await q.locator('#toast').textContent()) && await q.evaluate(() => JSON.parse(localStorage.getItem('estilos-tinta-projects-v1')).length) === 1, 'restaurar otra vez no duplica nada y lo explica');
  // Archivos inválidos
  await q.click('[data-act=menu]'); await q.click('[data-act=backup-open]');
  const junk = path.join(os.tmpdir(), 'junk-' + Date.now() + '.json'); fs.writeFileSync(junk, '{"hola":1}'); await q.setInputFiles('#backupFile', junk); await q.waitForFunction(() => /No es una copia/.test(document.getElementById('backupMessage').textContent)); ok(await q.locator('#backupPreview').isHidden(), 'un archivo que no es una copia se rechaza con un mensaje');
  const big = path.join(os.tmpdir(), 'big-' + Date.now() + '.json'); fs.writeFileSync(big, 'x'.repeat(B.MAX_BYTES + 10)); await q.setInputFiles('#backupFile', big); await q.waitForFunction(() => /8 MB/.test(document.getElementById('backupMessage').textContent)); ok(true, 'un archivo de más de 8 MB se rechaza');
  fs.unlinkSync(file); fs.unlinkSync(junk); fs.unlinkSync(big);
  await q.keyboard.press('Escape'); ok(await q.locator('#backupDialog').isHidden(), 'Escape cierra el diálogo');
  const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto('http://127.0.0.1:8080/index.html'); await m.evaluate(() => document.querySelector('[data-act=backup-open]').click()); await m.waitForSelector('#backupDialog[open]');
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth) && await m.evaluate(() => { const r = document.getElementById('backupDialog').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }), 'el diálogo cabe en móvil');
  ok(errors.length === 0, 'sin excepciones: ' + errors.join('|')); await b.close(); console.log(`${n} comprobaciones de copia de seguridad correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
