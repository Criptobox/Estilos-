/* Plantillas completas: pantallas enteras (cabecera + tarjetas con copias + acción + barra)
   que se cargan de una vez y se adaptan a la idea del sector. Son datos puros: crear.js las
   dibuja y las aplica. Los bloques son ids del catálogo de Tinta. */
(function (root) {
  'use strict';
  const LIST = [
    { id: 'tpl-cafeteria', sector: 'comida', name: 'Cafetería · inicio', desc: 'Saludo con buscador, cuatro productos del menú y un botón para pedir.', brief: 'Una app para mi cafetería, con tarjetas grandes y una barra inferior', blocks: [{ id: 'h-search' }, { id: 'c-coffee', repeat: 4 }, { id: 'a-coral' }, { id: 'n-soft' }] },
    { id: 'tpl-tienda', sector: 'tienda', name: 'Tienda · catálogo', desc: 'Buscador, cuatro productos destacados y compra con un toque.', brief: 'Una tienda de ropa con catálogo y compra rápida', blocks: [{ id: 'h-search' }, { id: 'c-coffee', repeat: 4 }, { id: 'a-dark' }, { id: 'n-float' }] },
    { id: 'tpl-finanzas', sector: 'finanzas', name: 'Finanzas · resumen', desc: 'Título limpio, tres tarjetas de saldo y movimientos, y acción de enviar.', brief: 'Mis finanzas: saldo, gastos y ahorro', blocks: [{ id: 'h-minimal' }, { id: 'c-balance', repeat: 3 }, { id: 'a-soft' }, { id: 'n-dark' }] },
    { id: 'tpl-fitness', sector: 'fitness', name: 'Fitness · entrenamiento', desc: 'Equipo y retos de la semana en tres tarjetas y botón para empezar.', brief: 'Una app de gimnasio con rutinas y retos', blocks: [{ id: 'h-minimal' }, { id: 'c-coffee', repeat: 3 }, { id: 'a-coral' }, { id: 'n-float' }] },
    { id: 'tpl-viajes', sector: 'viajes', name: 'Viajes · destinos', desc: 'Buscador de destinos, tres lugares destacados y botón de reservar.', brief: 'Una app de viajes para reservar destinos y hoteles', blocks: [{ id: 'h-search' }, { id: 'c-coffee', repeat: 3 }, { id: 'a-dark' }, { id: 'n-soft' }] },
    { id: 'tpl-salud', sector: 'salud', name: 'Salud · bienestar', desc: 'Tres tarjetas de bienestar del día y botón de agendar cita.', brief: 'Una app de salud con citas y hábitos de bienestar', blocks: [{ id: 'h-minimal' }, { id: 'c-coffee', repeat: 3 }, { id: 'a-soft' }, { id: 'n-soft' }] },
    { id: 'tpl-musica', sector: 'musica', name: 'Música · para ti', desc: 'Buscador, cuatro tarjetas de música y botón de reproducir.', brief: 'Un reproductor de música con playlists y artistas', blocks: [{ id: 'h-search' }, { id: 'c-coffee', repeat: 4 }, { id: 'a-dark' }, { id: 'n-dark' }] },
    { id: 'tpl-educacion', sector: 'educacion', name: 'Educación · mis cursos', desc: 'Tres tarjetas de curso y botón de continuar.', brief: 'Una academia de cursos para aprender idiomas', blocks: [{ id: 'h-minimal' }, { id: 'c-coffee', repeat: 3 }, { id: 'a-coral' }, { id: 'n-soft' }] }
  ];
  const get = id => LIST.find(t => t.id === id) || null;
  /* Comprueba una plantilla contra un catálogo {id: {role}}: devuelve [] si es válida. */
  function problems(t, byId) {
    const out = [], roles = t.blocks.map(b => byId[b.id] && byId[b.id].role);
    t.blocks.forEach(b => { if (!byId[b.id]) out.push('bloque desconocido ' + b.id); else if (b.repeat && (byId[b.id].role !== 'cards' || !Number.isInteger(b.repeat) || b.repeat < 2 || b.repeat > 6)) out.push('copias no válidas en ' + b.id); });
    if (roles.filter(r => r === 'header').length !== 1) out.push('debe tener exactamente un encabezado');
    if (roles.filter(r => r === 'nav').length !== 1) out.push('debe tener exactamente una barra inferior');
    if (!roles.includes('cards')) out.push('debe tener tarjetas');
    if (new Set(t.blocks.map(b => b.id)).size !== t.blocks.length) out.push('bloques repetidos');
    return out;
  }
  root.TintaTemplates = { LIST, get, problems };
  if (typeof module !== 'undefined') module.exports = root.TintaTemplates;
})(typeof window !== 'undefined' ? window : globalThis);
