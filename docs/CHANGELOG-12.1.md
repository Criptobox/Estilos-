# Estilos 12.1 — Creador móvil (fase 2 de 3)

## Qué cambia
- En pantallas de hasta 759 px el Creador deja de ser una página larga de paneles y pasa a ser un editor a pantalla completa: **el lienzo siempre queda visible**.
- **Barra superior**: volver, «Creador visual» con el selector de pantalla («Pantalla 1 de N»), deshacer, rehacer y capas.
- **Modos** Diseño / Código / Vista previa. Código muestra el HTML del componente seleccionado (con tus textos e imágenes) y las demás plataformas (Tailwind, Compose, SwiftUI, Flutter) con botón Copiar; Vista previa quita selección y asas.
- **Herramientas** abajo: Añadir, Estilos, Colores, Texto y Tamaño. Cada una abre una **hoja que empuja el lienzo hacia arriba** en vez de taparlo, así los cambios se ven mientras se ajustan:
  - Añadir: buscador y miniaturas reales por categoría; al tocar una se añade y la hoja se cierra. Un proyecto vacío abre «Añadir» solo.
  - Estilos: variante (Clásica, Glass, Soft UI, Outline, Bold), color de fondo, redondeo, espaciado, elevación y grosor del borde.
  - Colores: fondo, texto y borde con muestrario y selector personalizado.
  - Texto: nombre, tamaño, peso, alineación y los modos de edición directa de texto e imagen.
  - Tamaño: ancho, desplazamiento X/Y, animación y duración, y tamaño de la pantalla (móvil pequeño, móvil, móvil grande, tablet).
- **Barra de acciones** sobre el componente (sin hoja abierta): duplicar, eliminar, subir, bajar, bloquear y ocultar.
- **Capas y pantallas**: pantallas en pestañas, nombre de la pantalla, duplicar/eliminar pantalla, capas con asa de arrastre, carpetas, ojo y candado, deshacer/rehacer; desde ahí se llega a **Tema del proyecto** (colores, tipografía, redondeo, temas guardados) y a **Exportar y compartir**.
- La barra inferior de la app se oculta dentro del creador (más altura); al salir vuelve.
- En escritorio no cambia nada: sigue la distribución en columnas.

## Correcciones
- La carga diferida de las vistas previas medía contra `#view`; dentro de capas fijas (hojas del creador) las miniaturas no se dibujaban. Ahora mide contra la ventana.
- Los hijos de una hoja con `overflow` se comprimían hasta desaparecer (la tira de pantallas); ahora no se encogen.
- Las hojas llevan `scroll-padding-top` para que el desplazamiento automático no deje el contenido bajo la cabecera fija.

## Pruebas
- 144 comprobaciones de extremo a extremo (27 nuevas del creador móvil: herramientas, hojas, edición en vivo, modos, capas, exportar, escritorio sin cambios).

## Pendiente (fase 3)
- Detalle con Variantes/Uso/Relacionados, vistas propias de Paletas y Tipografías, Plantillas y exportar PNG/SVG.
