/* Adaptar textos a la idea: detecta el sector del brief y propone textos coherentes
   para los campos de cada bloque. Motor de reglas local (sin red, sin IA): es puro y
   no toca el DOM; crear.js decide dónde aplicarlo. */
(function (root) {
  'use strict';
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const SECTORS = [
    { id: 'comida', name: 'Comida y café', words: ['cafe', 'cafeteria', 'restaurante', 'comida', 'pizza', 'pedido', 'menu', 'panaderia', 'bar ', 'sushi', 'hamburguesa', 'delivery'],
      titles: ['Café de la casa', 'Menú de hoy', 'Tu pedido', 'Recién horneado', 'Especial del día'], actions: ['Pedir ahora', 'Ver menú', 'Añadir al pedido', 'Reservar mesa'],
      notes: ['LISTO EN 10 MIN', 'NUEVO EN EL MENÚ', 'ENVÍO GRATIS'], highlights: ['Capuchino', 'Croissant', 'Combo desayuno'], numbers: ['$4.50', '$8.90', '12 min', '4.8'],
      texts: ['Preparado al momento con ingredientes frescos.', 'Elige tu favorito y lo llevamos a tu mesa.', 'Tu próximo antojo está a un toque.'], placeholders: ['Buscar platos o bebidas'] },
    { id: 'tienda', name: 'Tienda', words: ['tienda', 'ropa', 'comprar', 'compra', 'producto', 'catalogo', 'carrito', 'moda', 'zapatillas', 'ecommerce', 'envio'],
      titles: ['Nueva colección', 'Los más vendidos', 'Tu carrito', 'Ofertas de temporada', 'Recién llegado'], actions: ['Comprar ahora', 'Añadir al carrito', 'Ver colección', 'Ver detalles'],
      notes: ['ENVÍO GRATIS', 'NUEVO', 'ÚLTIMAS UNIDADES'], highlights: ['Edición limitada', 'Más vendido', '-20 %'], numbers: ['$39.90', '$59.00', '24 uds', '4.7'],
      texts: ['Calidad que se nota desde el primer día.', 'Cambios gratis durante 30 días.', 'Descubre lo que todos están eligiendo.'], placeholders: ['Buscar productos'] },
    { id: 'finanzas', name: 'Finanzas', words: ['finanzas', 'dinero', 'banco', 'ahorro', 'inversion', 'gastos', 'presupuesto', 'billetera', 'pagos', 'fintech', 'cripto'],
      titles: ['Tu saldo', 'Movimientos recientes', 'Meta de ahorro', 'Resumen del mes', 'Tus tarjetas'], actions: ['Enviar dinero', 'Ver movimientos', 'Añadir fondos', 'Invertir'],
      notes: ['ESTE MES', 'ACTUALIZADO HOY', 'META 65 %'], highlights: ['Ahorro', 'Ingresos', 'Gastos'], numbers: ['$2,480.00', '$24,380', '+3.2 %', '65 %'],
      texts: ['Controla tus gastos sin esfuerzo.', 'Tu dinero, siempre a la vista y seguro.', 'Vas por buen camino este mes.'], placeholders: ['Buscar movimientos'] },
    { id: 'fitness', name: 'Fitness', words: ['fitness', 'gimnasio', 'gym', 'entrenamiento', 'ejercicio', 'rutina', 'yoga', 'running', 'deporte', 'correr'],
      titles: ['Entrenamiento de hoy', 'Tu racha', 'Rutina de fuerza', 'Reto semanal', 'Tu progreso'], actions: ['Empezar', 'Ver rutina', 'Retomar', 'Registrar sesión'],
      notes: ['RACHA DE 5 DÍAS', 'META SEMANAL', '30 MIN'], highlights: ['Fuerza', 'Cardio', 'Movilidad'], numbers: ['520 kcal', '8,200 pasos', '45 min', '5 días'],
      texts: ['Un paso más cerca de tu meta.', 'Constancia antes que intensidad.', 'Hoy toca piernas: tú puedes.'], placeholders: ['Buscar ejercicios'] },
    { id: 'viajes', name: 'Viajes', words: ['viaje', 'viajes', 'hotel', 'vuelo', 'turismo', 'destino', 'reserva', 'vacaciones', 'hospedaje'],
      titles: ['Próximo destino', 'Escapadas de fin de semana', 'Tu reserva', 'Lugares favoritos', 'Ofertas de vuelo'], actions: ['Reservar', 'Explorar destinos', 'Ver itinerario', 'Guardar viaje'],
      notes: ['DESDE $89', '3 NOCHES', 'CANCELACIÓN GRATIS'], highlights: ['Lisboa', 'Oaxaca', 'Kioto'], numbers: ['$420', '3 noches', '4.9', '2 viajeros'],
      texts: ['Vive el mundo a tu ritmo.', 'Planifica en minutos, viaja con calma.', 'Los mejores lugares, elegidos para ti.'], placeholders: ['¿A dónde quieres ir?'] },
    { id: 'salud', name: 'Salud', words: ['salud', 'medico', 'clinica', 'cita', 'bienestar', 'meditacion', 'terapia', 'farmacia', 'doctor', 'nutricion'],
      titles: ['Tu próxima cita', 'Resumen de salud', 'Recordatorios', 'Hábitos de hoy', 'Tu bienestar'], actions: ['Agendar cita', 'Ver historial', 'Hablar con un médico', 'Registrar'],
      notes: ['HOY 10:30', 'RECORDATORIO', 'TODO EN ORDEN'], highlights: ['Hidratación', 'Sueño', 'Medicación'], numbers: ['72 lpm', '7 h 40 min', '1.8 L', '98 %'],
      texts: ['Cuidarte es lo primero.', 'Tus datos, privados y bajo tu control.', 'Pequeños hábitos, grandes cambios.'], placeholders: ['Buscar especialistas'] },
    { id: 'musica', name: 'Música', words: ['musica', 'cancion', 'canciones', 'podcast', 'playlist', 'artista', 'concierto', 'reproductor', 'audio'],
      titles: ['Hecho para ti', 'Escuchado recientemente', 'Tus listas', 'Nuevos lanzamientos', 'En vivo esta semana'], actions: ['Reproducir', 'Seguir', 'Añadir a mi lista', 'Compartir'],
      notes: ['NUEVO ÁLBUM', 'EN VIVO', 'MIX DIARIO'], highlights: ['Indie', 'Electrónica', 'Acústico'], numbers: ['3:42', '12 temas', '1.2 M', '48 min'],
      texts: ['La banda sonora de tu día.', 'Descubre artistas que te van a encantar.', 'Dale play a tu estado de ánimo.'], placeholders: ['Buscar canciones o artistas'] },
    { id: 'educacion', name: 'Educación', words: ['curso', 'cursos', 'educacion', 'escuela', 'aprender', 'clases', 'estudiar', 'universidad', 'idiomas', 'academia', 'tutor'],
      titles: ['Continúa aprendiendo', 'Tus cursos', 'Lección de hoy', 'Próximos retos', 'Tu avance'], actions: ['Continuar', 'Empezar lección', 'Ver curso', 'Inscribirme'],
      notes: ['LECCIÓN 4 DE 12', 'NUEVO CURSO', 'CERTIFICADO'], highlights: ['Inglés', 'Diseño', 'Programación'], numbers: ['35 %', '12 lecciones', '4.8', '2 h 10 min'],
      texts: ['Aprende a tu ritmo, donde quieras.', 'Un poco cada día suma mucho.', 'Tu próximo logro empieza hoy.'], placeholders: ['Buscar cursos'] }
  ];
  function detect(brief) {
    const t = ' ' + norm(brief) + ' '; let best = null, score = 0;
    SECTORS.forEach(s => { const n = s.words.filter(w => t.includes(w.length > 3 || w.endsWith(' ') ? w : ' ' + w + ' ')).length; if (n > score) { score = n; best = s; } });
    return best ? { id: best.id, name: best.name } : null;
  }
  const isNumeric = v => /^[\s$€£+\-−%.,\d]*\d[\s$€£+\-−%.,\dkKmMhHlL]*$/.test(v) || /^\d+[\d.,]*\s?[a-zA-Z%]{1,6}$/.test(v);
  /* fields: [{label, value}] → array de textos (misma longitud). Un campo se mantiene
     igual (null → conserva el original) si es un icono/símbolo, un número de 1-2 cifras
     (insignias, pasos) o una etiqueta de navegación corta. */
  function fill(sectorId, fields, opts) {
    const s = SECTORS.find(x => x.id === sectorId); if (!s) return null;
    const o = (opts && opts.offset) || 0, c = { t: o, a: o, n: o, h: o, x: o, v: o, p: o };
    const pick = (pool, key, orig) => {
      const max = Math.max(14, Math.round(orig.length * 1.8));
      for (let i = 0; i < pool.length; i++) { const v = pool[(c[key] + i) % pool.length]; if (v.length <= max) { c[key] += i + 1; return v; } }
      c[key]++; return pool.slice().sort((a, b) => a.length - b.length)[0];
    };
    const out = [];
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i], v = String(f.value || '').trim(), next = fields[i + 1] ? String(fields[i + 1].value || '').trim() : '';
      if (out.length > i) continue;                                  /* ya resuelto como cola de un precio */
      /* Precio partido en dos textos («$4» + «.50»): se rellena como un solo precio. */
      if (/^[$€£]?\d+$/.test(v) && /^[.,]\d{1,2}$/.test(next)) {
        const price = pick([...new Set(s.numbers.filter(x => /^[$€£]\d+[.,]\d{2}$/.test(x)).concat(['$4.50', '$6.90', '$9.00', '$12.50']))], 'v', '$00.00'), m = /^([$€£]?\d+)([.,]\d{2})$/.exec(price);
        out[i] = m[1]; out[i + 1] = m[2]; continue;
      }
      if (!v || v.length <= 2 || /^[^\p{L}\p{N}]+$/u.test(v)) { out[i] = null; continue; }
      if (/^[.,]\d{1,2}$/.test(v)) { out[i] = null; continue; }    /* cola decimal suelta: se conserva */
      if (f.label === 'Placeholder') out[i] = pick(s.placeholders, 'p', v);
      else if (isNumeric(v)) out[i] = pick(s.numbers, 'v', v);
      else if (f.label === 'Acción') out[i] = v.length <= 8 && !/\s/.test(v) ? null : pick(s.actions, 'a', v);
      else if (f.label === 'Título') out[i] = pick(s.titles, 't', v);
      else if (f.label === 'Nota') out[i] = pick(s.notes, 'n', v);
      else if (f.label === 'Destacado') out[i] = pick(s.highlights, 'h', v);
      else out[i] = v.length < 6 ? null : pick(s.texts, 'x', v);
    }
    return out;
  }
  root.TintaSectors = { SECTORS, detect, fill, norm };
  if (typeof module !== 'undefined') module.exports = root.TintaSectors;
})(typeof window !== 'undefined' ? window : globalThis);
