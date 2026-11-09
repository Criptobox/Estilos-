#!/usr/bin/env node
// Mide el motor de composición de Tinta con los briefs de composer/evals/briefs/briefs.jsonl.
// Sin navegador, sin red, determinista. Separa `dev` (briefs con los que se afinó el motor) de
// `holdout` (briefs que no guiaron ningún ajuste): la cifra que cuenta es la del holdout.
// Uso: node composer/tools/eval-engine.cjs [--json] [--update-baseline] [--verbose]
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const web = path.join(root, 'web', 'js');
const Composer = require(path.join(web, 'tinta-composer.js'));
const Data = require(path.join(web, 'tinta-composition-data.js'));
const Sectors = require(path.join(web, 'tinta-sectors.js'));
const evalDir = path.join(root, 'composer', 'evals');
const briefs = fs.readFileSync(path.join(evalDir, 'briefs', 'briefs.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const engine = Composer.create(Data, Sectors.detect);
const BY_ID = new Map(Data.blocks.map((b) => [b.id, b]));
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const round = (n, d = 3) => (n === null ? null : Math.round(n * 10 ** d) / 10 ** d);

// Cómo se reparte una propuesta por roles: sirve para medir cuánto se diferencian dos propuestas.
function slots(ids) {
  const of = (role, keep) => ids.filter((id) => BY_ID.get(id).role === role && (!keep || keep(BY_ID.get(id)))).sort().join('+');
  return { header: of('header'), cards: of('cards'), action: of('actions', (b) => !b.requires_any.length), nav: of('nav') };
}
const roleDiffs = (a, b) => Object.keys(a).filter((k) => a[k] !== b[k]).length;

function evaluate(brief) {
  const t0 = process.hrtime.bigint();
  const r = engine.compose({ brief: brief.brief });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  const ps = r.proposals;
  const m = { id: brief.id, split: brief.split, expectKind: brief.expect.kind, expectSector: brief.expect.sector, kind: r.kind, sector: r.sector, ms };
  m.kindOk = r.kind === brief.expect.kind;
  m.sectorOk = r.sector === brief.expect.sector;
  m.proposals = ps.length;
  m.clean = ps.filter((p) => !p.issues.some((i) => i.level === 'aviso')).length / (ps.length || 1);
  const pairs = [];
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) pairs.push(roleDiffs(slots(ps[i].blocks), slots(ps[j].blocks)));
  m.diversityMin = pairs.length ? Math.min(...pairs) : 0;
  // Encaje con el sector que se esperaba (no con el detectado), para no mezclar el error de detección con el de composición.
  const sec = brief.expect.sector;
  m.fit = sec && ps.length ? mean(ps[0].blocks.map((id) => BY_ID.get(id).affinity[sec])) : null;
  // Textos: de los bloques con huecos de la primera propuesta, cuántos llegan con copia del sector detectado.
  const slotted = ps.length ? ps[0].blocks.filter((id) => BY_ID.get(id).slots.length) : [];
  m.copy = slotted.length ? slotted.filter((id) => engine.copyFor(r.sector, id)).length / slotted.length : null;
  m.blocks = ps.flatMap((p) => p.blocks);
  return m;
}

function aggregate(rows) {
  const pick = (k) => rows.map((r) => r[k]).filter((v) => v !== null && v !== undefined);
  const used = new Set(rows.flatMap((r) => r.blocks));
  const sorted = rows.map((r) => r.ms).sort((a, b) => a - b);
  return {
    briefs: rows.length,
    sectorAccuracy: round(rows.filter((r) => r.sectorOk).length / rows.length),
    kindAccuracy: round(rows.filter((r) => r.kindOk).length / rows.length),
    proposals: round(mean(pick('proposals')), 2),
    cleanRate: round(mean(pick('clean'))),
    diversityMin: Math.min(...pick('diversityMin')),
    fitMean: round(mean(pick('fit')), 2),
    copyCoverage: round(mean(pick('copy'))),
    blocksUsed: used.size,
    p95ms: round(sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)], 1),
  };
}

function run() {
  engine.compose({ brief: '' }); // calienta el motor para que el primer brief no cargue con el arranque
  const rows = briefs.map(evaluate);
  const groups = { all: rows, dev: rows.filter((r) => r.split === 'dev'), holdout: rows.filter((r) => r.split === 'holdout') };
  const report = Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, aggregate(v)]));
  const described = Data.blocks.length;
  const usedAll = new Set(rows.flatMap((r) => r.blocks));
  const unused = Data.blocks.map((b) => b.id).filter((id) => !usedAll.has(id));
  const misses = rows.filter((r) => !r.sectorOk || !r.kindOk).map((r) => ({ id: r.id, split: r.split, expect: `${r.expectKind}/${r.expectSector}`, got: `${r.kind}/${r.sector}` }));
  return { report, rows, misses, unused, described };
}

const baselineFile = path.join(evalDir, 'baseline.json');
const noTime = (r) => { const { p95ms, ...rest } = r; return rest; };
function main() {
  const { report, misses, unused, described } = run();
if (process.argv.includes('--update-baseline')) {
  fs.writeFileSync(baselineFile, JSON.stringify({ note: 'Se actualiza con: node composer/tools/eval-engine.cjs --update-baseline. Solo debe subir; una bajada tiene que justificarse en el PR. No guarda el tiempo, que varía en cada ejecución.', report: { dev: noTime(report.dev), holdout: noTime(report.holdout) } }, null, 2) + '\n');
  console.log('Baseline actualizada.');
}
if (process.argv.includes('--json')) { console.log(JSON.stringify({ report, described, unused, misses }, null, 2)); return; }

const pct = (v) => (v === null ? '—' : Math.round(v * 1000) / 10 + ' %');
const line = (label, f) => console.log(label.padEnd(30) + ['dev', 'holdout', 'all'].map((g) => String(f(report[g])).padStart(10)).join(''));
console.log('Evaluación del motor de composición de Tinta\n' + ''.padEnd(30) + ['dev', 'holdout', 'todos'].map((g) => g.padStart(10)).join(''));
line('Briefs', (r) => r.briefs);
line('Sector detectado', (r) => pct(r.sectorAccuracy));
line('Tipo detectado (app/web)', (r) => pct(r.kindAccuracy));
line('Propuestas sin avisos', (r) => pct(r.cleanRate));
line('Diferencia mínima (roles)', (r) => r.diversityMin);
line('Encaje medio (0-3)', (r) => r.fitMean);
line('Textos del sector', (r) => pct(r.copyCoverage));
line('Bloques distintos usados', (r) => r.blocksUsed);
line('Tiempo p95 (ms)', (r) => r.p95ms);
console.log(`\nBloques descritos: ${described}. Sin usar en ningún brief: ${unused.length}${process.argv.includes('--verbose') ? ' → ' + unused.join(', ') : ''}`);
if (misses.length) { console.log('\nBriefs con detección distinta de la esperada:'); misses.forEach((m) => console.log(`  - [${m.split}] ${m.id}: esperaba ${m.expect}, salió ${m.got}`)); }
}

module.exports = { run, baselineFile };
if (require.main === module) main();
