# 12.62 · Equipo de diseño (8 agentes)

Basado en la referencia «Estudio IA 2.0» que trajiste.

- Botón «Crear con el equipo de diseño» en Tu idea. Ocho especialistas trabajan uno tras otro: Investigador, Arquitecto, Diseñador UX, Diseñador UI, UX Writer, Accesibilidad, Frontend y Crítico.
- Cada agente es un robot cubo 3D con su objeto de trabajo animado (lupa y radar, plano que se arma, piezas de puzle, pinceles y muestras, líneas de texto, láser de contraste con sello AA, etiquetas de código, monóculo). Línea de tiempo de colores, borde giratorio en el agente activo, inclinación 3D, confeti, y controles de pausa, velocidad y repetir.
- El trabajo es real, no una simulación: el equipo aplica cada versión en silencio, la mide y deja tu pantalla como estaba. Cada agente muestra su dato verdadero: sector y plantillas afines, pantallas que genera la app (con sus nombres), bloques de Inicio, paleta y letra, textos adaptados, ajustes de contraste hechos y KB de HTML exportable.
- El Crítico revisa lo típico (cabecera con buscador, paleta típica del sector), lo largo y lo repetido, y propone una versión distinta (modo contrario, otra paleta de la misma familia, otra letra, cabecera simple). Elige Equipo, Mezclar (estructura del equipo + estilo del Crítico) o Crítico, con vista de colores de las dos.
- Si hay una IA conectada, ella propone la estructura (con el mismo reintento corregido que «Generar con mi IA»); si no, la propone el motor local de Tinta, sin conexión.
- Medir las versiones no cambia tu idea ni tu borrador; la elegida se aplica como una plantilla y se puede deshacer con Ctrl+Z.
- `web/css/equipo.css` va completo bajo `.eq` (no toca el resto de la app) y respeta «reducir movimiento».
- Pruebas: 5 unitarias (`equipo.test.cjs`) y e2e `tinta-equipo.cjs`.
