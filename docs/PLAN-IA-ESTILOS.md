# Plan · Estilos AI

IA especializada en código y diseño de web apps. Usa la biblioteca de Estilos como única fuente de piezas, arma pantallas completas con ellas y se mejora con el uso y con otros modelos.

> Estado: **fase 0 en curso.** Hecho: esquema de `ScreenSpec`, metadatos de IA de 12 bloques, 2 pantallas de ejemplo, 10 briefs, validador, `CLAUDE.md`, skills `add-block` y `compose-screen`, plantillas de GitHub y validación en CI (ver §10). Lo demás sigue siendo propuesta.

## 0. Idea en una frase

**Le das un brief y la biblioteca. Te devuelve pantallas armadas solo con bloques de la biblioteca, con el código listo, y aprende de lo que eliges.**

Tres decisiones que ordenan todo el proyecto:

1. **La biblioteca es la verdad.** El modelo no inventa interfaces: elige bloques por `id`, rellena sus huecos (textos, imágenes, colores) y los coloca. Si falta una pieza, propone una nueva que entra a la biblioteca por revisión.
2. **El modelo habla en `ScreenSpec`.** Un JSON con esquema fijo es el contrato entre cualquier modelo y el renderizador. Se valida antes de dibujar, así un modelo malo falla rápido y de forma medible.
3. **Medir antes de entrenar.** Primero un banco de pruebas (briefs de oro + métricas automáticas). Con él se compara cualquier modelo, prompt o ajuste fino.

## 1. Punto de partida (lo que ya existe)

| Pieza actual | Dónde | Qué aporta a la IA |
|---|---|---|
| Catálogo de 138 recursos en 26 módulos, con esquema | `design-library/catalog.json`, `catalog.schema.json` | Base de conocimiento y herramienta de búsqueda |
| Motor de render `designParts` | `web/js/tinta-library.js`, `tinta-catalog.js`, `designs-*.js` | Renderizador de pantallas ya probado |
| Edición de textos, color, estilos de botones y tarjetas | `tinta-button-style.js`, `tinta-card-style.js` | Los "huecos" (slots) que la IA rellena |
| Agente con tres propuestas para comparar | `web/js/agente.js` (Estilos 12.5) | Fuente natural de datos de preferencia |
| Recetas por palabras, sin modelo de lenguaje | `crear.js` | Línea base contra la que medir a la IA |
| Exportación HTML autónoma, proyectos JSON, PWA | `export.js`, `tinta-pwa.js` | Salida y persistencia |
| Pruebas Playwright y CI | `tests/`, `.github/workflows/` | Base para el arnés de evaluación |

Carencias que el plan debe cerrar:

- El catálogo describe las piezas pero no declaraba sus huecos ni sus reglas de composición. Se cierra con `design-library/ai-metadata.json` (12 bloques de Tinta hasta ahora).
- No hay ningún modelo de lenguaje conectado.
- **El módulo `web-sections` está vacío** (0 de 138 registros). Mientras no haya secciones web (héroes, precios, pie de página), la IA solo puede armar pantallas de app. Para cubrir "web app" completa hay que llenarlo, y es prioridad de la fase 1.
- Los registros `lib-*` (126 de la biblioteca original) aún no tienen metadatos de IA. Se añaden por módulos, empezando por `app-screens`, `forms` y `cards`.
- Hoy la composición de Tinta usa cuatro roles: `header`, `cards`, `actions`, `nav`. El esquema parte de ellos.

## 2. Arquitectura

```
Brief ─► Planificador ─► Recuperador ─► Compositor ─► Crítico ─► Render ─► Código
            (qué pantallas)   (busca bloques)  (ScreenSpec)   (reglas + a11y)   (designParts)  (HTML/Tailwind/…)
                                   ▲                                   │
                              Biblioteca ◄──── propuesta de bloque nuevo ┘
                                   ▲
                      Conectores MCP + Skills (§5, §6)
```

### 2.1 Capas

