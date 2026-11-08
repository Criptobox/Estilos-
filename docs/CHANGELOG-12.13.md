# 12.13 · Recientes y descarga PNG/SVG

- **«↺ Recientes»** en «Los bloques»: filtro con los últimos 24 diseños que abriste o elegiste, del más reciente al más antiguo. Comparte datos con la biblioteca clásica (los recientes que ya tenías aparecen) y conserva los ids que Tinta no conoce.
- **Descargar PNG / SVG** del componente desde su ficha (a la vista, ya no solo el HTML). Se exporta con tus ajustes actuales de texto, color y estilo.
- El SVG es **inerte**: se eliminan scripts, manejadores `on*`, `iframe` y enlaces `javascript:` antes de exportar, porque un SVG abierto suelto sí ejecutaría código.
- Pruebas: `tests/tinta-recientes-imagen.cjs` (17 comprobaciones, incluida una de seguridad del SVG y la validez del PNG).
