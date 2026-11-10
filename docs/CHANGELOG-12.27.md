# 12.27 · Diseño «estudio» en móvil

La interfaz de Tinta en pantallas de hasta 720 px pasa a un diseño más compacto y de herramienta de diseño. En escritorio la navegación no cambia.

- **Barra superior de una línea**: logo, deshacer/rehacer (como iconos), tema y menú. Antes ocupaba unos 190 px.
- **Barra inferior fija**: Tu idea, Los bloques, Tu pantalla y Proyectos.
- **Tu idea**: fondo con degradado, titular grande, el cuadro de texto con borde de color y su botón caben en la primera pantalla; la mascota va junto al titular.
- **Los bloques**: mosaico de cinco secciones (Plantillas, Paletas, Animaciones, Tarjetas, Avatares) que salta a cada una y aplica su filtro; filtros en una fila deslizable; galería en dos columnas con vistas previas recortadas; la bandeja de selección solo aparece cuando eliges algo y queda sobre la barra inferior.
- **Tu pantalla**: el lienzo con el móvil va primero, sobre una rejilla de puntos; las pantallas y las acciones del proyecto son filas deslizables.
- Tema oscuro: las tarjetas de la galería pasan a fondo oscuro y se corrigen tres textos con poco contraste.
- Nueva prueba `tests/tinta-estudio.cjs` (móvil, claro y oscuro, con axe-core).

Pendiente respecto al prototipo (`preview/estilos-estudio.html`): tira de miniaturas de las pantallas, barra de herramientas flotante y acento de la interfaz según la paleta.