1. **Biblioteca** (`design-library/`): catálogo + índice de búsqueda semántica + tokens. Se amplía con `slots` y `rules` por bloque (§3).
2. **Especificación** (`ai/spec/`): `ai/spec/screen-spec.schema.json` y `design-library/ai-metadata.schema.json`. Una sola definición compartida por agente, renderizador y pruebas.
3. **Núcleo del agente** (`ai/agent/`): planificador, recuperador, compositor, crítico. Cada uno es una función pura con entrada y salida tipadas, para poder probarlos por separado.
4. **Proveedores** (`ai/providers/`): adaptador por modelo (Claude, otros APIs compatibles, modelo local). Misma interfaz: `complete(messages, tools, schema) → ScreenSpec`.
5. **Conector MCP** (`ai/mcp-server/`): expone la biblioteca y el renderizador como herramientas a cualquier cliente.
6. **Skills** (`.claude/skills/`): procedimientos repetibles para humanos y agentes (§6).
7. **Evaluación y entrenamiento** (`ai/evals/`, `ai/training/`): banco de pruebas, conjuntos de datos y guiones de ajuste (§7).
8. **Interfaz** (`web/`): panel del Agente dentro de Tinta y pantalla Laboratorio (§8).

### 2.2 Flujo de una petición

1. **Planificar**: del brief sale la lista de pantallas y la función de cada una (ej. "Inicio", "Detalle de producto", "Carrito").
2. **Recuperar**: para cada función se buscan candidatos en la biblioteca (texto + filtros por módulo, estilo, plataforma, estado de calidad).
3. **Componer**: el modelo elige bloques, orden y valores de los huecos, y devuelve un `ScreenSpec`.
4. **Criticar**: reglas automáticas (esquema, ids existentes, contraste AA, jerarquía de encabezados, un solo botón primario, tamaño táctil mínimo) y, opcionalmente, un segundo modelo con rúbrica. Si falla, vuelve a componer con el informe de errores (máximo 2 vueltas).
5. **Renderizar**: `designParts` dibuja la pantalla. Se captura imagen con Playwright para la crítica visual.
6. **Entregar**: tres propuestas para comparar y elegir, con el porqué de cada bloque, y exportación a código.

## 3. Contratos de datos

### 3.1 Metadatos de IA por bloque

`catalog.json` se genera con `tools/build-tinta-catalog.cjs`, así que los huecos y reglas viven en un archivo aparte, `design-library/ai-metadata.json` (esquema en `ai-metadata.schema.json`), unido al catálogo por `id`. Un `slot` se localiza con un selector CSS dentro del HTML del bloque. Se llena de forma incremental, empezando por los bloques de Tinta.

```jsonc
{
  "id": "h-search",
  "slots": [
    { "name": "headline",    "kind": "text", "selector": "h1",             "max": 40, "required": true },
    { "name": "placeholder", "kind": "text", "selector": ".search span",   "max": 50 }
  ],
  "rules": {
    "role": "header",                // header | cards | actions | nav
    "position": "top",               // top | body | bottom
    "max_per_screen": 1,
    "pairs_with": ["n-soft", "n-float", "n-dark"],
    "conflicts_with": []
  },
  "ai": {
    "when_to_use": "Inicio de apps de catálogo o contenido donde buscar es la acción principal.",
    "avoid_when": "Pantallas de pago o de formularios largos."
  }
}
```

`when_to_use` y `avoid_when` son texto para el modelo. Los escribe una persona (o una skill con revisión), nunca el modelo sin revisar.

### 3.2 `ScreenSpec`

```jsonc
{
  "spec_version": 1,
  "brief_id": "cafe-pedidos-001",
  "screen": { "name": "Inicio", "role": "home", "viewport": "mobile" },
  "tokens": { "theme": "light", "accent": "#e8664a", "radius": "soft" },
  "blocks": [
    { "ref": "h-search", "slots": { "headline": "Tu café, listo antes de llegar.", "placeholder": "Buscar café" } },
    { "ref": "c-coffee", "slots": { "title": "Flat white", "price": "$3.80" }, "repeat": 4 },
    { "ref": "n-soft", "slots": { "labels": ["Inicio", "Menú", "Pedidos", "Perfil"] } }
  ],
  "rationale": [
    { "ref": "h-search", "why": "La búsqueda es la acción más frecuente en un catálogo." }
  ]
}
```

Reglas del contrato:

