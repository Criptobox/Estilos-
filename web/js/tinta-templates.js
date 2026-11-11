/* Plantillas completas: pantallas enteras (cabecera + tarjetas con copias + acción + barra)
   que se cargan de una vez y se adaptan a la idea del sector. Son datos puros: crear.js las
   dibuja y las aplica. Los bloques son ids del catálogo de Tinta. */
(function (root) {
  'use strict';
  const LIST = [
    { id: 'tpl-cafeteria', sector: 'comida', name: 'Cafetería · inicio', desc: 'Saludo con buscador, dos platos destacados, tres de la carta y un botón para pedir.', brief: 'Una app para mi cafetería, con tarjetas grandes y una barra inferior', blocks: [{ id: 'h-search' }, { id: 'c-coffee', repeat: 2 }, { id: 'c-menu-item', repeat: 3 }, { id: 'a-coral' }, { id: 'n-soft' }] },
    { id: 'tpl-tienda', sector: 'tienda', name: 'Tienda · catálogo', desc: 'Buscador, cuatro productos con etiqueta de oferta y compra con un toque.', brief: 'Una tienda de ropa con catálogo y compra rápida', blocks: [{ id: 'h-search' }, { id: 'c-shop', repeat: 4 }, { id: 'a-dark' }, { id: 'n-float' }] },
    { id: 'tpl-finanzas', sector: 'finanzas', name: 'Finanzas · resumen', desc: 'Título limpio, tu saldo, cuatro movimientos y acción de enviar.', brief: 'Mis finanzas: saldo, gastos y ahorro', blocks: [{ id: 'h-minimal' }, { id: 'c-balance' }, { id: 'c-txn', repeat: 4 }, { id: 'a-soft' }, { id: 'n-dark' }] },
    { id: 'tpl-fitness', sector: 'fitness', name: 'Fitness · entrenamiento', desc: 'Tres entrenamientos con duración y progreso, y botón para empezar.', brief: 'Una app de gimnasio con rutinas y retos', blocks: [{ id: 'h-minimal' }, { id: 'c-workout', repeat: 3 }, { id: 'a-coral' }, { id: 'n-float' }] },
    { id: 'tpl-viajes', sector: 'viajes', name: 'Viajes · destinos', desc: 'Buscador de destinos, tres destinos con foto grande y botón de reservar.', brief: 'Una app de viajes para reservar destinos y hoteles', blocks: [{ id: 'h-search' }, { id: 'c-destino', repeat: 3 }, { id: 'a-dark' }, { id: 'n-soft' }] },
    { id: 'tpl-salud', sector: 'salud', name: 'Salud · bienestar', desc: 'Tres citas con especialistas y horarios, y botón de agendar.', brief: 'Una app de salud con citas y hábitos de bienestar', blocks: [{ id: 'h-minimal' }, { id: 'c-cita', repeat: 3 }, { id: 'a-soft' }, { id: 'n-soft' }] },
    { id: 'tpl-musica', sector: 'musica', name: 'Música · para ti', desc: 'Buscador, cinco pistas con carátula y botón de reproducir.', brief: 'Un reproductor de música con playlists y artistas', blocks: [{ id: 'h-search' }, { id: 'c-track', repeat: 5 }, { id: 'a-dark' }, { id: 'n-dark' }] },
    { id: 'tpl-panel', sector: 'finanzas', name: 'Panel de control', desc: 'Gráfico de línea, reparto en anillo, tu saldo, últimos movimientos, tareas y calendario.', brief: 'Mis finanzas: un panel con gráficos, calendario y tareas', blocks: [{ id: 'h-minimal' }, { id: 'c-balance' }, { id: 'w-linea' }, { id: 'w-donut' }, { id: 'w-tareas' }, { id: 'w-calendario' }, { id: 'c-txn', repeat: 3 }, { id: 'a-soft' }, { id: 'n-dark' }] },
    { id: 'tpl-educacion', sector: 'educacion', name: 'Educación · mis cursos', desc: 'Tres cursos con barra de avance y botón de continuar.', brief: 'Una academia de cursos para aprender idiomas', blocks: [{ id: 'h-minimal' }, { id: 'c-course', repeat: 3 }, { id: 'a-coral' }, { id: 'n-soft' }] },
    { id: 'tpl-compra', sector: 'tienda', name: 'Tienda · compra completa', desc: 'Buscador, banner de oferta, categorías en círculos y listado de productos.', brief: 'Una tienda de ropa con catálogo y compra rápida', blocks: [{ id: 'h-search' }, { id: 'r-banner' }, { id: 'r-categorias' }, { id: 'r-fila-producto', repeat: 3 }, { id: 'a-dark' }, { id: 'n-pastilla-negra' }] },
    { id: 'tpl-tienda-oscura', sector: 'tienda', name: 'Tienda oscura · destacados', desc: 'Banner, cuadrícula de productos, resumen de la compra y barra de cristal.', brief: 'Una tienda de tecnología con compra rápida', blocks: [{ id: 'h-search' }, { id: 'r-banner' }, { id: 'r-grid-producto', repeat: 2 }, { id: 'r-resumen' }, { id: 'a-coral' }, { id: 'n-cristal' }] },
    { id: 'tpl-envios', sector: 'tienda', name: 'Envíos · pedidos', desc: 'Servicios, pedidos con estado, mapa con ruta y métodos de pago.', brief: 'Una tienda de paquetería con envíos y pedidos', blocks: [{ id: 'h-minimal' }, { id: 'r-servicios' }, { id: 'r-pedido', repeat: 2 }, { id: 'r-ruta' }, { id: 'r-metodos-pago' }, { id: 'a-dark' }, { id: 'n-pastilla-activa' }] },
    { id: 'tpl-doctores', sector: 'salud', name: 'Salud · doctores', desc: 'Cabecera con degradado, especialistas, fecha y hora para reservar.', brief: 'Una app de salud para reservar citas con doctores', blocks: [{ id: 'h-degradado' }, { id: 'r-medico', repeat: 3 }, { id: 'r-fechas' }, { id: 'a-soft' }, { id: 'n-pastilla-negra' }] },
    { id: 'tpl-asistente', sector: 'educacion', name: 'Asistente de IA', desc: 'Orbe luminoso, campo de mensaje y atajos sobre fondo oscuro.', brief: 'Un asistente de ayuda para aprender cursos', blocks: [{ id: 'h-minimal' }, { id: 'r-ia-prompt' }, { id: 'c-course', repeat: 2 }, { id: 'n-tres-minima' }] },
    { id: 'tpl-agentes', sector: 'finanzas', name: 'Panel de agentes', desc: 'Tres cifras clave, agentes con progreso y gráfico de línea.', brief: 'Mis finanzas con un panel de agentes automáticos', blocks: [{ id: 'h-minimal' }, { id: 'r-stats3' }, { id: 'w-linea' }, { id: 'r-agente', repeat: 3 }, { id: 'n-cristal' }] }
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
