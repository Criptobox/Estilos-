/* Composición: los huecos declarados existen en los bloques reales y las ScreenSpec de ejemplo se convierten a proyectos de Tinta que se dibujan. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { convert, checkBlocks, STORE } = require('../composer/tools/spec-to-tinta.cjs');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const examples = path.join(__dirname, '..', 'composer', 'spec', 'examples');
(async () => {
  const b = await chromium.launch(), errors = [];
  const pg = await b.newPage({ viewport: { width: 1100, height: 900 } }); pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://127.0.0.1:8080/crear.html');
  ok(await pg.evaluate(() => !!window.__tintaInspect), 'la página expone el gancho de inspección bajo automatización');
  const bad = await checkBlocks(pg); ok(bad.length === 0, 'todos los selectores de huecos existen: ' + bad.join(' | '));
  const files = fs.readdirSync(examples).filter(f => f.endsWith('.screen.json')); ok(files.length >= 2, 'hay ScreenSpec de ejemplo');
  for (const f of files) {
    const spec = JSON.parse(fs.readFileSync(path.join(examples, f), 'utf8'));
    const { project, problems } = await convert(pg, spec); ok(problems.length === 0, f + ' se convierte sin problemas: ' + problems.join(' | '));
    ok(project.format === 'estilos-tinta-project' && project.version === 1 && project.draft.selected.length === spec.blocks.length, f + ': formato de proyecto válido');
    const v = await b.newPage({ viewport: { width: 1100, height: 900 } }); v.on('pageerror', e => errors.push(e.message));
    await v.addInitScript(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [STORE, project.draft]);
    await v.goto('http://127.0.0.1:8080/crear.html#pantalla'); await v.waitForSelector('#phoneContent .component-host');
    const shown = await v.evaluate(() => [...document.querySelectorAll('#review .component-host')].map(h => h.shadowRoot.textContent.replace(/\s+/g, ' ')).join(' | '));
    const texts = spec.blocks.flatMap(blk => Object.values(blk.slots || {}).flat()).flatMap(t => t.split('\n')).map(t => t.trim()).filter(Boolean);
    const missing = texts.filter(t => !shown.includes(t)); ok(missing.length === 0, f + ': la vista previa muestra los textos de la ScreenSpec. Faltan: ' + missing.join(' | '));
    await v.close();
  }
  const rep = await convert(pg, { screen: { name: 'x' }, blocks: [{ ref: 'a-dark', slots: { label: 'A' } }, { ref: 'a-dark', slots: { label: 'B' } }, { ref: 'c-coffee', repeat: 3 }] });
  ok(rep.problems.some(p => /repetido/.test(p)) && rep.problems.some(p => /repeat/.test(p)), 'rechaza bloques repetidos y repeat > 1');
  ok(errors.length === 0, 'sin excepciones: ' + errors.join('|')); await b.close(); console.log(`${n} comprobaciones de composición (huecos y ScreenSpec) correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