- Todo `ref` debe existir en el catálogo. Un `ref` inventado es un fallo medible (**tasa de alucinación de bloques**).
- Los `slots` se validan contra la definición del bloque (tipo, longitud, color válido).
- `rationale` es obligatorio. Alimenta el panel "Por qué" y sirve de dato de entrenamiento.
- Los proyectos JSON existentes (`estilos-tinta-project` v1) siguen abriéndose. Se añade un convertidor `ScreenSpec ↔ proyecto`.

## 4. Código y diseño: cómo cubre las dos cosas

| Salida | Cómo se genera | Fase |
|---|---|---|
| HTML/CSS autónomo | Render directo de `designParts` (ya existe) | 1 |
| Tailwind | Plantilla por bloque (`code.tailwind` en el catálogo) | 3 |
| Jetpack Compose, Flutter, SwiftUI | Plantilla por bloque + prueba de compilación | 4 |
| React / componentes | Generados desde `ScreenSpec` con plantillas, no con texto libre | 4 |

Para el código se usa el mismo principio que para el diseño: el modelo no escribe CSS desde cero, elige y parametriza plantillas verificadas. Lo que el modelo escribe libre (bloques nuevos propuestos) pasa por saneado y revisión antes de entrar a la biblioteca, como ya se hace con el código propio actual.

## 5. Conectores (MCP)

Un servidor MCP local (`ai/mcp-server/`) y su registro en `.mcp.json`. Así Claude Code, otros agentes y los modelos que se quieran probar usan las mismas herramientas.

| Herramienta | Entrada | Salida |
|---|---|---|
| `library_search` | texto, módulo, estilo, plataforma | lista de bloques con puntuación |
| `library_get_block` | `id` | ficha completa con `slots` y `rules` |
| `library_propose_block` | HTML/CSS + metadatos | borrador en cola de revisión (no entra solo) |
| `screen_validate` | `ScreenSpec` | errores y avisos (esquema, reglas, contraste) |
| `screen_render` | `ScreenSpec` | HTML + captura PNG |
| `screen_export` | `ScreenSpec`, stack | código del stack elegido |
| `project_save` / `project_open` | proyecto | persistencia en JSON |
| `eval_run` | modelo, conjunto de briefs | informe de métricas |

Conectores externos recomendados, todos opcionales y por fases:

- **GitHub** (ya disponible en la sesión): issues de "Nuevo bloque", PRs, revisión y Actions.
- **Figma** (fase 4): importar estilos y tokens como propuesta de bloques o paletas.
- **Almacenamiento de datos** (fase 3): bucket o repositorio de datos para los conjuntos de entrenamiento, fuera del repo principal.
- **Seguimiento de experimentos** (fase 3): Weights & Biases o MLflow para comparar ejecuciones.

Las claves de API viven en secretos de GitHub Actions y variables locales. Nunca se guardan en el repositorio.

## 6. Skills del proyecto

Carpeta `.claude/skills/<nombre>/SKILL.md`. Cada skill es un procedimiento que se puede repetir igual y que cualquier colaborador o agente invoca por nombre.

| Skill | Cuándo se usa | Qué hace |
|---|---|---|
| `add-block` | Llega un diseño nuevo | Lo normaliza, crea la ficha, declara `slots` y `rules`, valida contra el esquema, añade prueba y entrada de changelog |
| `compose-screen` | Armar una pantalla desde un brief | Planifica, recupera, compone, valida, renderiza y propone tres variantes |
| `review-a11y` | Antes de aceptar bloques o pantallas | Contraste, tamaño táctil, orden de foco, etiquetas |
| `export-stack` | Sacar código | Genera HTML, Tailwind o Compose desde un `ScreenSpec` y lo compila |
| `eval-run` | Comparar modelos o prompts | Ejecuta el banco de pruebas y publica la tabla |
| `build-dataset` | Preparar entrenamiento | Filtra ejecuciones aceptadas, anonimiza, versiona el conjunto |
| `release-library` | Cerrar una versión | Sube versión, regenera catálogo y changelog, sincroniza la entrada de Tinta |

Orden de creación: `add-block`, `compose-screen`, `eval-run`. Las demás llegan cuando su fase las pide.

