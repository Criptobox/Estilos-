# Plan · Tinta compone sola

Tinta tiene que crear buenos diseños **sin IA**. Reglas, datos y puntuación hacen el trabajo, de forma local, rápida y repetible. Una IA puede sumarse después como un proponente más, opcional, que pasa por las mismas reglas.

> Estado: **versión 12.17.** El motor local compone tres propuestas por idea, para apps y para páginas web, con piezas de Tinta y de la biblioteca original, y está conectado a Tinta. La IA no se ha empezado y no es requisito de nada de lo que ya funciona.

## 0. Principios

1. **El motor local es el producto.** Cada mejora de calidad se busca primero con datos y reglas: más bloques descritos, mejores reglas, más sectores. Eso mejora a todas las personas que usan Tinta, sin conexión y sin coste por uso.
2. **La biblioteca es la única fuente de piezas.** Toda pantalla se arma con ids de `design-library/catalog.json`. Si falta una pieza, se añade con la skill `add-block` y entra por revisión.
3. **Un contrato común.** El motor, una persona o un modelo producen lo mismo (una lista de bloques, o una `ScreenSpec` con textos) y todos pasan por la misma revisión de diseño (`lint`).
4. **Medir.** El motor es la línea base. Cualquier proponente nuevo, IA incluida, solo se activa si le gana de forma medible.

## 1. Qué hay hoy

| Pieza | Dónde | Estado |
|---|---|---|
| Catálogo de 138 recursos en 26 módulos | `design-library/catalog.json` | Existe |
| Motor de render y edición de textos, color, botones y tarjetas | `web/js/tinta-*.js`, `crear.js` | Existe |
| Detector de sector y textos por sector (8 sectores) | `web/js/tinta-sectors.js` | Existe |
| **Metadatos de composición** de 51 bloques (12 de Tinta, 25 de la biblioteca original y 14 secciones web): tipo, familia visual, tono, acento, peso, afinidad por sector, reglas y huecos | `design-library/composition.json` | Nuevo (12.9, ampliado en 12.10 y 12.11) |
| **Motor de composición**: tres propuestas distintas, puntuación, `lint` | `web/js/tinta-composer.js` | Nuevo (12.9) |
| **Otra propuesta** en la pantalla de bloques | `web/js/crear.js`, `crear.html` | Nuevo (12.9) |
| Contrato `ScreenSpec` y convertidor a proyecto de Tinta | `composer/spec/`, `composer/tools/spec-to-tinta.cjs` | Nuevo |
| Validador y 10 briefs de oro | `composer/tools/validate-composer.cjs`, `composer/evals/briefs/` | Nuevo |
| Pruebas del motor (100 comprobaciones) y de los huecos | `tests/composer-engine.cjs`, `tests/composer-spec.cjs` | Nuevo |
| Skills `add-block` y `compose-screen`, plantillas de issue y PR, `CLAUDE.md` | `.claude/`, `.github/` | Nuevo |

Límites de hoy, a la vista:

- 37 bloques tienen metadatos de composición. Faltan unos 100 de la biblioteca original: muchos son contenido muy específico (chat, tarea Kanban, perfil) y algunos son demostraciones de estados que no sirven como pieza de pantalla (`lib-bot-1`), por lo que no se describen. Los 25 de la biblioteca ya descritos solo declaran huecos vacíos, así que no aceptan textos desde una `ScreenSpec` todavía.
- **Secciones web: 14 piezas** (héroes, beneficios, precios, testimonio, cifras, preguntas, galería, equipo, contacto, llamadas finales y pies) en `web-sections`. Tinta compone páginas de una columna con hasta tres secciones ordenadas. Faltan una barra de navegación superior, secciones con fotos reales (la galería usa piezas de color) y bloques como mapa o formulario de contacto.
- Tinta compone con cuatro roles (`header`, `cards`, `actions`, `nav`) y cada bloque aparece una sola vez por pantalla.
- El motor propone qué bloques usar y los deja con textos de su sector (`design-library/copy.json`, 8 sectores) para las páginas web y los 11 bloques de app de Tinta con huecos. De los 25 bloques de la biblioteca original, 9 llevan copia por sector (cabeceras, reseña, botones y barras con etiquetas). Los 4 con imagen incluida declaran huecos pero no tienen copia para no contradecir la imagen; el resto son barras de solo iconos y no tienen texto. Para lo que conserve sus textos sigue el botón «Adaptar textos a la idea».
- Hay una sola pantalla por idea. Una app necesita varias (inicio, detalle, carrito).

