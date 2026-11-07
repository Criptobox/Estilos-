# Deshacer y Rehacer · borrador de Tinta

## Uso

La barra de historial aparece debajo de la cabecera en Idea, Bloques y Pantalla. Deshacer y Rehacer indican con su nombre accesible y tooltip la próxima acción disponible. Se deshabilitan cuando no hay pasos. Los contadores anuncian el estado y avisan cuando se liberaron pasos antiguos.

Atajos: Ctrl/⌘+Z para deshacer; Ctrl/⌘+Mayús+Z o Ctrl+Y para rehacer. No se interceptan en input, textarea, select ni elementos editables, incluidos los campos dentro de Shadow DOM. Con diálogos abiertos el historial global está bloqueado; se conserva el comportamiento nativo de los campos y no se descartan propuestas en edición.

## Qué recupera

- Idea y recetas aplicadas.
- Selección, eliminación, orden y alternativas de encabezado/navegación.
- Textos y placeholders aplicados/restaurados.
- Fotos locales o URL, descripciones accesibles y destinos aplicados/restaurados.
- Variantes/estados iniciales aplicados y estilos personales de botones/tarjetas.
- Reinicio mediante «Empezar una selección nueva», como una sola acción reversible.

Previews, favoritos/checkbox/valores de demostración transitorios, búsqueda/filtros, navegación, tema y composición sin cambios de borrador no crean pasos. La escritura de la idea se agrupa por sesión de foco; una vista previa de estilo no entra hasta Aplicar. Guardar una copia, renombrarla, importarla, actualizarla o eliminarla no se deshace mediante esta barra.

Un cambio nuevo tras deshacer elimina la rama de rehacer; una acción sin cambios no la elimina. Componer o exportar después de deshacer usa el borrador recuperado, no el futuro de Rehacer. Recuperar invalida la marca de composición: se puede volver a componer para descargar.

## Aislamiento y persistencia

Se inicia una línea base al cargar la app y al confirmar Abrir proyecto. No permite cruzar del proyecto abierto al anterior. Crear/guardar una copia no reinicia el historial actual.

El historial solo está en memoria durante esta sesión. Recargar conserva el último borrador recuperado si se pudo guardar, pero comienza sin pasos. No se añade al JSON de proyecto ni al HTML exportado. No lee ni cambia el historial o las copias del editor clásico.

Si el almacenamiento está bloqueado o lleno, Deshacer/Rehacer sigue funcionando durante la sesión; se informa que no se pudo guardar y se recomienda descargar JSON. No se presenta la recuperación como persistencia exitosa.

## Implementación y límites

`web/js/tinta-history.js` mantiene diferencias por propiedad del borrador (brief, selected, choices, content, assets, ui, buttonStyles, cardStyles), con JSON interno y reutilización de valores iguales. No guarda una copia completa de todas las imágenes por cada cambio de color/texto.

Límite de 50 entradas y presupuesto aproximado de 16 MiB de cadenas serializadas. Se liberan las entradas más antiguas, con aviso. Se conserva al menos la última entrada aunque una sustitución de fotos grandes pueda exceder el presupuesto. No es una medición exacta de heap ni un respaldo permanente. Los campos de assets se registran como unidad, no como diferencias de píxeles.

Al recuperar se valida el borrador con los mismos normalizadores de proyecto, se actualizan selección, revisión y previews, se guarda sin generar un nuevo paso y se conserva la página actual salvo que Pantalla quede vacía (pasa a Bloques). Los textos temporales de un diálogo no se recuperan porque no pertenecen al borrador aplicado.

## Pruebas

`node tests/tinta-history.cjs`: 61 comprobaciones. Motor de diferencias, agrupación, no-op, ramas, límites y fotos grandes; selección/orden, previews descartadas, estilos de tarjeta/botón, textos, fotos/alt/destinos, variantes, alternativas, atajos, exclusión del tema/composición, exportación del estado recuperado, línea base de proyecto, reinicio reversible, recarga y almacenamiento bloqueado. Layouts 320/390/768/1440.

`python tools/build-tinta.py && node tests/tinta-standalone.cjs`: HTML autónomo en iframe `sandbox="allow-scripts"`; Deshacer/Rehacer también funciona sin almacenamiento.

Las pruebas no equivalen a una auditoría individual de accesibilidad de todos los diseños. Sin sincronización entre pestañas, historial persistente, push ni despliegue permanente.
