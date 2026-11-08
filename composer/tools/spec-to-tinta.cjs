#!/usr/bin/env node
// Convierte una ScreenSpec en un proyecto de Tinta (formato estilos-tinta-project v1).
// Usa el código real de la página (BY_ID, contentModel, normalizedDraft), así no
// duplica cómo Tinta numera los textos de un bloque.
//
// Uso:  node composer/tools/spec-to-tinta.cjs <spec.json> [--out proyecto.json] [--shot captura.png]
// Como módulo: convert(page, spec) con una página de Playwright abierta en crear.html.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const meta = JSON.parse(fs.readFileSync(path.join(root, 'design-library/composition.json'), 'utf8'));
const META = new Map(meta.blocks.map((b) => [b.id, b]));
const STORE = 'estilos-tinta-prototype-v1';

// Se ejecuta dentro de la página: usa el mismo módulo de huecos que la app (web/js/tinta-slots.js).
function mapBlockInPage({ id, slots, values }) {
  const { byId, contentModel } = window.__tintaInspect || {};
  if (!byId) return { problems: ['la página no expone __tintaInspect (se necesita un navegador automatizado)'], content: null, info: [] };
  return window.TintaSlots.map(byId[id], slots, values, contentModel);
}

async function convert(page, spec) {
  const problems = [];
  const selected = [];
  const content = {};
  const choices = { header: null, nav: null };
  for (const [i, blk] of spec.blocks.entries()) {
    const m = META.get(blk.ref);
    const where = `blocks[${i}] ${blk.ref}`;
    if (!m) { problems.push(`${where}: sin metadatos de IA`); continue; }
    if (selected.includes(blk.ref)) { problems.push(`${where}: repetido`); continue; }
    if (blk.repeat && blk.repeat > 1) { problems.push(`${where}: repeat > 1 no se puede guardar en un proyecto de Tinta`); continue; }
    const r = await page.evaluate(mapBlockInPage, { id: blk.ref, slots: m.slots, values: blk.slots || {} });
    r.problems.forEach((p) => problems.push(`${where}: ${p}`));
    if (!r.content) continue;
    selected.push(blk.ref);
    if (r.content.some((v) => v !== null)) content[blk.ref] = r.content;
    if (m.rules.role === 'header' || m.rules.role === 'nav') choices[m.rules.role] = blk.ref;
  }
  if (spec.tokens && spec.tokens.theme === 'dark') problems.push('tokens.theme "dark" aún no se aplica al proyecto (Tinta guarda el tema aparte)');
  const draft = { brief: '', selected, choices, content, assets: {}, ui: {}, buttonStyles: {}, cardStyles: {} };
  try { await page.evaluate((d) => { window.__tintaInspect.normalizedDraft(d); }, draft); } catch (e) { problems.push('Tinta rechaza el borrador: ' + e.message); }
  return {
    project: { format: 'estilos-tinta-project', version: 1, name: String(spec.screen.name).slice(0, 80), draft },
    problems,
  };
}

async function slotReport(page, spec) {
  const out = [];
  for (const blk of spec.blocks) {
    const m = META.get(blk.ref);
    if (!m) continue;
    const r = await page.evaluate(mapBlockInPage, { id: blk.ref, slots: m.slots, values: blk.slots || {} });
    out.push({ ref: blk.ref, info: r.info });
  }
  return out;
}

function loadPlaywright() {
  try { return require('playwright'); } catch (e) { return require(path.join(root, 'tests/node_modules/playwright')); }
}

function serveWeb() {
  const http = require('http');
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
  const web = path.join(root, 'web');
  return new Promise((resolve) => {
    const s = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(web, path.normalize(p));
      if (!f.startsWith(web) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(r);
    }).listen(0, '127.0.0.1', () => resolve(s));
  });
}

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--') && !['--out', '--shot'].includes(args[args.indexOf(a) - 1]));
  const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
  if (!file) { console.error('Uso: node composer/tools/spec-to-tinta.cjs <spec.json> [--out proyecto.json] [--shot captura.png]'); process.exit(2); }
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  const server = await serveWeb();
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const url = `http://127.0.0.1:${server.address().port}/crear.html`;
    await page.goto(url);
    const { project, problems } = await convert(page, spec);
    if (problems.length) { console.error('✗ ' + problems.length + ' problema(s):'); problems.forEach((p) => console.error('  - ' + p)); process.exitCode = 1; return; }
    if (opt('--out')) fs.writeFileSync(opt('--out'), JSON.stringify(project, null, 2));
    if (opt('--shot')) {
      const shot = await browser.newPage({ viewport: { width: 1100, height: 900 } });
      shot.on('pageerror', (e) => errors.push(e.message));
      await shot.addInitScript(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [STORE, project.draft]);
      await shot.goto(url + '#pantalla');
      await shot.waitForSelector('#review', { state: 'visible' });
      await shot.waitForSelector('#phoneContent .component-host');
      await shot.waitForTimeout(400);
      await shot.locator('#phoneContent').screenshot({ path: opt('--shot') });
    }
    if (errors.length) { console.error('Excepciones en la página: ' + errors.join(' | ')); process.exitCode = 1; return; }
    console.log('✓ ' + project.name + ': ' + project.draft.selected.join(', '));
  } finally { await browser.close(); server.close(); }
}

// Comprueba que los huecos de TODOS los bloques con metadatos apuntan a textos reales de Tinta.
async function checkBlocks(page) {
  const problems = [];
  for (const m of meta.blocks) {
    const r = await page.evaluate(mapBlockInPage, { id: m.id, slots: m.slots, values: {} });
    r.problems.forEach((p) => problems.push(`${m.id}: ${p}`));
  }
  return problems;
}

module.exports = { convert, slotReport, checkBlocks, STORE };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
