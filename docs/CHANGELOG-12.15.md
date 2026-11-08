# 12.15 · Mis estilos

- **«＋ Crear mi estilo»** en «Los bloques»: editor con **vista previa en vivo** (nombre, categoría, diseño base, colores #RRGGBB, radio, modo claro/oscuro, descripción, consejo y código propio opcional).
- Los estilos propios aparecen en la colección **«Mis estilos»** (filtro nuevo) y se usan como cualquier otro diseño: elegir, plantillas, paletas, animaciones, exportar.
- Desde la ficha de un estilo propio: **Editar** y **Eliminar** (en dos pasos, sin diálogos nativos). Eliminar lo quita también de favoritos y recientes.
- **«Crear mi estilo a partir de este»** en la ficha de cualquier diseño de la biblioteca: lo copia como punto de partida.
- Se guardan en el **mismo almacén que la biblioteca clásica** (`estilos-user-v2`): lo creado en una se ve en la otra, y se conservan sus ediciones y borrados de diseños originales.
- Seguridad: el código propio se sanea siempre al dibujarlo (sin scripts, manejadores `on*`, `iframe` ni enlaces `javascript:`); nombres y descripciones se muestran como texto; colores, radio y diseño base se validan; tope de 200 estilos.
- Pruebas: `tests/tinta-mystyles.cjs` (35 comprobaciones).

Con esto Tinta cubre lo que la biblioteca clásica ofrecía para estilos: favoritos, recientes, PNG/SVG, paletas y crear/editar/borrar. Quedan solo el constructor antiguo, las imágenes de referencia y la copia de seguridad completa.