## 2. Cómo compone el motor

```
Idea ─► Sector ─► Candidatos ─► Reglas de diseño ─► Puntuación ─► Selección diversa ─► 3 propuestas
 (texto)  (8)     (todas las      (lint: avisos)     (afinidad,     (cambian ≥ 2 roles     (con «por qué»
                   combinaciones)                      tono, pares)   entre sí)               y avisos)
```

0. **Tipo de pantalla.** La idea decide si es una app o una página web (`kindOf`). Cada tipo usa solo sus piezas.
1. **Sector.** `TintaSectors.detect` lee la idea. Sin sector, cada bloque vale por su versatilidad media.
2. **Candidatos.** Dentro de cada estilo visual, todas las combinaciones válidas de encabezado × tarjetas (una, o dos de las mejor valoradas) × acción principal (con o sin acción suave) × navegación. Son unas diez mil y se evalúan en menos de 100 ms.
3. **Reglas de diseño** (`lint`, también disponible para pantallas armadas a mano):
   - una acción principal clara y sin dos que compitan;
   - nunca piezas de app y de página web en la misma pantalla;
   - un solo estilo visual por pantalla (Tinta o biblioteca original, nunca mezclados);
   - una sola gama de color de acento: cálido (coral) o frío (azul y violeta); un tema de un solo color no avisa, pero el mismo color en tres bloques con uno muy pesado sí;
   - no dos bloques muy pesados a la vez;
   - no más de dos tarjetas;
   - la acción suave necesita una principal al lado;
   - aviso si un bloque no suele encajar con el sector;
   - aviso si falta encabezado, navegación o acción principal.
4. **Puntuación.** Encaje de cada bloque con el sector (0 a 3), coherencia de tono, pares que se llevan bien, y una penalización por pantallas largas.
5. **Selección.** Se toman primero las pantallas sin avisos. Cada propuesta debe cambiar al menos dos roles respecto a las anteriores. La última se reserva para el otro estilo visual, si hay una pieza sólida (encaje 2 o más en todos los bloques) a menos de 4 puntos de la mejor.
6. **Salida.** Tres propuestas con nombre («La más acertada», «Variante: otra acción y otra navegación»), tono, puntuación y el porqué de cada bloque, sacado de su ficha.

Es determinista: la misma idea da siempre las mismas propuestas. Eso permite probarlo y comparar versiones.

### Cómo mejorar la calidad sin IA

| Palanca | Qué se hace | Efecto |
|---|---|---|
| Más bloques con metadatos | Describir los `lib-*` con la skill `add-block` (tono, acento, peso, afinidad, huecos) | Más variedad y propuestas menos repetidas |
| Más secciones web | Navegación superior, formulario de contacto, mapa, secciones con fotos | Páginas más completas |
| Varias pantallas por idea | Recetas por tipo de pantalla (inicio, detalle, carrito, perfil) con las plantillas `app-screens` | Una app entera, no una sola vista |
| Huecos con textos por sector | Los bancos de texto de `tinta-sectors.js` rellenan los huecos de cada bloque | La propuesta sale lista, sin pasar por «Adaptar textos» |
| Revisión visible | Mostrar los avisos de `lint` en la pantalla de revisión, con un arreglo sugerido | Quien arma a mano también aprende de las reglas |
| Más sectores | Añadir sectores y ajustar afinidades con las pruebas de gusto | Mejor cobertura de ideas |
| Variantes de estilo | Tonos, paletas y radios como tokens aplicados a la propuesta | Más identidad sin más bloques |

## 3. Contratos de datos

### 3.1 Metadatos de composición (`design-library/composition.json`)

Archivo aparte de `catalog.json` (que se genera con un script). Se une por `id`. Esquema en `composition.schema.json`.

```jsonc
{
  "id": "c-coffee",
  "design": {
    "tones": ["calido"],            // calido | sobrio | energico | editorial
    "accent": "neutro",             // coral | grafito | neutro
    "weight": "medio",              // ligero | medio | fuerte
    "affinity": { "comida": 3, "tienda": 2, "finanzas": 0 }   // 0 a 3 por sector
  },
  "slots": [
    { "name": "title", "kind": "text", "selector": ".details h2", "max": 32, "required": true },
    { "name": "price", "kind": "text", "selector": ".details > b", "own": true, "max": 10 }
  ],
  "rules": { "role": "cards", "position": "body", "max_per_screen": 1, "conflicts_with": [] },
  "guide": { "when_to_use": "…", "avoid_when": "…" }
}
```