Además de las skills, se definen **subagentes** (`.claude/agents/`) con un solo trabajo cada uno: `librarian` (cura la biblioteca), `composer` (arma pantallas), `critic` (revisa con la rúbrica). Separarlos evita que el mismo modelo se corrija a sí mismo sin contraste.

## 7. Evaluación y entrenamiento con otros modelos

### 7.1 Banco de pruebas (`ai/evals/`)

- **Briefs de oro**: empezar con 40 (variedad de sectores: comida, finanzas, salud, educación, tienda, agenda…), crecer a 200. Cada uno con pantallas esperadas y restricciones.
- **Métricas automáticas** (baratas, se ejecutan en cada PR):
  - Validez del esquema (%)
  - Alucinación de bloques (% de `ref` inexistentes, objetivo 0)
  - Cobertura de la biblioteca (% de bloques usados que vienen del catálogo)
  - Contraste AA y tamaño táctil (% de pantallas que pasan)
  - Render sin errores (Playwright)
  - Coste y latencia por pantalla
- **Métricas con juez**: un modelo distinto al que compone puntúa coherencia, jerarquía, adecuación al brief y variedad entre las tres propuestas, con rúbrica escrita en `ai/evals/rubrics/`.
- **Preferencia humana**: cada elección entre las tres propuestas se registra como par (elegida, descartada).
- **Línea base**: las recetas por palabras actuales. La IA debe ganarles con claridad antes de reemplazarlas.

### 7.2 Escalera de mejora

| Etapa | Qué se hace | Cuándo pasar a la siguiente |
|---|---|---|
| A. Prompt + recuperación | Modelo fuerte con herramientas MCP, sin entrenar | Esquema válido ≥ 98 % y alucinación 0 % |
| B. Destilación | Varios modelos "maestros" generan especificaciones para miles de briefs. Solo se conservan las que pasan todas las reglas automáticas y superan el umbral del juez. Con ellas se ajusta un modelo pequeño (SFT) | El modelo pequeño iguala al maestro en ≥ 90 % de las métricas con menos coste |
| C. Preferencias | Con los pares de elecciones se aplica DPO o similar | Sube la tasa de propuesta elegida sin bajar las métricas automáticas |
| D. Conjunto de modelos | Se enruta por tipo de brief y se usa un modelo como crítico del otro | Mejora medible sobre el mejor individual |

Reglas para no engañarse:

- El conjunto de evaluación nunca entra en entrenamiento. Se versiona aparte y se congela por versión.
- Nada de datos de usuarios sin consentimiento y sin quitar textos personales.
- Revisar las licencias de los modelos maestros antes de entrenar con sus salidas.
- Cada ejecución guarda versión del catálogo, del esquema, del modelo y del prompt, para poder reproducirla.

## 8. Diseño de la interfaz

Se mantiene el lenguaje visual de Tinta: papel cálido, grafito y coral, Plus Jakarta Sans, mancha 3D como identidad. La IA no abre una app nueva; vive dentro del recorrido **Idea → Bloques → Pantalla** que ya existe.

### 8.1 Pantallas nuevas o ampliadas

1. **Idea (ampliada)**: campo de brief con adjuntos opcionales (captura de referencia, paleta). Selector de modelo avanzado y oculto por defecto.
2. **Propuestas (ya existe, se amplía)**: tres tarjetas con vista previa real. Cada una muestra "Por qué" desplegable con los bloques usados y la razón. Botones: Elegir, Pedir cambios, Guardar variante.
3. **Pedir cambios**: una caja de texto ("más aire", "botón principal más grande", "cámbiale el tono a más serio") que produce un `ScreenSpec` nuevo. Deshacer y Rehacer ya existen y se reutilizan.
4. **Bloque propuesto**: cuando la IA crea una pieza que no existía, aparece marcada como "Borrador" con revisión de contraste y botón "Enviar a la biblioteca" (abre un issue en GitHub).
5. **Laboratorio** (solo para mantenedores, ruta separada): tabla de modelos × métricas, enlace a ejecuciones, lista de briefs fallidos, cola de bloques por revisar.

### 8.2 Principios

