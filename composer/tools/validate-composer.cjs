#!/usr/bin/env node
// Valida los metadatos de IA, los ScreenSpec de ejemplo y los briefs de oro.
// Sin dependencias. Los *.schema.json describen el contrato; este script aplica
// la parte estructural y las reglas semánticas que el esquema no puede expresar
// (ids que existen, huecos declarados, reglas de composición).
// Uso: node composer/tools/validate-composer.cjs
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const errors = [];
const err = (where, msg) => errors.push(where + ': ' + msg);

const catalog = read('design-library/catalog.json');
const catalogIds = new Set(catalog.records.map((r) => r.id));
const meta = read('design-library/composition.json');

const ROLES = ['header', 'cards', 'actions', 'nav'];
const POSITIONS = ['top', 'body', 'bottom'];
const KINDS = ['text', 'textlist', 'color', 'image', 'link'];
const TONES = ['calido', 'sobrio', 'energico', 'editorial'];
const ACCENTS = ['coral', 'azul', 'violeta', 'grafito', 'neutro'];
const FAMILIES = ['tinta', 'biblioteca'];
const SCREEN_KINDS = ['app', 'web'];
const WEIGHTS = ['ligero', 'medio', 'fuerte'];
const SECTOR_IDS = ['comida', 'tienda', 'finanzas', 'fitness', 'viajes', 'salud', 'musica', 'educacion'];
for (const id of SECTOR_IDS.concat('default')) {
  const t = meta.sectors && meta.sectors[id] && meta.sectors[id].tones;
  if (!Array.isArray(t) || !t.length || t.some((x) => !TONES.includes(x))) err('composition', 'sectors.' + id + '.tones inválido');
}

// 1. Metadatos de bloques
const byId = new Map();
if (meta.schema_version !== 1) err('composition', 'schema_version debe ser 1');
for (const b of meta.blocks) {
  const w = 'composition[' + b.id + ']';
  if (byId.has(b.id)) err(w, 'id duplicado');
  byId.set(b.id, b);
  if (!catalogIds.has(b.id)) err(w, 'no existe en catalog.json');
  if (!ROLES.includes(b.rules && b.rules.role)) err(w, 'rules.role inválido');
  if (!POSITIONS.includes(b.rules && b.rules.position)) err(w, 'rules.position inválido');
  if (!(b.rules && Number.isInteger(b.rules.max_per_screen) && b.rules.max_per_screen >= 1)) err(w, 'rules.max_per_screen inválido');
  for (const k of ['pairs_with', 'conflicts_with']) {
    for (const ref of (b.rules && b.rules[k]) || []) if (!catalogIds.has(ref)) err(w, k + ' apunta a un id inexistente: ' + ref);
  }
  for (const k of ['when_to_use', 'avoid_when']) {
    if (!b.guide || typeof b.guide[k] !== 'string' || b.guide[k].length < 10) err(w, 'guide.' + k + ' requerido (mín. 10 caracteres)');
  }
  const d = b.design || {};
  if (!Array.isArray(d.tones) || !d.tones.length || d.tones.some((t) => !TONES.includes(t))) err(w, 'design.tones inválido');
  if (!ACCENTS.includes(d.accent)) err(w, 'design.accent inválido');
  if (!WEIGHTS.includes(d.weight)) err(w, 'design.weight inválido');
  if (!FAMILIES.includes(d.family)) err(w, 'design.family inválido');
  if (!SCREEN_KINDS.includes(d.kind)) err(w, 'design.kind inválido');
  for (const sec of SECTOR_IDS) {
    const v = d.affinity && d.affinity[sec];
    if (!Number.isInteger(v) || v < 0 || v > 3) err(w, 'design.affinity.' + sec + ' debe ser un entero de 0 a 3');
  }
  for (const ref of (b.rules && b.rules.requires_any) || []) if (!catalogIds.has(ref)) err(w, 'requires_any apunta a un id inexistente: ' + ref);
  const names = new Set();
  for (const s of b.slots || []) {
    if (!/^[a-z][a-z0-9_]*$/.test(s.name || '')) err(w, 'nombre de hueco inválido: ' + s.name);
    if (names.has(s.name)) err(w, 'hueco duplicado: ' + s.name);
    names.add(s.name);
    if (!KINDS.includes(s.kind)) err(w, 'kind inválido en ' + s.name);
    if (!s.selector) err(w, 'selector requerido en ' + s.name);
    if (s.parts !== undefined && !(Number.isInteger(s.parts) && s.parts >= 2)) err(w, 'parts debe ser un entero ≥ 2 en ' + s.name);
  }
}