Un hueco se localiza con un selector CSS dentro del HTML del bloque. `own` toma solo el texto directo del elemento. `parts` indica que ocupa varios textos de Tinta (un título con salto de línea) y el valor se escribe en líneas. La prueba `tests/composer-spec.cjs` comprueba contra la página real que cada selector apunta a los textos correctos; en su primera pasada encontró 7 huecos mal declarados.

`web/js/tinta-composition-data.js` se genera desde este archivo con `node tools/build-composition-data.cjs`. CI verifica que esté al día.

### 3.2 `ScreenSpec`

Una pantalla con bloques, textos de los huecos y el porqué de cada bloque. Esquema en `composer/spec/screen-spec.schema.json`, ejemplos en `composer/spec/examples/`. `composer/tools/spec-to-tinta.cjs` la convierte en un proyecto de Tinta importable y la dibuja. Hoy la usan las pruebas y los ejemplos; el motor aún devuelve solo bloques. Más adelante el motor también devolverá `ScreenSpec` con los huecos rellenos.

Límites de los proyectos de Tinta que condicionan el contrato: cada bloque una vez por pantalla, un encabezado y una navegación, textos guardados por posición de nodo, tema oscuro guardado aparte.

## 4. Calidad medible

El motor se mide igual que se medirá cualquier otro proponente.

**Hoy (pruebas automáticas, 256 comprobaciones del motor):**
- Tres propuestas distintas para 10 ideas de prueba, incluida una vacía.
- Cada propuesta cubre encabezado, tarjeta, acción y navegación, y no tiene avisos de diseño.
- Determinismo: misma idea, mismas propuestas.
- Cafetería, finanzas y tienda dan la combinación esperada.
- Cada regla de `lint` salta cuando debe y calla cuando no.
- Flujo en la app: botón «Otra propuesta», vuelta a la primera, conserva lo que la persona ya eligió, sin desbordamiento en móvil.

**Siguiente:**
- Hecho (12.16): 42 briefs con `split` dev/holdout y resultado esperado, y `composer/tools/eval-engine.cjs` con las métricas sector detectado, tipo detectado, propuestas sin avisos, diferencia entre propuestas, encaje medio, textos del sector, bloques usados y tiempo. Una prueba exige umbrales y no admite retrocesos. Detalle en `composer/evals/README.md`.
- Comparación visual: capturas de las propuestas para detectar regresiones de gusto al cambiar reglas o datos.
- Accesibilidad: contraste AA y tamaño táctil por bloque, como dato de la ficha.

## 5. IA opcional (más adelante)

Cuando el motor ya funcione bien y esté medido, una IA se suma como **proponente**: recibe la idea y la biblioteca, devuelve una `ScreenSpec`, y pasa por `lint` y por la misma validación. No sustituye al motor ni es necesaria para usar Tinta.

Condiciones para activarla:
- Debe ganar al motor en comparación a ciegas con las mismas ideas.
- Nunca inventa bloques ni ejecuta código: solo elige ids y escribe textos de huecos.
- Si no hay conexión o clave, Tinta sigue con el motor local.
- Las claves van en secretos o variables locales, nunca en el repositorio.

Piezas previstas, en este orden y solo si hacen falta:

| Pieza | Para qué |
|---|---|
| Servidor MCP (`library_search`, `library_get_block`, `screen_validate`, `screen_render`) | Que cualquier modelo use la biblioteca y las reglas del motor |
| Proponente con modelo (`composer/proposers/`) | Generar `ScreenSpec` y compararla con el motor |
| Banco de pruebas con juez | Comparar motor y modelos en las mismas ideas |
| Destilación y preferencias | Que un modelo pequeño aprenda de las propuestas buenas y de las elecciones de las personas |

El conjunto de evaluación nunca se usa para entrenar, y no se usan datos de personas sin su consentimiento.

## 6. Interfaz

Se mantiene el recorrido **Idea → Bloques → Pantalla**. Ya hecho: «Ayúdame a empezar» arma la primera propuesta y «↻ Otra propuesta» cambia entre las tres; la nota indica cuál se ve y qué tono tiene.

Siguiente:
- Mostrar el «por qué» de cada bloque de la propuesta.
- Hecho (12.17): los avisos de `lint` se muestran en la revisión con los nombres de los bloques implicados. Falta un botón que arregle el más importante.
- Los bloques con ficha de diseño son 51 de 152; el resto no se revisa y el panel lo indica.
- Elegir una propuesta entre tres tarjetas con vista previa, en lugar de cambiarla en sitio.
- Textos en español sin jerga: «pantalla» y «bloque», no «spec» ni «slot».

