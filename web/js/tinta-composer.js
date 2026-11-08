/* Motor de composición de Tinta: arma propuestas de pantalla con reglas y puntuación.
   Local, determinista y sin IA: la misma idea da siempre las mismas propuestas.
   Es puro (no toca el DOM). Usa los datos de tinta-composition-data.js y el detector de
   sectores de tinta-sectors.js. Cualquier otro proponente (una persona, un modelo) puede
   pasar por lint() para revisar su pantalla con las mismas reglas. */
(function (root) {
  'use strict';
  const ROLE_ORDER = ['header', 'cards', 'actions', 'nav'];
  const SECTOR_NAMES = { comida: 'comida y café', tienda: 'tiendas', finanzas: 'finanzas', fitness: 'fitness', viajes: 'viajes', salud: 'salud', musica: 'música', educacion: 'educación' };

  function create(data, detect) {
    const BY_ID = new Map(data.blocks.map(b => [b.id, b]));
    const byRole = r => data.blocks.filter(b => b.role === r);
    const sectorOf = (brief, forced) => forced && data.sectors[forced] ? forced : ((detect && detect(brief)) || {}).id || null;
    const tonesOf = sector => (data.sectors[sector] || data.sectors.default).tones;
    const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
    // Sin sector detectado, cada bloque vale lo que su versatilidad: el promedio de su encaje en todos los sectores.
    const aff = (b, sector) => sector && b.affinity[sector] !== undefined ? b.affinity[sector] : mean(Object.values(b.affinity));

    // Reglas de diseño. Cada una devuelve puntos (negativos = penalización) y avisos.
    function review(ids, sector) {
      const blocks = ids.map(id => BY_ID.get(id)).filter(Boolean);
      const issues = [];
      let penalty = 0;
      const warn = (rule, text, pts) => { issues.push({ level: 'aviso', rule, text }); penalty += pts; };
      const has = r => blocks.some(b => b.role === r);
      if (!has('header')) issues.push({ level: 'info', rule: 'falta-encabezado', text: 'Falta un encabezado: la pantalla no dice dónde estás.' });
      if (!has('nav')) issues.push({ level: 'info', rule: 'falta-navegacion', text: 'Falta la barra de navegación.' });
      if (!blocks.some(b => b.role === 'actions' && !b.requires_any.length)) warn('sin-accion-principal', 'No hay una acción principal clara.', 4);
      const present = new Set(ids);
      for (const b of blocks) {
        for (const c of b.conflicts_with) if (present.has(c) && b.id < c) warn('conflicto', `«${b.id}» y «${c}» compiten entre sí: elige solo uno.`, 5);
        if (b.requires_any.length && !b.requires_any.some(r => present.has(r))) warn('requiere', `«${b.id}» necesita una acción principal a su lado.`, 3);
        if (sector && aff(b, sector) === 0) warn('no-encaja', `«${b.id}» no suele encajar con ${SECTOR_NAMES[sector]}.`, 2);
      }
      const strong = blocks.filter(b => b.weight === 'fuerte').length;
      if (strong > 1) warn('peso', 'Hay dos bloques muy pesados. Deja que solo uno mande y que el resto respire.', 3 * (strong - 1));
      const coral = blocks.filter(b => b.accent === 'coral').length;
      if (coral > 1) warn('acento', `El coral aparece en ${coral} bloques. Un solo acento por pantalla se lee mejor.`, coral === 2 ? 1 : 3);
      const cards = blocks.filter(b => b.role === 'cards').length;
      if (cards > 2) warn('tarjetas', 'Más de dos tarjetas alargan la pantalla sin aportar jerarquía.', 2 * (cards - 2));
      return { issues, penalty };
    }

    function score(ids, sector) {
      const blocks = ids.map(id => BY_ID.get(id));
      const tones = tonesOf(sector);
      const roleScore = r => { const bs = blocks.filter(b => b.role === r); return bs.length ? mean(bs.map(b => aff(b, sector))) : 0; };
      let s = ROLE_ORDER.reduce((t, r) => t + roleScore(r), 0);
      s += blocks.filter(b => b.tones.some(t => tones.includes(t))).length * 0.5;
      const present = new Set(ids);
      blocks.forEach(b => b.pairs_with.forEach(p => { if (present.has(p)) s += 0.5; }));
      const cards = blocks.filter(b => b.role === 'cards');
      if (cards.length === 2 && cards[0].weight !== cards[1].weight) s += 0.5;
      s -= Math.max(0, ids.length - 4) * 0.5; // pantallas más cortas se leen mejor
      return s - review(ids, sector).penalty;
    }

    function candidates(sector) {
      const heads = byRole('header'), navs = byRole('nav'), cards = byRole('cards');
      const mains = byRole('actions').filter(b => !b.requires_any.length), softs = byRole('actions').filter(b => b.requires_any.length);
      const cardSets = cards.map(c => [c.id]);
      for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) cardSets.push([cards[i].id, cards[j].id]);
      const actionSets = [];
      mains.forEach(m => { actionSets.push([m.id]); softs.forEach(sf => actionSets.push([m.id, sf.id])); });
      const out = [];
      for (const h of heads) for (const cs of cardSets) for (const as of actionSets) for (const n of navs) {
        const ids = [h.id, ...cs, ...as, n.id];
        if (review(ids, sector).issues.some(i => i.rule === 'conflicto')) continue;
        out.push({ blocks: ids, score: score(ids, sector), issues: review(ids, sector).issues });
      }
      // Orden estable: mejor puntuación primero; en empate, menos bloques y luego por id.
      return out.sort((a, b) => b.score - a.score || a.blocks.length - b.blocks.length || a.blocks.join().localeCompare(b.blocks.join()));
    }

    // Cómo se parecen dos propuestas: compara por rol (encabezado, tarjetas, acción principal, navegación).
    const slots = ids => {
      const bs = ids.map(id => BY_ID.get(id));
      const of = (r, f) => bs.filter(b => b.role === r && (!f || f(b))).map(b => b.id).sort().join('+');
      return { header: of('header'), cards: of('cards'), action: of('actions', b => !b.requires_any.length), nav: of('nav') };
    };
    const ROLE_LABEL = { header: 'otra cabecera', cards: 'otras tarjetas', action: 'otra acción', nav: 'otra navegación' };
    const differs = (a, b) => Object.keys(a).filter(k => a[k] !== b[k]);

    // Elige propuestas buenas y distintas entre sí: cada una cambia al menos 2 roles respecto a las ya elegidas.
    // Primero solo con pantallas sin avisos de diseño; si no alcanzan, se completa con el resto.
    function pick(cands, count) {
      const chosen = [];
      const take = list => {
        for (const c of list) {
          if (chosen.length === count) break;
          if (chosen.every(p => differs(slots(p.blocks), slots(c.blocks)).length >= 2)) chosen.push(c);
        }
      };
      take(cands.filter(c => !c.issues.some(i => i.level === 'aviso')));
      if (chosen.length < count) take(cands);
      return chosen;
    }

    function tone(ids) {
      const blocks = ids.map(id => BY_ID.get(id));
      if (blocks.some(b => b.accent === 'grafito' && b.weight === 'fuerte')) return 'sobria y con contraste';
      if (blocks.some(b => b.accent === 'coral')) return 'cálida, con acento coral';
      return 'ligera y limpia';
    }

    function labelFor(i, ids, first) {
      if (i === 0) return 'La más acertada';
      const diff = differs(slots(first), slots(ids)).map(k => ROLE_LABEL[k]);
      return 'Variante: ' + diff.slice(0, 2).join(' y ');
    }

    function why(ids, sector) {
      return ids.map(id => {
        const b = BY_ID.get(id);
        const fit = sector && aff(b, sector) >= 3 ? `Encaja muy bien con ${SECTOR_NAMES[sector]}. ` : '';
        return { id, text: fit + b.when_to_use };
      });
    }

    function compose(opts) {
      const o = opts || {};
      const sector = sectorOf(o.brief, o.sector);
      const count = o.count || 3;
      const chosen = pick(candidates(sector), count);
      const first = chosen.length ? chosen[0].blocks : null;
      return {
        sector,
        proposals: chosen.map((c, i) => {
          const order = ROLE_ORDER.flatMap(r => c.blocks.filter(id => BY_ID.get(id).role === r));
          return { id: 'p' + (i + 1), label: labelFor(i, order, first), tone: tone(order), blocks: order, score: Math.round(c.score * 10) / 10, why: why(order, sector), issues: c.issues };
        }),
      };
    }

    function lint(ids, sectorId) { return review(ids, sectorId || null).issues; }
    return { compose, lint, sectorOf, blockIds: () => data.blocks.map(b => b.id) };
  }

  const api = { create, ROLE_ORDER };
  root.TintaComposer = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
