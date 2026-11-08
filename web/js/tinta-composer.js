/* Motor de composición de Tinta: arma propuestas de pantalla con reglas y puntuación.
   Local, determinista y sin IA: la misma idea da siempre las mismas propuestas.
   Es puro (no toca el DOM). Usa los datos de tinta-composition-data.js y el detector de
   sectores de tinta-sectors.js. Cualquier otro proponente (una persona, un modelo) puede
   pasar por lint() para revisar su pantalla con las mismas reglas. */
(function (root) {
  'use strict';
  const ROLE_ORDER = ['header', 'cards', 'actions', 'nav'];
  // Azul y violeta son vecinos en el círculo cromático: juntos arman una paleta fría. El coral es cálido.
  const TEMP = { coral: 'cálido', azul: 'frío', violeta: 'frío' };
  const CHROMA = Object.keys(TEMP);
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
      const hues = [...new Set(blocks.map(b => b.accent).filter(a => CHROMA.includes(a)))];
      if (new Set(hues.map(h => TEMP[h])).size > 1) warn('mezcla-de-colores', `Mezcla ${hues.join(' y ')}: acentos cálidos y fríos juntos se pelean. Usa una sola gama por pantalla.`, 4);
      // Un tema de un solo color es buen diseño; lo que cansa es el color repetido en piezas pesadas.
      for (const h of hues) {
        const withHue = blocks.filter(b => b.accent === h);
        if (withHue.length >= 3 && withHue.some(b => b.weight === 'fuerte')) warn('acento', `El ${h} aparece en ${withHue.length} bloques y uno de ellos es muy pesado: el color manda demasiado.`, 2);
      }
      if (new Set(blocks.map(b => b.family)).size > 1) warn('mezcla-de-estilos', 'Mezcla bloques de Tinta y de la biblioteca original: se ven como dos apps distintas.', 3);
      const cards = blocks.filter(b => b.role === 'cards').length;
      if (cards > 2) warn('tarjetas', 'Más de dos tarjetas alargan la pantalla sin aportar jerarquía.', 2 * (cards - 2));
      return { issues, penalty };
    }

    function score(ids, sector, penalty) {
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
      return s - penalty;
    }

    const FAMILIES = [...new Set(data.blocks.map(b => b.family))];
    const byAffinity = sector => (a, b) => aff(b, sector) - aff(a, sector) || a.id.localeCompare(b.id);

    // Cada pantalla se arma dentro de una sola familia visual; las dos mezclas posibles se descartan de entrada.
    function candidates(sector) {
      const out = [];
      for (const fam of FAMILIES) {
        const inFam = r => byRole(r).filter(b => b.family === fam).sort(byAffinity(sector));
        const heads = inFam('header'), navs = inFam('nav'), cards = inFam('cards');
        const mains = inFam('actions').filter(b => !b.requires_any.length), softs = inFam('actions').filter(b => b.requires_any.length);
        const top = cards.slice(0, 7);
        const cardSets = cards.map(c => [c.id]);
        for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) cardSets.push([top[i].id, top[j].id]);
        const actionSets = [];
        mains.forEach(m => { actionSets.push([m.id]); softs.forEach(sf => actionSets.push([m.id, sf.id])); });
        for (const h of heads) for (const cs of cardSets) for (const as of actionSets) for (const n of navs) {
          const ids = [h.id, ...cs, ...as, n.id];
          const r = review(ids, sector);
          if (r.issues.some(i => i.rule === 'conflicto')) continue;
          out.push({ blocks: ids, score: score(ids, sector, r.penalty), issues: r.issues });
        }
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
    // La última se reserva, si hay una razonable (a menos de STYLE_GAP puntos de la mejor), para el otro estilo visual.
    const STYLE_GAP = 4;
    const familyOfIds = ids => BY_ID.get(ids[0]).family;
    function pick(cands, count, sector) {
      const chosen = [];
      const fits = c => chosen.every(p => differs(slots(p.blocks), slots(c.blocks)).length >= 2);
      const clean = cands.filter(c => !c.issues.some(i => i.level === 'aviso'));
      const take = (list, upTo) => { for (const c of list) { if (chosen.length >= upTo) break; if (fits(c)) chosen.push(c); } };
      if (!clean.length) { take(cands, count); return chosen; }
      const main = familyOfIds(clean[0].blocks);
      // Todas, salvo la última, en el estilo de la mejor propuesta; la última ofrece el otro estilo si hay una pieza sólida.
      take(clean.filter(c => familyOfIds(c.blocks) === main), count - 1);
      const solid = c => c.blocks.every(id => aff(BY_ID.get(id), sector) >= 2); // sin piezas de relleno
      const other = clean.find(c => familyOfIds(c.blocks) !== main && c.score >= clean[0].score - STYLE_GAP && solid(c) && fits(c));
      if (other) chosen.push(other);
      take(clean.filter(c => familyOfIds(c.blocks) === main), count);
      take(clean, count);
      if (chosen.length < count) take(cands, count);
      return chosen;
    }

    function tone(ids) {
      const blocks = ids.map(id => BY_ID.get(id));
      if (blocks.some(b => b.accent === 'grafito' && b.weight === 'fuerte')) return 'sobria y con contraste';
      const hue = blocks.map(b => b.accent).find(a => CHROMA.includes(a));
      if (hue) return 'con acento ' + hue;
      return 'ligera y limpia';
    }

    const familyOf = ids => BY_ID.get(ids[0]).family;
    function labelFor(i, ids, first) {
      if (i === 0) return 'La más acertada';
      if (familyOf(ids) !== familyOf(first)) return 'Variante: otro estilo visual';
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
      const chosen = pick(candidates(sector), count, sector);
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
