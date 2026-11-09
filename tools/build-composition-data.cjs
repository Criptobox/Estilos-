#!/usr/bin/env node
// Genera web/js/tinta-composition-data.js desde design-library/composition.json
// (la web solo publica la carpeta web/). Sin huecos: el navegador no los necesita.
// Uso: node tools/build-composition-data.cjs [--check]
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const src = JSON.parse(fs.readFileSync(path.join(root, 'design-library/composition.json'), 'utf8'));
const copy = JSON.parse(fs.readFileSync(path.join(root, 'design-library/copy.json'), 'utf8'));
const groupOf = {};
for (const [g, ids] of Object.entries(copy.groups)) ids.forEach((id) => { groupOf[id] = g; });
const data = {
  sectors: src.sectors,
  // copy[sector][bloque] = {hueco: valor}: la copia de cada grupo, repartida por bloque.
  copy: Object.fromEntries(Object.entries(copy.sectors).map(([sec, groups]) => [sec, Object.fromEntries(Object.entries(groupOf).map(([id, g]) => [id, groups[g]]))])),
  blocks: src.blocks.map((b) => ({
    id: b.id, role: b.rules.role, position: b.rules.position, max_per_screen: b.rules.max_per_screen,
    rank: b.rules.rank || null, pairs_with: b.rules.pairs_with || [], conflicts_with: b.rules.conflicts_with || [], requires_any: b.rules.requires_any || [],
    tones: b.design.tones, family: b.design.family, kind: b.design.kind, accent: b.design.accent, weight: b.design.weight, affinity: b.design.affinity,
    slots: b.slots,
    when_to_use: b.guide.when_to_use, avoid_when: b.guide.avoid_when,
  })),
};
const out = '/* Generado por tools/build-composition-data.cjs desde design-library/composition.json. No editar a mano. */\n' +
  '(function (root) {\n  \'use strict\';\n  root.TintaCompositionData = ' + JSON.stringify(data) + ';\n' +
  '  if (typeof module !== \'undefined\') module.exports = root.TintaCompositionData;\n' +
  '})(typeof window !== \'undefined\' ? window : globalThis);\n';
const file = path.join(root, 'web/js/tinta-composition-data.js');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== out) { console.error('✗ web/js/tinta-composition-data.js está desactualizado. Ejecuta: node tools/build-composition-data.cjs'); process.exit(1); }
  console.log('✓ tinta-composition-data.js al día');
} else { fs.writeFileSync(file, out); console.log('Escrito ' + path.relative(root, file) + ' (' + out.length + ' bytes)'); }
