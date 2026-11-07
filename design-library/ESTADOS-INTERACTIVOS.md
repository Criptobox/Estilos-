# Estados y variantes · primera entrega

## Alcance implementado

Se mantienen los **138 IDs** del catálogo y los formatos de proyecto existentes. Esta primera entrega habilita un controlador local en cinco recursos:

| Recurso | Variantes configurables | Estados / comportamiento |
|---|---|---|
| `a-dark` · Acción en grafito | Original, con borde, suave | Normal, hover, foco, pressed, disabled, loading, success, error. La activación normal ejecuta una demostración local de 900 ms con bloqueo de doble pulsación y feedback. |
| `a-coral` · Acción coral | Original, con borde, suave | Mismo controlador de acción; se conserva el diseño base coral en Original. |
| `a-soft` · Acción suave | Original, con borde, suave | Mismo controlador de acción; se conserva la estructura de la acción suave. |
| `c-coffee` · Producto con aire | Original, compacta, horizontal | Normal, hover, foco, seleccionado y disabled. Checkbox nativo de selección y favorito con `aria-pressed`, accesibles por teclado. |
| `lib-for-5` · Campo con validación | Original, con borde, suave | Campos reales de nombre/correo/teléfono, etiquetas visibles, estados normal/disabled/error/success, validación al salir o al comprobar y foco en el primer error. |

Los demás recursos siguen disponibles como antes, sin anunciarles estos estados por el hecho de pertenecer al mismo módulo. Si se cambia el código/variante del campo de la biblioteca y deja de ser compatible, no se fuerza el controlador sobre esa estructura.

## Uso

1. En Bloques, pulsar **Probar estados interactivos** para localizar los cinco recursos.
2. Ampliar un recurso y usar el laboratorio bajo la vista previa.
3. Probar con ratón, tacto o teclado. El botón de foco lleva el foco al primer control habilitado; Tab/Mayús+Tab recorren los controles.
4. Cambiar variante/estado inicial solo modifica la demostración temporal.
5. **Usar variante y estado** conserva el ajuste, pero no elige ni reemplaza bloques. **Elegir bloque** sigue siendo independiente.
6. Guardar o actualizar un proyecto conserva esos ajustes. Restaurar original no elimina textos, fotos, enlaces ni selecciones.

El estado inicial **Cargando** es un preset fijo para inspeccionarlo, no una petición en curso. En estado Normal, activar una acción sin destino configurado muestra la secuencia local carga → completado. Error y correcto en los campos son presets de ejemplo; al escribir/comprobar, la validación evalúa el valor actual.

## Persistencia y exportación

- El borrador y los proyectos guardan un campo opcional `ui`, por ID, con `mode` y `variant` de listas permitidas.
- Los JSON anteriores, sin `ui`, siguen siendo válidos. La importación rechaza configuraciones desconocidas, sin ejecutar código proporcionado en el archivo.
- Solo se guarda la configuración inicial. Los valores que se escriben en la demostración, los favoritos transitorios y la secuencia de carga no se guardan automáticamente como contenido del proyecto.
- La pantalla y el componente HTML descargados incluyen el mismo controlador de JavaScript local, sin dependencias externas. Solo los hosts marcados por el exportador reciben ese controlador; no se habilitan scripts de usuario.
- Los destinos configurados mediante Foto / enlace se mantienen: no se sustituyen por la demostración de acción. Los estados deshabilitado/cargando sí bloquean su activación.
- El editor bloquea la navegación externa; el HTML exportado conserva enlaces reales.
- Si el almacenamiento está bloqueado, el laboratorio informa que el ajuste solo vive en la sesión. El proyecto se puede descargar como JSON donde el navegador permita descargas.

## Accesibilidad y límites

Hay foco visible, elementos nativos, `disabled`, `aria-busy`, `aria-pressed`, `aria-invalid`, mensajes asociados por `aria-describedby` y feedback anunciado mediante regiones de estado. Las animaciones respetan `prefers-reduced-motion`.

Esto **no es una certificación WCAG**. Contraste integral, lector de pantalla, procedencia/licencia y responsive individual mantienen su estado de auditoría pendiente en las fichas. El catálogo distingue los cinco controladores locales del resto de demos visuales y declara JavaScript únicamente donde corresponde.

No se envían formularios, no hay autenticación, compra, pago ni verificación de correo/teléfono en un servidor. Los mensajes hablan de formato o demostración, no de operaciones reales.

## Fuentes y pruebas

- `web/js/tinta-states.js`: configuración permitida, materialización HTML/CSS y controlador compartido de preview/exportación.
- `tests/tinta-states.cjs`: estados, teclado, variantes, proyectos/JSON, exportación funcional, reduced motion y tamaños del laboratorio.
- `tests/tinta-standalone.cjs`: funcionamiento dentro de un iframe aislado, con almacenamiento bloqueado.

Regenerar el inventario: `node tools/build-tinta-catalog.cjs`. Generar la copia autónoma: `python tools/build-tinta.py`.
