---
name: add-block
description: Añade o documenta un bloque de la biblioteca de Estilos para que el motor de composición de Tinta (y cualquier otro proponente) pueda usarlo. Úsala cuando llegue un diseño nuevo o cuando un bloque existente no tenga huecos y reglas en design-library/composition.json.
---

# add-block

Deja un bloque listo para que el motor de Tinta lo use: ficha en el catálogo, huecos, reglas y validación.

## Pasos

1. **Localizar el bloque.** Si es nuevo, defínelo en `web/js/crear.js` con `id`, `role` (`header`, `cards`, `actions` o `nav`), `html` y `css`. Para una sección web añade `catalogModule:'web-sections'`, `subcategory:'Secciones web'` y, si sus textos genéricos no deben pasar por «Adaptar textos», `adapt:false`; registra su familia en `newFamilies` de `web/js/tinta-catalog.js`. Pon `text-align:left` en su raíz: la galería centra el texto. Míralo renderizado antes de describirlo. Si ya existe, busca su definición ahí.
2. **Regenerar el catálogo** con `node tools/build-tinta-catalog.cjs`. No edites `catalog.json` a mano.
3. **Declarar los atributos de diseño** en `design-library/composition.json`, bloque `design`: `tones` (calido, sobrio, energico, editorial), `accent` (coral, azul, violeta, grafito, neutro), `weight` (ligero, medio, fuerte), `family` (`tinta` o `biblioteca`: el estilo visual, que no se mezcla) y `kind` (`app` o `web`: no se mezclan en una pantalla) y `affinity` de 0 a 3 para cada uno de los 8 sectores. Son las que usa el motor de Tinta para decidir cuándo proponer el bloque, así que sé honesto: 0 es «no encaja».
3b. **Declarar los huecos** en el mismo archivo:
   - Un hueco por cada texto, color, imagen o enlace editable.
   - `selector` CSS que apunte al elemento dentro del HTML del bloque. Comprueba que existe leyendo el `html` del bloque.
   - `max` de caracteres según el espacio real del diseño. `required: true` solo para lo que el bloque no puede mostrar vacío.
4. **Declarar las reglas**: `role`, `position` (`top`, `body`, `bottom`), `max_per_screen`, y `pairs_with` / `conflicts_with` con ids reales. Para una tarjeta de página web añade `rank` (1 = arriba): el motor ordena las secciones por él.
5. **Escribir `guide.when_to_use` y `guide.avoid_when`** en español, concretos, una frase cada uno. Los revisa una persona antes del PR.
5a. **Copia por sector (secciones web):** si el bloque debe llegar con textos de su sector, añádelo a un grupo de `design-library/copy.json` y escribe sus valores en los 8 sectores. Cada valor debe caber en su hueco. Las cifras y nombres son ejemplos para sustituir.
5b. **Regenerar los datos del motor:** `node tools/build-composition-data.cjs`.
6. **Validar:** `node composer/tools/validate-composer.cjs` debe terminar con ✓, y `node tests/run-all.cjs composer-spec` debe pasar: comprueba que cada selector apunta a textos reales. Si un hueco "corresponde a N textos", Tinta numera los textos nodo a nodo: usa `own: true` y `parts: N` (título con salto de línea) o separa en dos huecos (precio y decimales).
7. **Revisar accesibilidad** del bloque: contraste AA, tamaño táctil de 44 px en botones, etiquetas en los botones sin texto.
8. **Cerrar:** entrada en el changelog, subir `version.json` y abrir PR. Usa la plantilla del PR.

## Reglas

- No inventes ids ni selectores: lee el HTML del bloque.
- Si el bloque no tiene huecos editables, declara `"slots": []`.
- No cambies el comportamiento visual de bloques existentes en esta skill.