// 2. ScreenSpec
function checkSpec(spec, where) {
  if (spec.spec_version !== 1) err(where, 'spec_version debe ser 1');
  if (!spec.screen || !spec.screen.name) err(where, 'screen.name requerido');
  if (!Array.isArray(spec.blocks) || !spec.blocks.length) { err(where, 'blocks vacío'); return; }
  if (spec.blocks.length > 12) err(where, 'más de 12 bloques');
  const counts = {};
  const roleCount = {};
  const used = new Set();
  let lastPos = -1;
  spec.blocks.forEach((blk, i) => {
    const w = where + ' blocks[' + i + '] ' + blk.ref;
    if (!catalogIds.has(blk.ref)) { err(w, 'bloque inexistente en el catálogo (alucinado)'); return; }
    const m = byId.get(blk.ref);
    if (!m) { err(w, 'sin metadatos de IA: aún no se puede usar en una ScreenSpec'); return; }
    used.add(blk.ref);
    if (blk.repeat && blk.repeat > 1) err(w, 'repeat > 1 aún no se puede guardar en un proyecto de Tinta (cada bloque aparece una vez)');
    const times = blk.repeat || 1;
    counts[blk.ref] = (counts[blk.ref] || 0) + times;
    roleCount[m.rules.role] = (roleCount[m.rules.role] || 0) + 1;
    const pos = POSITIONS.indexOf(m.rules.position);
    if (pos < lastPos) err(w, 'orden inválido: un bloque "' + m.rules.position + '" aparece después de otro que va más abajo');
    lastPos = Math.max(lastPos, pos);
    const slots = blk.slots || {};
    const declared = new Map(m.slots.map((s) => [s.name, s]));
    for (const [name, val] of Object.entries(slots)) {
      const s = declared.get(name);
      if (!s) { err(w, 'hueco no declarado: ' + name); continue; }
      if (s.kind === 'textlist') {
        if (!Array.isArray(val)) { err(w, name + ' debe ser lista'); continue; }
        if (s.count && val.length !== s.count) err(w, name + ' debe tener ' + s.count + ' elementos');
        val.forEach((t) => { if (s.max && String(t).length > s.max) err(w, name + ' excede ' + s.max + ' caracteres'); });
      } else {
        if (typeof val !== 'string') { err(w, name + ' debe ser texto'); continue; }
        const lines = val.split('\n');
        if (lines.length > (s.parts || 1)) err(w, name + ' tiene ' + lines.length + ' líneas y el hueco admite ' + (s.parts || 1));
        if (s.max && val.replace(/\n/g, '').length > s.max) err(w, name + ' excede ' + s.max + ' caracteres (' + val.replace(/\n/g, '').length + ')');
        if (s.kind === 'color' && !/^#[0-9a-fA-F]{3,8}$/.test(val)) err(w, name + ' no es un color válido');
      }
    }
    for (const s of m.slots) if (s.required && !(s.name in slots)) err(w, 'falta el hueco obligatorio: ' + s.name);
  });
  for (const [ref, n] of Object.entries(counts)) {
    const max = byId.get(ref).rules.max_per_screen;
    if (n > max) err(where, ref + ' aparece ' + n + ' veces (máximo ' + max + ')');
  }
  for (const ref of used) {
    for (const c of byId.get(ref).rules.conflicts_with || []) if (used.has(c)) err(where, ref + ' no puede convivir con ' + c);
  }
  for (const ref of used) {
    const need = byId.get(ref).rules.requires_any;
    if (need && !need.some((r) => used.has(r))) err(where, ref + ' necesita que haya también uno de: ' + need.join(', '));
  }
  if (new Set([...used].map((r) => byId.get(r).design.kind)).size > 1) err(where, 'mezcla piezas de app y de página web');
  if ((roleCount.header || 0) > 1) err(where, 'más de un encabezado');
  if ((roleCount.nav || 0) > 1) err(where, 'más de una barra de navegación');
  if (!Array.isArray(spec.rationale) || !spec.rationale.length) err(where, 'rationale obligatorio');
  else {
    for (const r of spec.rationale) {
      if (!used.has(r.ref)) err(where, 'rationale menciona un bloque que no está en la pantalla: ' + r.ref);
      if (!r.why || r.why.length < 10) err(where, 'rationale de ' + r.ref + ' demasiado corto');
    }
    for (const ref of used) if (!spec.rationale.some((r) => r.ref === ref)) err(where, 'falta rationale para ' + ref);
  }
}
const exDir = path.join(root, 'composer/spec/examples');
const examples = fs.readdirSync(exDir).filter((f) => f.endsWith('.screen.json'));
for (const f of examples) checkSpec(JSON.parse(fs.readFileSync(path.join(exDir, f), 'utf8')), 'ejemplo ' + f);

// 3. Briefs de oro
const briefsFile = path.join(root, 'composer/evals/briefs/briefs.jsonl');
const briefIds = new Set();
let briefs = 0;
fs.readFileSync(briefsFile, 'utf8').split('\n').filter(Boolean).forEach((line, i) => {
  const w = 'briefs.jsonl línea ' + (i + 1);
  let b;
  try { b = JSON.parse(line); } catch (e) { err(w, 'JSON inválido'); return; }
  briefs++;
  if (!b.id || briefIds.has(b.id)) err(w, 'id vacío o duplicado');
  briefIds.add(b.id);
  if (!b.sector) err(w, 'sector requerido');
  if (!b.brief || b.brief.length < 20) err(w, 'brief demasiado corto');
  if (!Array.isArray(b.screens) || !b.screens.length) err(w, 'screens requerido');
  if (!Array.isArray(b.constraints)) err(w, 'constraints debe ser lista');
});

if (errors.length) {
  console.error('✗ ' + errors.length + ' error(es):');
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}
console.log('✓ ' + meta.blocks.length + ' bloques con metadatos, ' + examples.length + ' ScreenSpec de ejemplo, ' + briefs + ' briefs.');
