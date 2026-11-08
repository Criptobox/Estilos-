/* Paletas de Tinta: una capa de color para toda la pantalla (fondo, tarjetas y botones).
   Es una CAPA: no escribe estilos en cada bloque, así que se quita de un toque y alcanza también
   a los bloques que añadas después. Los estilos propios de un bloque (Diseño / Color) mandan sobre
   la paleta. Solo paletas claras: cabeceras y barras conservan su diseño original. */
(function (root) {
  'use strict';
  const LIST = [
    { id: 'tinta', name: 'Tinta', mood: 'Papel cálido y coral', bg: '#f5f4ef', surface: '#ffffff', accent: '#ff704b', accent2: '#ffb08f', ink: '#242421', line: '#e4e0d5' },
    { id: 'cafe', name: 'Café tostado', mood: 'Marrones cálidos', bg: '#f4ece1', surface: '#fffaf3', accent: '#8a5a3c', accent2: '#d9a066', ink: '#2b1d14', line: '#e7d8c4' },
    { id: 'oceano', name: 'Océano', mood: 'Azules limpios', bg: '#eaf3f6', surface: '#ffffff', accent: '#0e7490', accent2: '#67c6d9', ink: '#0f2a33', line: '#cfe3ea' },
    { id: 'bosque', name: 'Bosque', mood: 'Verdes naturales', bg: '#eef3ec', surface: '#fbfdf9', accent: '#2f6b3f', accent2: '#9fd3a8', ink: '#14281a', line: '#d4e2d1' },
    { id: 'lavanda', name: 'Lavanda', mood: 'Violetas suaves', bg: '#f1eefa', surface: '#ffffff', accent: '#6d5bd0', accent2: '#b7a9f0', ink: '#231d46', line: '#dcd6f2' },
    { id: 'atardecer', name: 'Atardecer', mood: 'Naranjas vivos', bg: '#fdf1ea', surface: '#fffaf6', accent: '#e4572e', accent2: '#ffb347', ink: '#3a1d12', line: '#f1d9cb' },
    { id: 'rosa', name: 'Rosa', mood: 'Rosas con carácter', bg: '#fbeff3', surface: '#ffffff', accent: '#c2335f', accent2: '#f4a6bf', ink: '#3a1224', line: '#f1d2dd' },
    { id: 'grafito', name: 'Grafito', mood: 'Neutros serios', bg: '#e9eaec', surface: '#ffffff', accent: '#2b2f36', accent2: '#8b93a1', ink: '#15171b', line: '#d5d8dd' }
  ];
  const HEX = /^#[0-9a-f]{6}$/i;
  const get = id => LIST.find(p => p.id === id) || null;
  const lum = c => { const [r, g, b] = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4); return r * .2126 + g * .7152 + b * .0722; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  /* Texto sobre el acento: el que más contraste dé. */
  const onAccent = c => contrast(c, '#ffffff') >= contrast(c, '#111111') ? '#ffffff' : '#111111';
  const normalize = id => (typeof id === 'string' && get(id)) ? id : null;
  const valid = p => ['bg', 'surface', 'accent', 'accent2', 'ink', 'line'].every(k => HEX.test(p[k]));
  root.TintaPalettes = { LIST, get, contrast, onAccent, normalize, valid };
  if (typeof module !== 'undefined') module.exports = root.TintaPalettes;
})(typeof window !== 'undefined' ? window : globalThis);
