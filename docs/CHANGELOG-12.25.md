# 12.25 · Modo noche y contraste garantizado

## 8 paletas oscuras
Noche, Neón, Galaxia, Carbón, Abismo, Brasa, Musgo y Lujo (24 paletas en total). Al elegir una, **toda la pantalla** pasa a modo noche: fondo, tarjetas, cabeceras, barras y avatares.

- La capa `TintaDark` reescribe el CSS de cada bloque: los fondos claros pasan a la superficie oscura, los bordes claros a la línea de la paleta, los botones negros al acento y cada texto se aclara hasta leerse.
- Las ilustraciones (SVG) y los colores vivos no cambian.
- La biblioteca sigue clara: el modo noche solo afecta a tus pantallas y a la exportación.
- Las mascotas (robot, orbe) ya encajan con el resto de la app.

## Guardián de contraste
Antes, las pantallas generadas tenían **176 textos** por debajo de WCAG AA (grises suaves sobre fondos claros, pestañas inactivas, botones de color). Ahora `TintaContrast` pinta cada bloque fuera de la vista, mide cada texto contra el fondo real que tiene detrás y, si no se lee, le da el tono más parecido que sí. Si es texto blanco sobre un botón de color, oscurece el botón. En las barras se miden los dos estados (pestaña activa e inactiva).

Resultado: **0 textos ilegibles** en las 8 plantillas × 4 pantallas, sin paleta, con paletas claras y con oscuras, también en el HTML exportado. Nueva prueba `tests/tinta-oscuras.cjs`.
