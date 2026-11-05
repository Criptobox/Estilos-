# Estilos 11.0

## Copia de seguridad completa
- La copia `.json` incluye ahora el proyecto del constructor (pantallas, capas, imágenes), los temas guardados y las capturas propias, además de los estilos, ediciones y borrados. Antes se perdía el proyecto si se borraban los datos del navegador.
- Importar restaura todo; el proyecto importado se puede deshacer desde el constructor. Límite del archivo: 60 MB.
- El cuadro de texto («Mostrar mis cambios») exporta sin imágenes para que sea manejable.

## Imágenes del constructor en IndexedDB
- Las fotos reemplazadas ya no viven dentro de `localStorage` (límite habitual de ~5 MB, que se llenaba con pocas fotos y mostraba «No se pudo guardar el constructor»). En el JSON del proyecto queda solo una referencia `idb:<id>`.
- Los proyectos antiguos se migran solos al abrir la app. Si IndexedDB no está disponible, todo sigue como antes (imágenes dentro del JSON).
- Las imágenes que ya no usa ni el proyecto ni el historial se eliminan al arrancar.

## Historial que sobrevive a las recargas
- Deshacer y rehacer se conservan al recargar la página (misma pestaña, `sessionStorage`). Si el historial pesa más de ~1,8 MB no se guarda.

## Ediciones más robustas
- Cada edición de texto o imagen guarda, además de su ruta, la etiqueta y el texto original del nodo (`editMeta`). Al aplicarla se comprueba que sigue siendo el mismo nodo; si el diseño cambió, se busca por etiqueta y texto y, si no hay una coincidencia clara, se omite en lugar de editar el elemento que haya caído en esa posición. Las ediciones antiguas, sin metadatos, se aplican como siempre.

## Tamaños de pantalla
- Selector en la vista previa: móvil pequeño (360×740), móvil (390×844), móvil grande (430×932) y tablet (768×1024). Se guarda con el proyecto y la página exportada usa el ancho elegido.

## Exportar
- **ZIP**: `index.html` + `assets/` (HTML estático listo para publicar) y `react/` (proyecto Vite con React: `npm install && npm run dev`). Las imágenes van como archivos, no como base64.
- **Modo oscuro automático** (opcional) para la página exportada: oscurece el marco con `prefers-color-scheme`; los colores de tus bloques no cambian.

## Paleta → constructor
- En la paleta sacada de una captura, «Aplicar al constructor» fija el color principal y el fondo del proyecto y la guarda como tema reutilizable.

## Accesibilidad del panel de capas
- Los botones de ocultar, bloquear, subir, bajar, duplicar y eliminar usan iconos SVG en lugar de emojis, con `aria-label` que incluye el nombre de la capa y `aria-pressed` para ocultar y bloquear. Las carpetas indican `aria-expanded`.

## Pruebas automáticas
- `tests/e2e.cjs` (Playwright + Chromium) y workflow `.github/workflows/tests.yml`: se ejecutan en cada push a `main` y en cada pull request.

## Verificación
- 67 comprobaciones de extremo a extremo correctas en Chromium (escritorio y móvil, claro y oscuro).
- El proyecto React exportado se instaló y compiló con Vite, y la app resultante navega entre pantallas.
- El APK no se ha compilado.
