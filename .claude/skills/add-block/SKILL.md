---
name: add-block
description: Añade o documenta un bloque de la biblioteca de Estilos para que la IA pueda usarlo. Úsala cuando llegue un diseño nuevo o cuando un bloque existente no tenga huecos y reglas en design-library/ai-metadata.json.
---

# add-block

Deja un bloque listo para que la IA lo use: ficha en el catálogo, huecos, reglas y validación.

## Pasos

1. **Localizar el bloque.** Si es nuevo, defínelo en `web/js/crear.js` con `id`, `role` (`header`, `cards`, `actions` o `nav`), `html` y `css`. Si ya existe, busca su definición ahí.
2. **Regenerar el catálogo** con `node tools/build-tinta-catalog.cjs`. No edites `catalog.json` a mano.
3. **Declarar los huecos** en `design-library/ai-metadata.json`:
   - Un hueco por cada texto, color, imagen o enlace editable.
   - `selector` CSS que apunte al elemento dentro del HTML del bloque. Comprueba que existe leyendo el `html` del bloque.
   - `max` de caracteres según el espacio real del diseño. `required: true` solo para lo que el bloque no puede mostrar vacío.
4. **Declarar las reglas**: `role`, `position` (`top`, `body`, `bottom`), `max_per_screen`, y `pairs_with` / `conflicts_with` con ids reales.
5. **Escribir `ai.when_to_use` y `ai.avoid_when`** en español, concretos, una frase cada uno. Los revisa una persona antes del PR.
6. **Validar:** `node ai/tools/validate-ai.cjs` debe terminar con ✓, y `node tests/run-all.cjs ai-spec` debe pasar: comprueba que cada selector apunta a textos reales. Si un hueco "corresponde a N textos", Tinta numera los textos nodo a nodo: usa `own: true` y `parts: N` (título con salto de línea) o separa en dos huecos (precio y decimales).
7. **Revisar accesibilidad** del bloque: contraste AA, tamaño táctil de 44 px en botones, etiquetas en los botones sin texto.
8. **Cerrar:** entrada en el changelog, subir `version.json` y abrir PR. Usa la plantilla del PR.

## Reglas

- No inventes ids ni selectores: lee el HTML del bloque.
- Si el bloque no tiene huecos editables, declara `"slots": []`.
- No cambies el comportamiento visual de bloques existentes en esta skill.