- La IA siempre enseña de dónde sale cada pieza. Sin cajas negras.
- Sin conexión sigue funcionando todo lo que funciona hoy. La IA es una mejora, no un requisito.
- Los textos de la IA van en español, sin jerga técnica (se dice "pantalla" y "bloque", no "spec" ni "slot").

La versión visual de este diseño está en el artefacto "Estilos AI" que acompaña a este plan.

## 9. Repositorio en GitHub

```
estilos-/
├─ web/                     (app actual, sin cambios de ruta)
├─ design-library/          (catálogo + ai-metadata.json con slots y rules)
├─ ai/
│  ├─ spec/                 screen-spec.schema.json, examples/
│  ├─ tools/                validate-ai.cjs
│  ├─ agent/                planner, retriever, composer, critic
│  ├─ providers/            anthropic, openai-compatible, local
│  ├─ mcp-server/           herramientas de §5
│  ├─ evals/                briefs/, rubrics/, runners/, reports/
│  └─ training/             scripts/, configs/  (los datos van fuera del repo)
├─ .claude/
│  ├─ skills/               add-block, compose-screen, eval-run, …
│  └─ agents/               librarian, composer, critic
├─ .mcp.json                registro del servidor MCP
├─ .github/
│  ├─ ISSUE_TEMPLATE/       nuevo-bloque.yml, brief-fallido.yml, idea-modelo.yml
│  ├─ workflows/            tests.yml, pages.yml (existen) + evals.yml, dataset-nightly.yml
│  ├─ pull_request_template.md
│  └─ CODEOWNERS
├─ CLAUDE.md                reglas del proyecto para agentes
└─ docs/PLAN-IA-ESTILOS.md  este documento
```

### 9.1 Automatización

- **`tests.yml`** (existe): se amplía con validación de los metadatos de IA, los `ScreenSpec` de ejemplo y los briefs (ya activa).
- **`evals.yml`** (nuevo): en cada PR que toque `ai/` o `design-library/` corre las métricas automáticas con un conjunto pequeño y comenta la tabla en el PR. El conjunto completo corre bajo demanda con una etiqueta.
- **`dataset-nightly.yml`** (nuevo, fase 3): construye el conjunto de entrenamiento desde ejecuciones aceptadas y lo sube al almacenamiento de datos.
- **Plantillas de issue**: "Nuevo bloque" (con campos de `slots` y `rules`), "Brief fallido" (el brief, lo que salió, lo que se esperaba), "Idea de modelo".
- **Etiquetas**: `bloque`, `agente`, `evals`, `entrenamiento`, `a11y`, `conector`, `skill`, `fase-1`…`fase-4`.
- **Tablero** de GitHub Projects con una columna por fase.
- **Revisión**: PR obligatorio para `design-library/` y `ai/spec/`. Cualquier cambio al esquema sube `spec_version`.

### 9.2 Seguridad y calidad

- Ningún secreto en el repo. Ejecutar escaneo de secretos antes de cada versión.
- El HTML/CSS que genera un modelo se sanea siempre antes de mostrarse, sin ejecutar JavaScript (como hoy).
- La red del servidor MCP queda restringida a localhost salvo configuración explícita.
- `CLAUDE.md` fija reglas: no inventar bloques, no tocar `web/index.html` sin ejecutar `tools/sync-tinta-entry.py`, correr las pruebas antes de cada commit.

## 10. Hoja de ruta

| Fase | Entregable | Criterio de salida |
|---|---|---|
| **0 · Cimientos** (1–2 semanas) · **en curso** | `ScreenSpec` y metadatos de IA por bloque en 30 bloques de mayor uso. `CLAUDE.md`. Skill `add-block`. Línea base con las recetas actuales | El esquema valida los 30 bloques y 5 pantallas hechas a mano |
| **1 · IA con biblioteca** (2–3 semanas) | Servidor MCP con `library_*` y `screen_*`. Núcleo del agente con un proveedor. Skill `compose-screen`. Tres propuestas con "Por qué" en la interfaz | Esquema válido ≥ 98 %, alucinación 0 % en 40 briefs |
| **2 · Banco de pruebas** (2 semanas) | `eval_run`, métricas automáticas, juez con rúbrica, `evals.yml` en CI, 40 briefs de oro | Tabla comparativa de al menos 3 modelos publicada en cada PR |
| **3 · Aprendizaje** (3–4 semanas) | Registro de preferencias, `build-dataset`, destilación a modelo pequeño, seguimiento de experimentos | Modelo pequeño iguala al maestro en ≥ 90 % de las métricas |
| **4 · Más salidas** (continuo) | Tailwind, Compose, Flutter. Importación desde Figma. Bloques propuestos con revisión. Preferencias (DPO) | Cada stack exportado compila en CI |

