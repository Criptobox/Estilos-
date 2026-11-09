# 12.18 · Copia de seguridad completa

- Nuevo **«Copia de seguridad»** en el menú de Tinta: descarga **un solo archivo** (`estilos-copia-AAAA-MM-DD.json`) con tus proyectos de Tinta, estilos propios (con sus ediciones y borrados), favoritos, recientes, tema, tu pantalla de trabajo y lo guardado en el Editor. Las fotos que subiste a tus bloques viajan dentro de los proyectos.
- **Restaurar es no destructivo**: el archivo se revisa primero (se muestra qué contiene) y al aplicar solo **añade lo que falta como copias nuevas**; nunca borra ni sobrescribe lo que ya tienes. Tu pantalla de trabajo actual no se pisa: la de la copia entra como un proyecto más («Borrador de la copia»).
- **Idempotente**: restaurar dos veces el mismo archivo no duplica nada, y lo explica.
- **Seguridad**: se valida formato, versión, tamaño (máx. 8 MB) y tipos antes de tocar el almacenamiento; las claves ajenas del archivo se ignoran; los estilos pasan por la misma validación que al crearlos; máximo 30 proyectos y 200 estilos.
- Con esto Tinta cubre la copia de datos que ofrecía la biblioteca clásica. No incluye las imágenes de referencia de la clásica (se guardan aparte).
- Pruebas: `tests/tinta-backup.cjs` (29 comprobaciones). Una de ellas detectó, antes de publicar, que el tema (guardado como texto plano) se quedaba fuera de la copia.
