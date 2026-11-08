# 12.11 · Secciones web: Tinta compone también páginas

- **10 secciones web nuevas** con la piel de Tinta, en el módulo `web-sections` (antes vacío): héroe centrado, héroe con figura, beneficios en lista, plan de precios, testimonio, cifras clave, llamada final en grafito, llamada final coral, pie de página claro y pie en grafito. Usan los roles de siempre (encabezado, tarjetas, botones, barra inferior), así que se eligen, ordenan y exportan como cualquier otro bloque. El catálogo pasa de 138 a 148 recursos.
- **Una página web** en las ideas rápidas de la portada. El motor distingue por la idea si pides una app o una página («página web», «web», «landing», «sitio», «portafolio») y compone cada tipo por separado: nunca mezcla piezas de página y de app (hay un aviso nuevo, `mezcla-de-tipos`).
- Cada página tiene portada, llamada final y pie; entre medias, una o dos tarjetas (beneficios, precios, testimonio o cifras). El motor da tres propuestas distintas por sector.
- **Adaptar textos a la idea no toca las secciones web**: sus textos genéricos son neutros hasta que tengan copia propia por sector. Ejemplo completo con textos reales en `composer/spec/examples/cafe-web.screen.json`.
- Pruebas: tipo de pantalla, propuestas web, mezcla de tipos y flujo de la idea rápida en la app (203 comprobaciones del motor).
