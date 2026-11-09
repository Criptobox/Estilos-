# Banco de pruebas del motor

Mide el motor de composición de Tinta (`web/js/tinta-composer.js`) con ideas de ejemplo. No usa navegador, red ni IA, y es determinista.

```sh
node composer/tools/eval-engine.cjs            # tabla de métricas y briefs con detección distinta de la esperada
node composer/tools/eval-engine.cjs --verbose  # además, los bloques que ningún brief llega a usar
node composer/tools/eval-engine.cjs --json     # todo en JSON
node composer/tools/eval-engine.cjs --update-baseline   # sube la línea base (solo si el cambio mejora o se justifica)
```

La prueba `tests/composer-evals.cjs` falla si el holdout no cumple `thresholds.json` o si alguna métrica baja respecto a `baseline.json`.

## Los briefs (`briefs/briefs.jsonl`)

Cada línea: `id`, `brief` (la idea, hasta 240 caracteres; puede estar vacía), `sector` (etiqueta humana), `screens`, `constraints` y:

- `split`: **`dev`** si el brief guio algún ajuste del motor o de sus datos; **`holdout`** si no.
- `expect`: `{ "kind": "app" | "web", "sector": id de sector | null }`. `null` significa que ningún sector debe detectarse.

**Regla del holdout.** La cifra que cuenta es la del holdout, porque son ideas que no se usaron para afinar. Si un brief del holdout falla y se mejora el motor *por él*, ese brief pasa a `dev` y se añade otro nuevo al holdout. Así el holdout no se contamina. Las mejoras deben ser generales (vocabulario, afinidades, reglas), nunca específicas de un brief.

Un brief nuevo cubre algo que aún no está: otro sector, otra forma de decirlo, un caso límite (idea vacía, mayúsculas, palabras de dos sectores).

## Métricas

| Métrica | Qué mide |
|---|---|
| Sector detectado | Si `TintaSectors.detect` acierta el sector esperado (o ninguno). |
| Tipo detectado | Si distingue una app de una página web. |
| Propuestas sin avisos | Qué parte de las tres propuestas no tiene avisos de diseño. |
| Diferencia mínima | Roles que cambian entre las dos propuestas más parecidas (mínimo exigido: 2). |
| Encaje medio | Afinidad media (0 a 3) de los bloques de la primera propuesta con el sector **esperado**, para no mezclar el error de detección con el de composición. |
| Textos del sector | De los bloques con huecos de la primera propuesta, cuántos llegan con copia del sector. |
| Bloques distintos usados | Variedad real del motor. |
| Tiempo p95 | Latencia (no se guarda en la línea base: varía en cada ejecución). |

## Hallazgos abiertos

Cosas que la medición ya ha enseñado y que siguen sin arreglar:

- `web-libreria` (holdout): «librería» no se reconoce como tienda.
- Hay bloques descritos que ningún brief usa (`--verbose` los lista): son candidatos a mejorar sus afinidades o a retirar.
- Los textos del sector llegan al 83 % de los bloques con huecos en el holdout: faltan sectores o bloques sin copia.