Las duraciones son estimaciones para una persona con dedicación parcial. Se ajustan tras la fase 0.

## 11. Riesgos

| Riesgo | Efecto | Respuesta |
|---|---|---|
| Catálogo sin `slots` ni `rules` | El modelo combina mal las piezas | Fase 0 antes que cualquier modelo |
| Bloques inventados | Pantallas que no se pueden dibujar | Validación dura del `ref`; métrica con objetivo 0 |
| Entrenar con datos malos | El modelo copia errores del maestro | Filtrar con reglas y juez; conjunto de evaluación congelado |
| Coste de llamadas | Presupuesto descontrolado | Medir coste por pantalla desde la fase 2; modelo pequeño en la fase 3 |
| Resultados genéricos | Pantallas correctas pero iguales | Métrica de variedad entre propuestas; ampliar la biblioteca con estilos distintos |
| Sin conexión o sin clave | La app deja de servir | Recetas actuales como respaldo; la IA es opcional |
| Dependencia de un proveedor | Bloqueo | Interfaz de proveedor única y banco de pruebas independiente |

## 12. Primeros pasos concretos

Hecho:

- [x] `CLAUDE.md` con las reglas de §9.2.
- [x] `ai/spec/screen-spec.schema.json` y `design-library/ai-metadata.schema.json`.
- [x] Metadatos de IA de los 12 bloques de Tinta (`h-*`, `c-*`, `a-*`, `n-*`).
- [x] 2 `ScreenSpec` de ejemplo (café y finanzas) y 10 briefs de oro.
- [x] `ai/tools/validate-ai.cjs`, también en CI (`tests.yml`). Detecta bloques inventados, huecos no declarados, textos largos, conflictos y orden.
- [x] Skills `add-block` y `compose-screen`.
- [x] Gancho de solo lectura `window.__tintaInspect` en `web/js/crear.js`, activo solo bajo automatización (`navigator.webdriver`). Sin cambio de comportamiento para las personas usuarias.
- [x] Plantillas de issue (Nuevo bloque, Brief fallido) y de PR.

Límites conocidos de los proyectos de Tinta, que condicionan el contrato:

- Cada bloque aparece una sola vez por pantalla (el proyecto guarda `selected` sin repetidos). Por eso `max_per_screen` es 1 y `repeat > 1` se rechaza.
- Un solo encabezado y una sola navegación (`choices`).
- Los textos se guardan por posición de nodo de texto. Un título con salto de línea ocupa dos textos y un precio con decimales también; los huecos lo declaran con `own` y `parts`.
- El tema oscuro de una `ScreenSpec` aún no se aplica al proyecto.

Pendiente de la fase 0:

- [x] Comprobación automática de que cada `selector` apunta a textos reales del bloque (`tests/ai-spec.cjs`). Encontró 7 huecos mal declarados en la primera pasada, ya corregidos.
- [x] Convertidor `ScreenSpec → proyecto de Tinta` (`ai/tools/spec-to-tinta.cjs`, opciones `--out` y `--shot`). Las 2 pantallas de ejemplo se abren y se dibujan en Tinta.
- [ ] Ampliar a 30 bloques piloto (módulos `app-screens`, `forms`, `cards`).
- [ ] Ampliar a 40 briefs de oro y medir la línea base con las recetas por palabras actuales.
- [ ] Crear las etiquetas y el tablero en GitHub.

## 13. Decisiones abiertas

- Nombre definitivo del producto (hoy: Estilos / Tinta / Estilos AI).
- Modelo o modelos de partida para la fase 1 y presupuesto mensual.
- Dónde se alojan los datos de entrenamiento y quién tiene acceso.
- Si el Laboratorio es una ruta del mismo sitio o una app aparte.
- Licencia del repositorio y de los datos derivados.
