/* Animaciones de Tinta: entrada de los bloques, efecto al tocar tarjetas y pulso del botón principal.
   El mismo CSS sirve para la vista previa y para el HTML exportado. Siempre respeta
   prefers-reduced-motion. Datos puros: crear.js decide dónde aplicarlas. */
(function (root) {
  'use strict';
  const KINDS = { entrance: 'Entrada', card: 'Tarjetas', action: 'Botón principal' };
  const LIST = [
    { id: 'fade-up', kind: 'entrance', name: 'Aparecer subiendo', desc: 'Cada bloque entra desde abajo con un fundido suave, uno tras otro.' },
    { id: 'fade', kind: 'entrance', name: 'Aparecer', desc: 'Fundido limpio, sin movimiento: lo más discreto.' },
    { id: 'scale', kind: 'entrance', name: 'Zoom suave', desc: 'Los bloques crecen un poco al aparecer.' },
    { id: 'slide', kind: 'entrance', name: 'Deslizar', desc: 'Entran desde la izquierda, en cascada.' },
    { id: 'blur', kind: 'entrance', name: 'De borroso a nítido', desc: 'Se enfocan al aparecer. Elegante en pantallas con fotos.' },
    { id: 'pop', kind: 'entrance', name: 'Rebote', desc: 'Entran con un pequeño rebote. Divertido y juvenil.' },
    { id: 'lift', kind: 'card', name: 'Elevar al tocar', desc: 'La tarjeta sube un poco cuando la tocas o pasas el cursor.' },
    { id: 'pulse', kind: 'action', name: 'Pulso', desc: 'El botón principal late despacio para invitar a pulsarlo.' }
  ];
  const get = id => LIST.find(m => m.id === id) || null;
  const CSS = '@keyframes tm-fade{from{opacity:0}to{opacity:1}}@keyframes tm-fade-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}@keyframes tm-scale{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}@keyframes tm-slide{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}@keyframes tm-blur{from{opacity:0;filter:blur(8px)}to{opacity:1;filter:none}}@keyframes tm-pop{0%{opacity:0;transform:scale(.8)}60%{transform:scale(1.04)}100%{opacity:1;transform:none}}@keyframes tm-pulse{0%,100%{transform:none}50%{transform:scale(1.035)}}'
    + '[data-m-entrance]{animation:var(--tm-in) .55s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*90ms)}'
    + '[data-m-entrance=fade-up]{--tm-in:tm-fade-up}[data-m-entrance=fade]{--tm-in:tm-fade}[data-m-entrance=scale]{--tm-in:tm-scale}[data-m-entrance=slide]{--tm-in:tm-slide}[data-m-entrance=blur]{--tm-in:tm-blur}[data-m-entrance=pop]{--tm-in:tm-pop}'
    + '[data-m-card=lift]{transition:transform .2s ease,filter .2s ease}[data-m-card=lift]:hover,[data-m-card=lift]:active{transform:translateY(-4px)}'
    + '[data-m-action=pulse]{animation:var(--tm-in,none) .55s cubic-bezier(.2,.8,.2,1) both,tm-pulse 2.4s ease-in-out 1s infinite}'
    + '@media(prefers-reduced-motion:reduce){[data-m-entrance],[data-m-card],[data-m-action]{animation:none!important;transition:none!important}}';
  /* Limpia un objeto {entrance,card,action} dejando solo ids válidos de su tipo. */
  function normalize(raw) {
    const out = {}; if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    Object.keys(KINDS).forEach(k => { const m = get(raw[k]); if (m && m.kind === k) out[k] = m.id; });
    return out;
  }
  /* Atributos para un bloque según su rol, la animación elegida y su posición (para la cascada). */
  function attrs(motion, role, index) {
    const m = normalize(motion), a = {};
    if (m.entrance) { a['data-m-entrance'] = m.entrance; a.style = '--i:' + Math.min(index, 12); }
    if (m.card && role === 'cards') a['data-m-card'] = m.card;
    if (m.action && role === 'actions') a['data-m-action'] = m.action;
    return a;
  }
  const attrString = a => Object.keys(a).map(k => ' ' + k + '="' + String(a[k]).replace(/[^\w:;.\-\s]/g, '') + '"').join('');
  root.TintaMotion = { KINDS, LIST, CSS, get, normalize, attrs, attrString };
  if (typeof module !== 'undefined') module.exports = root.TintaMotion;
})(typeof window !== 'undefined' ? window : globalThis);
