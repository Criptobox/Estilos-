/* Huecos de un bloque → textos de Tinta. Tinta guarda los textos de un bloque por posición de
   nodo de texto (contentModel); un hueco se localiza con un selector CSS dentro del HTML del
   bloque. Este módulo traduce {hueco: valor} a esa lista de textos, y avisa si un selector ya
   no apunta a lo que debe. Lo usan la app (copia por sector) y composer/tools/spec-to-tinta.cjs.
   Necesita DOM y recibe contentModel de crear.js. Sin red, sin IA. */
(function (root) {
  'use strict';
  /* Devuelve { content, problems, info }.
     content: un texto por nodo (null = sin cambio). info: qué texto original reemplaza cada hueco. */
  function map(block, slots, values, contentModel) {
    if (!block) return { problems: ['el bloque no existe en la biblioteca de la página'], content: null, info: [] };
    const vals = values || {};
    const model = contentModel(block);
    const originals = model.fields.map(f => f.value);
    // Espacios del texto original (p. ej. «lista para » antes de un énfasis): se conservan al reemplazar.
    const tpl = document.createElement('template');
    tpl.innerHTML = block.html;
    const raws = [];
    const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.textContent.trim() && /[\p{L}\p{N}]/u.test(n.textContent) && !n.parentElement.closest('svg,style,script')) raws.push(n.textContent);
    }
    const rawOk = originals.every((o, i) => raws[i] !== undefined && raws[i].trim() === o);
    const spaced = (i, v) => (rawOk ? raws[i].match(/^\s*/)[0] + v.trim() + raws[i].match(/\s*$/)[0] : v);
    model.fields.forEach((f, i) => f.set('\u0001' + i + '\u0002'));
    const tags = text => [...text.matchAll(/\u0001(\d+)\u0002/g)].map(m => Number(m[1]));
    const content = new Array(model.fields.length).fill(null);
    const taken = new Map();
    const problems = [];
    const info = [];
    const put = (slot, idx, value) => {
      if (taken.has(idx)) { problems.push('"' + slot.name + '" y "' + taken.get(idx) + '" apuntan al mismo texto'); return; }
      taken.set(idx, slot.name);
      info.push({ slot: slot.name, original: originals[idx] });
      if (value !== undefined) content[idx] = value === '' ? '' : spaced(idx, value);
    };
    for (const slot of slots) {
      let els;
      try { els = [...model.root.content.querySelectorAll(slot.selector)]; } catch (e) { problems.push('"' + slot.name + '": selector inválido'); continue; }
      const fieldsOf = el => (slot.own
        ? [...el.childNodes].filter(n => n.nodeType === 3).flatMap(n => tags(n.textContent))
        : tags(el.textContent));
      if (slot.kind === 'textlist') {
        if (slot.count && els.length !== slot.count) { problems.push('"' + slot.name + '": el selector encuentra ' + els.length + ' elementos y se esperaban ' + slot.count); continue; }
        const given = vals[slot.name];
        els.forEach((el, i) => {
          const idx = fieldsOf(el);
          if (idx.length !== 1) { problems.push('"' + slot.name + '"[' + i + '] corresponde a ' + idx.length + ' textos'); return; }
          put(slot, idx[0], Array.isArray(given) ? given[i] : undefined);
        });
      } else {
        if (els.length !== 1) { problems.push('"' + slot.name + '": el selector "' + slot.selector + '" encuentra ' + els.length + ' elementos y debe encontrar 1'); continue; }
        const idx = fieldsOf(els[0]);
        const expected = slot.parts || 1;
        if (idx.length !== expected) { problems.push('"' + slot.name + '": corresponde a ' + idx.length + ' textos y el metadato declara ' + expected); continue; }
        const given = vals[slot.name];
        const lines = typeof given === 'string' ? given.split('\n') : null;
        idx.forEach((k, n) => put(slot, k, lines ? (lines[n] === undefined ? '' : lines[n]) : undefined));
      }
    }
    return { problems, content, info };
  }
  root.TintaSlots = { map };
  if (typeof module !== 'undefined') module.exports = root.TintaSlots;
})(typeof window !== 'undefined' ? window : globalThis);
