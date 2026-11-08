#!/usr/bin/env node
// Muestra las tres propuestas del motor de Tinta para una idea.
// Uso: node composer/tools/propose.cjs "Una app para mi cafetería" [--json]
const path = require('path');
const web = path.resolve(__dirname, '..', '..', 'web', 'js');
const Composer = require(path.join(web, 'tinta-composer.js'));
const Data = require(path.join(web, 'tinta-composition-data.js'));
const Sectors = require(path.join(web, 'tinta-sectors.js'));
const args = process.argv.slice(2);
const brief = args.filter((a) => !a.startsWith('--')).join(' ');
const result = Composer.create(Data, Sectors.detect).compose({ brief });
if (args.includes('--json')) { console.log(JSON.stringify(result, null, 2)); process.exit(0); }
console.log('Idea: ' + (brief || '(vacía)') + '\nSector: ' + (result.sector || 'sin detectar'));
for (const p of result.proposals) {
  console.log('\n' + p.id + ' · ' + p.label + ' · ' + p.tone + ' · puntuación ' + p.score);
  console.log('  ' + p.blocks.join(' → '));
  p.issues.forEach((i) => console.log('  ' + i.level + ': ' + i.text));
}
