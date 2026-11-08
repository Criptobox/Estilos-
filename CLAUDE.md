# Estilos · reglas para agentes

Biblioteca UI y constructor visual (Tinta). **Tinta debe crear buenos diseños sin IA**: el motor local (`web/js/tinta-composer.js`) compone con reglas y datos. Una IA puede sumarse después como proponente opcional. Plan completo: `docs/PLAN-IA-ESTILOS.md`.

## Reglas que no se rompen

1. **No inventar bloques.** Toda pantalla usa solo ids de `design-library/catalog.json`. Una pieza nueva se propone con la skill `add-block` y entra por PR.
2. **No editar `design-library/catalog.json` a mano.** Se genera con `tools/build-tinta-catalog.cjs`. Los huecos, reglas y atributos de diseño van en `design-library/composition.json`; tras editarlo, `node tools/build-composition-data.cjs` regenera `web/js/tinta-composition-data.js` (no editar a mano).
3. **No tocar `web/index.html` directamente.** La fuente es `web/crear.html`. Después: `python tools/sync-tinta-entry.py`.
4. **El HTML/CSS de un modelo se sanea siempre** y nunca ejecuta JavaScript.
5. **Sin secretos en el repositorio.** Claves en secretos de GitHub Actions o variables locales.
6. **El conjunto de evaluación (`composer/evals/`) nunca se usa para entrenar.**
7. `window.__tintaInspect` es solo para pruebas y herramientas: no lo uses desde código de la app.
8. Cambiar un esquema de `composer/spec/` o `design-library/*.schema.json` obliga a subir su versión y a actualizar `composer/tools/validate-composer.cjs`.

## Comprobar antes de cada commit

```sh
node tools/build-composition-data.cjs --check
node composer/tools/validate-composer.cjs          # metadatos de composición, ScreenSpec de ejemplo, briefs
python tools/sync-tinta-entry.py --check
for f in web/js/*.js web/sw.js; do node --check "$f"; done
cd tests && npm test                   # Playwright (necesita npm ci y chromium); incluye composer-engine.cjs y composer-spec.cjs
```

## Mapa rápido

- `web/js/crear.js`: definiciones de los bloques de Tinta (`id`, `role`, `html`, `css`) y recetas por palabras.
- `web/js/tinta-library.js`, `tinta-catalog.js`: biblioteca y render.
- `web/js/tinta-composer.js`: motor de composición (propuestas, reglas de diseño, `lint`). Puro y determinista. `tinta-sectors.js` detecta el sector.
- `web/js/tinta-slots.js`: traduce los huecos de un bloque a los textos de Tinta (lo usan la app y `spec-to-tinta`).
- `tools/build-composition-data.cjs`: genera los datos del motor desde `composition.json` y `copy.json`.
- `design-library/`: catálogo, esquemas, metadatos de composición (`composition.json`) y copia por sector (`copy.json`, validada contra los huecos).
- `composer/spec/`: esquema de `ScreenSpec` y ejemplos.
- `composer/tools/`: `validate-composer.cjs` (validación sin navegador) y `spec-to-tinta.cjs` (convierte una pantalla a proyecto de Tinta y la dibuja).
- `composer/evals/briefs/`: briefs de oro (JSONL).
- `.claude/skills/`: procedimientos repetibles (`add-block`, `compose-screen`).

## Convenciones

- Textos de interfaz en español, sin jerga ("pantalla" y "bloque", no "spec" ni "slot").
- Cada cambio de producto lleva su `docs/CHANGELOG-x.y.md` y sube `version.json`.
- Roles de composición actuales: `header`, `cards`, `actions`, `nav`. Cada bloque es de tipo `app` o `web` (`design.kind`); las secciones web usan los mismos roles (héroe = encabezado, pie = barra inferior).
- Un bloque nuevo de Tinta lleva en `crear.js` `catalogModule` y `subcategory` si no es del módulo que le corresponde por su rol, y `adapt:false` si «Adaptar textos» no debe tocarlo.
- Un cambio en las reglas o datos del motor se acompaña de una prueba en `tests/composer-engine.cjs`. El motor no usa azar: mismas entradas, mismas propuestas.
