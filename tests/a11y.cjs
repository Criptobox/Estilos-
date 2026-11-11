/* Accesibilidad automática (axe-core, WCAG 2.1 AA): Tinta y el Editor, en tema claro y oscuro.
   Falla ante cualquier incidencia crítica o seria en la interfaz. Se excluyen las muestras de los
   componentes de la biblioteca (su texto de ejemplo es parte del diseño) y las miniaturas del Editor. */
const { chromium } = require('playwright'); const axe = require('axe-core'); const assert = require('node:assert/strict'); let n = 0;
const EXCLUDE = [['#phoneContent'], ['#phoneNav'], ['.template-frame'], ['.gallery-item .component-host'], ['.detail-stage'], ['.component-host'], ['.thumb'], ['.off'], ['.pv'], ['[data-slot]'], ['#screen'], ['.canvas']];
async function scan(pg, name, include) { await pg.addScriptTag({ content: axe.source }); const r = await pg.evaluate(async ([inc, exc]) => await axe.run({ include: inc, exclude: exc }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }), [include || [['body']], EXCLUDE]); const bad = r.violations.filter(v => ['critical', 'serious'].includes(v.impact)); assert.equal(bad.length, 0, name + ': ' + bad.map(v => v.id + ' x' + v.nodes.length + ' (' + v.nodes.slice(0, 2).map(x => x.target.join(' ').slice(0, 50)).join(' | ') + ')').join('; ')); n++; }
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }), pg = await ctx.newPage(); await pg.addInitScript(t => { localStorage.setItem('estilos-tinta-ui-theme-v1', t); localStorage.setItem('estilos-studio-theme', t); }, theme);
    await pg.goto('http://127.0.0.1:8080/index.html'); await pg.waitForTimeout(400); await scan(pg, theme + ' · Tu idea');
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.waitForSelector('.template-card'); await pg.waitForTimeout(500); await scan(pg, theme + ' · Los bloques');
    await pg.click('.template-card[data-id=tpl-cafeteria] [data-act=use-template]'); await pg.waitForSelector('#review', { state: 'visible' }); await pg.waitForTimeout(500); await scan(pg, theme + ' · Tu pantalla');
    await pg.click('[data-act=menu]'); await scan(pg, theme + ' · Menú'); await pg.click('[data-act=backup-open]'); await pg.waitForSelector('#backupDialog[open]'); await scan(pg, theme + ' · Copia de seguridad', [['#backupDialog']]); await pg.keyboard.press('Escape');
    await pg.goto('http://127.0.0.1:8080/index.html#bloques/todo'); await pg.waitForSelector('.gallery-item'); await pg.click('[data-act=new-mystyle]'); await pg.waitForSelector('#styleDialog[open]'); await scan(pg, theme + ' · Crear mi estilo', [['#styleDialog']]); await pg.keyboard.press('Escape');
    await pg.click('.gallery-item .preview-open'); await pg.waitForSelector('#detailDialog[open]'); await scan(pg, theme + ' · Ficha de un diseño', [['#detailDialog']]);
    await pg.goto('http://127.0.0.1:8080/agente.html'); await pg.waitForTimeout(600); await scan(pg, theme + ' · Editor');
    await ctx.close();
  }
  await b.close(); console.log(`${n} pantallas sin incidencias críticas ni serias de accesibilidad.`);
})().catch(e => { console.error(e.message); process.exit(1); });
