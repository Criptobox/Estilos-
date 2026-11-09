/* Avatares: 6 diseños de perfil, un personaje por sector, distintos por copia, con colores de la paleta y sin marcado inseguro. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const src = fs.readFileSync(path.join(__dirname, '../web/js/tinta-avatars.js'), 'utf8'), TT = require('../web/js/tinta-templates.js');
const ids = [...src.matchAll(/id: '(av-[a-z]+)', role: 'avatars'/g)].map(m => m[1]);
ok(ids.length === 6 && new Set(ids).size === 6, 'hay 6 diseños de avatar con id único');
ok(!/<script|javascript:|\bon[a-z]+=|@import|url\(|<iframe|<img|<text/i.test(src), 'sin scripts, manejadores, imágenes externas ni texto en los SVG');
(async () => {
  const b = await chromium.launch(), pg = await (await b.newContext({ viewport: { width: 390, height: 900 } })).newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.gallery-item');
  ok(await pg.evaluate(ids => ids.every(id => !!document.querySelector(`.gallery-item[data-id="${id}"]`)), ids), 'los 6 aparecen en la biblioteca');
  const r = await pg.evaluate(() => { const A = TINTA_AVATARS, sectors = Object.keys(A.BY_SECTOR), out = {};
    out.sectors = sectors.length; out.distinct = sectors.every(s => new Set([0, 1, 2, 3].map(i => A.pick(s, i))).size > 1);
    out.chars = new Set(sectors.map(s => A.pick(s, 0))).size; out.none = A.pick('nada', 0) === null;
    const c = A.pick('comida', 0, { a: '#112233', b: '#445566', i: '#778899', p: '#aabbcc' }); out.palette = c.includes('#112233');
    out.bad = A.pick('comida', 0, { a: 'red;}</style>', b: 'x', i: 'y', p: 'z' }).includes('</style>'); return out; });
  ok(r.sectors === 8 && r.chars === 8 && r.distinct && r.none, '8 personajes distintos y variantes por copia; sin sector no hay personaje');
  ok(r.palette && !r.bad, 'toma los colores de la paleta y rechaza valores no válidos');
  for (const t of TT.LIST) {
    await pg.goto('http://127.0.0.1:8080/index.html#bloques'); await pg.waitForSelector('.template-card'); await pg.click(`.template-card[data-id=${t.id}] [data-act=use-template]`); await pg.waitForSelector('#screenTabs button');
    await pg.click('#screenTabs [data-id=perfil]'); await pg.waitForSelector('#phoneContent .component-host');
    const i = await pg.evaluate(() => { const h = [...document.querySelectorAll('#phoneContent .component-host')].map(h => h.shadowRoot).find(s => s.querySelector('.av svg')); return h ? { svg: !!h.querySelector('.av svg path'), t: h.textContent.replace(/\s+/g, ' ').trim() } : null; });
    ok(i && i.svg && i.t.length > 8, `${t.id}: el Perfil usa un avatar ilustrado con nombre y rol`);
    ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${t.id}: Perfil sin desbordamiento`);
  }
  ok(!errors.length, 'sin errores de página: ' + errors.join('|')); await b.close(); console.log(`${n} comprobaciones de avatares correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
