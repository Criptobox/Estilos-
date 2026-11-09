/* Banco de pruebas del motor de composición: umbrales sobre el holdout, sin retrocesos respecto a la línea base
   y estructura de los briefs. No usa navegador. Para subir la línea base: node composer/tools/eval-engine.cjs --update-baseline */
const assert = require('node:assert/strict'); const fs = require('node:fs'), path = require('node:path');
const { run, baselineFile } = require('../composer/tools/eval-engine.cjs');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const th = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'composer', 'evals', 'thresholds.json'), 'utf8'));
const base = JSON.parse(fs.readFileSync(baselineFile, 'utf8')).report;
const briefs = fs.readFileSync(path.join(__dirname, '..', 'composer', 'evals', 'briefs', 'briefs.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const out = run(), r = out.report;

// Estructura del banco
ok(briefs.length >= 40, `al menos 40 briefs (hay ${briefs.length})`);
ok(briefs.filter(b => b.split === 'holdout').length >= 30, 'al menos 30 briefs de holdout, que no guían ajustes');
ok(new Set(briefs.map(b => b.id)).size === briefs.length, 'ids únicos');
for (const s of ['comida', 'tienda', 'finanzas', 'fitness', 'viajes', 'salud', 'musica', 'educacion', null]) ok(briefs.filter(b => b.expect.sector === s).length >= 2, `al menos 2 briefs de ${s === null ? 'sin sector' : s}`);
ok(briefs.filter(b => b.expect.kind === 'web').length >= 10 && briefs.filter(b => b.expect.kind === 'app').length >= 10, 'al menos 10 briefs de página web y 10 de app');
ok(briefs.some(b => b.brief === '') && briefs.some(b => b.brief === b.brief.toUpperCase() && b.brief.length > 3), 'hay casos límite: idea vacía y en mayúsculas');

// Umbrales en el holdout
for (const [k, min] of Object.entries(th.holdout)) ok(r.holdout[k] >= min, `holdout.${k} = ${r.holdout[k]} (mínimo ${min})`);
ok(r.all.p95ms <= th.maxP95ms, `tiempo p95 ${r.all.p95ms} ms (máximo ${th.maxP95ms})`);

// Sin retrocesos respecto a la línea base (más alto es mejor en todas)
for (const g of ['dev', 'holdout']) for (const k of ['sectorAccuracy', 'kindAccuracy', 'cleanRate', 'diversityMin', 'fitMean', 'copyCoverage', 'blocksUsed']) ok(r[g][k] >= base[g][k] - 1e-9, `${g}.${k}: ${r[g][k]} no baja de la línea base ${base[g][k]}`);
ok(r.dev.briefs >= base.dev.briefs && r.holdout.briefs >= base.holdout.briefs, 'no se pierden briefs');

// Determinismo
const again = run().report; const strip = x => JSON.stringify(x, (k, v) => (k === 'p95ms' ? undefined : v));
ok(strip(again) === strip(r), 'dos ejecuciones dan las mismas métricas');
console.log(`${n} comprobaciones del banco de pruebas del motor correctas (holdout: sector ${Math.round(r.holdout.sectorAccuracy * 1000) / 10} %, textos ${Math.round(r.holdout.copyCoverage * 1000) / 10} %).`);