## 7. Repositorio

```
estilos-/
├─ web/                     app (Tinta, editor clásico, PWA)
│  └─ js/tinta-composer.js, tinta-composition-data.js
├─ design-library/          catálogo + composition.json (+ esquemas)
├─ composer/
│  ├─ spec/                 screen-spec.schema.json, examples/
│  ├─ tools/                validate-composer.cjs, spec-to-tinta.cjs
│  └─ evals/briefs/         briefs de oro
├─ tools/                   build-tinta-catalog, build-composition-data, …
├─ tests/                   Playwright (incluye composer-engine y composer-spec)
├─ .claude/skills/          add-block, compose-screen
├─ .github/                 workflows, plantillas de issue y PR
├─ CLAUDE.md                reglas del proyecto para agentes
└─ docs/PLAN-IA-ESTILOS.md  este documento
```

CI (`tests.yml`) verifica los datos de composición generados, valida los metadatos y las `ScreenSpec`, y ejecuta las 29 pruebas de extremo a extremo.

## 8. Hoja de ruta

| Fase | Entregable | Criterio de salida | Estado |
|---|---|---|---|
| 0 · Cimientos | Contratos, validador, briefs, skills, plantillas | El esquema valida bloques y pantallas de ejemplo | Hecho |
| 1 · Motor | Metadatos de composición, `TintaComposer`, tres propuestas, «Otra propuesta» | Propuestas distintas y sin avisos para 10 ideas | **Hecho en 12.9** |
| 2 · Más material | Secciones web (**hecho en 12.11**), copia por sector para páginas (**hecho en 12.12**), copia para apps (**hecho en 12.14**), huecos y copia de la biblioteca original (**hecho en 12.15**), varias pantallas por idea | Una app de 3 pantallas y una web completa a partir de una idea | En curso |
| 3 · Calidad medible | 40 briefs (**hecho**), métricas y línea base (**hecho en 12.16**), `lint` visible en la revisión (**hecho en 12.17**), capturas de regresión | Tabla de métricas en cada PR | En curso |
| 4 · Más salidas | Tailwind, Compose, Flutter desde la misma pantalla | Cada stack exportado compila en CI | |
| 5 · IA opcional | MCP, proponente con modelo, banco con juez | Gana al motor en comparación a ciegas | |

Las duraciones dependen de cuántos bloques se describan por semana; se fijan al cerrar cada fase.

## 9. Riesgos

| Riesgo | Efecto | Respuesta |
|---|---|---|
| Pocos bloques con metadatos | Propuestas parecidas entre ideas | Fase 2: describir los `lib-*` por módulos |
| Reglas que se contradicen | Propuestas raras | Pruebas de cada regla y de ideas reales; capturas de regresión |
| Afinidades subjetivas | Gusto de una sola persona | Revisarlas con los briefs de oro y con elecciones reales |
| Resultados genéricos | Pantallas correctas pero iguales | Métrica de diversidad; variantes de estilo; más sectores |
| Selectores de huecos que se rompen al editar un bloque | Textos en el sitio equivocado | `tests/composer-spec.cjs` falla al instante |
| Gancho `__tintaInspect` | Superficie extra en la app | Solo existe bajo automatización (`navigator.webdriver`) y es de solo lectura |
| IA que no mejora al motor | Coste sin beneficio | No se activa hasta ganar en comparación a ciegas |

## 10. Decisiones abiertas

- Nombre definitivo del producto (hoy Estilos / Tinta).
- Si se quiere repetir un mismo bloque en una pantalla (por ejemplo varias tarjetas de producto). Exige cambiar el formato de proyecto de Tinta.
- Dónde viven las afinidades por sector y quién las revisa.
- Prioridad entre secciones web y varias pantallas por idea.
- Licencia del repositorio.

## 11. Siguientes pasos concretos

1. Describir con huecos los 25 bloques de la biblioteca original ya incluidos, y añadir los que falten de `forms` y `app-screens`, con la skill `add-block`.
2. Que el motor rellene los huecos con los textos del sector y devuelva una `ScreenSpec` completa.
3. Mostrar el «por qué» y los avisos de `lint` en la pantalla de revisión.
4. Ampliar los briefs de oro a 40 y medir diversidad y encaje.
5. Varias pantallas por idea: una app de inicio, detalle y carrito, y una página con más secciones.
6. Decidir qué hacer con los bloques de la biblioteca original que traen imagen incluida: imágenes neutras o ilustraciones por sector.
