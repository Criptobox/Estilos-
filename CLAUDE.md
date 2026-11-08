# Estilos · reglas para agentes

Biblioteca UI y constructor visual (Tinta) que se está ampliando con una IA que arma pantallas. Plan completo: `docs/PLAN-IA-ESTILOS.md`.

## Reglas que no se rompen

1. **No inventar bloques.** Toda pantalla usa solo ids de `design-library/catalog.json`. Una pieza nueva se propone con la skill `add-block` y entra por PR.
2. **No editar `design-library/catalog.json` a mano.** Se genera con `tools/build-tinta-catalog.cjs`. Los huecos y reglas para la IA van en `design-library/ai-metadata.json`.
3. **No tocar `web/index.html` directamente.** La fuente es `web/crear.html`. Después: `python tools/sync-tinta-entry.py`.
4. **El HTML/CSS de un modelo se sanea siempre** y nunca ejecuta JavaScript.
5. **Sin secretos en el repositorio.** Claves en secretos de GitHub Actions o variables locales.
6. **El conjunto de evaluación (`ai/evals/`) nunca se usa para entrenar.**
7. `window.__tintaInspect` es solo para pruebas y herramientas: no lo uses desde código de la app.
8. Cambiar un esquema de `ai/spec/` o `design-library/*.schema.json` obliga a subir su versión y a actualizar `ai/tools/validate-ai.cjs`.

## Comprobar antes de cada commit

```sh
node ai/tools/validate-ai.cjs          # metadatos de IA, ScreenSpec de ejemplo, briefs
python tools/sync-tinta-entry.py --check
for f in web/js/*.js web/sw.js; do node --check "$f"; done
cd tests && npm test                   # Playwright (necesita npm ci y chromium); incluye ai-spec.cjs
```

## Mapa rápido

- `web/js/crear.js`: definiciones de los bloques de Tinta (`id`, `role`, `html`, `css`) y recetas por palabras.
- `web/js/tinta-library.js`, `tinta-catalog.js`: biblioteca y render.
- `design-library/`: catálogo, esquema y metadatos de IA.
- `ai/spec/`: esquema de `ScreenSpec` y ejemplos.
- `ai/tools/`: `validate-ai.cjs` (validación sin navegador) y `spec-to-tinta.cjs` (convierte una pantalla a proyecto de Tinta y la dibuja).
- `ai/evals/briefs/`: briefs de oro (JSONL).
- `.claude/skills/`: procedimientos repetibles (`add-block`, `compose-screen`).

## Convenciones

- Textos de interfaz en español, sin jerga ("pantalla" y "bloque", no "spec" ni "slot").
- Cada cambio de producto lleva su `docs/CHANGELOG-x.y.md` y sube `version.json`.
- Roles de composición actuales: `header`, `cards`, `actions`, `nav`.
