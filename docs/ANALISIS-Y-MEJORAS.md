# Estilos 13 · Análisis y plan de mejoras

> Revisión del repositorio `Criptobox/Estilos-` (12.3.0) y construcción del flujo que
> faltaba: un **Agente** al estilo Google Stitch donde eliges tarjetas, barras,
> botones, campos… y la pantalla se arma sola.

---

## 1. Radiografía de lo que hay hoy

| Dato | Valor |
|---|---|
| Diseños en la biblioteca | **107** (+ 27 capturas de referencia) |
| Categorías | **20** (Chat, Tarjetas, Barras, Botones, Entradas, Datos, Listas…) |
| Código web | ~4.400 líneas, **sin dependencias ni build** (vanilla JS + CSS) |
| Empaquetado | PWA con service worker *cache-first* + envoltorio Android (WebView) |
| Pruebas | 174 pruebas e2e de Playwright, todas en verde |
| Persistencia | `localStorage` para datos + IndexedDB para imágenes |

**Lo que ya está muy bien y no hay que tocar:**

1. El **motor de diseños** (`designs-core.js`): cada estilo es una función que devuelve
   `[html, css]`, y de ese par salen la vista previa (Shadow DOM) y el código copiado.
   Lo que ves es exactamente lo que copias. Es una idea excelente y es el activo real del producto.
2. **Sanitización** de toda entrada (`safeColor`, `safeId`, delegación por `data-act`): no se
   puede inyectar código importando un JSON.
3. **Accesibilidad**: foco atrapado en hojas y visores, `aria-*`, contraste WCAG calculado.
4. **Cero dependencias**: carga instantánea, funciona sin conexión, sin supply chain.
5. Los diseños están **curados de referencias reales** y tienen `tip` con criterio de diseño.

### Lo que estorba (diagnóstico)

| # | Problema | Evidencia |
|---|---|---|
| 1 | **No existe el flujo que pides.** La biblioteca da piezas sueltas y el Creador arranca con un lienzo vacío ("Tu página está vacía"). Falta el paso intermedio: *"quiero una pantalla de tienda, dame tarjeta + barra + botón que combinen"*. | Vista `Creador` 12.3, captura `nav2.png` |
| 2 | **Ruido cromático.** Cada una de las 20 categorías tiene su degradado propio (`TAB_GRAD`). 20 acentos compitiendo = cero jerarquía. El color debería ser de *tu marca*, no de la categoría. | `app.js` → `TAB_GRAD` |
| 3 | **La portada no muestra el producto.** Titular de 30 px + 4 accesos ocupan la primera pantalla entera; el primer diseño aparece a ~1100 px de scroll. | Captura `orig-home.png` |
| 4 | **La biblioteca es un menú, no una herramienta.** 20 tarjetas grandes en 2 columnas = 10 filas para llegar a "Widgets". No hay facetas (claro/oscuro, rol, plataforma), ni orden, ni "usados recientemente" dentro de la categoría. | Captura `nav1.png` |
| 5 | **El contenido de los diseños es fijo.** Al combinar bloques, el resultado se lee incoherente: una app de café muestra "Ingresos $24.380". | Captura `flow-1-generado.png` |
| 6 | **Bug real en la fuente.** El `plus-jakarta-sans.woff2` del repo tiene el espacio a **0.17 em** (lo correcto es ~0.26 em): las palabras se pegan ("Generardiseño", "pedircafé") en tamaños pequeños. | Medido con fontTools, corregido |
| 7 | **`app.js` con 1.522 líneas** mezclando router, estado, vistas, exportación y ajustes. Cuesta añadir cualquier cosa nueva. | `wc -l` |

---

## 2. Lo que he construido: el Agente

Archivos nuevos (nada existente se ha reescrito):

```
web/agente.html      · pantalla completa del Studio
web/css/agente.css   · sistema visual nuevo (tokens, componentes, responsive)
web/js/agente.js     · el "agente": brief → sector → receta de bloques → export
```

### El flujo

```
Brief  →  sector detectado  →  propuesta de 7 bloques  →  cambias lo que no te gusta  →  export
```

1. **Brief** (texto libre o un sector: Tienda, Comida, Fintech, Fitness, Viajes, Salud/IA,
   Música, SaaS). El motor lee palabras clave y detecta sector, tema, densidad.
   Es honesto: **no hay modelo de lenguaje**, es un motor de reglas local que funciona sin
   conexión. La interfaz está preparada para enchufar una IA después sin tocarla.
2. **Bloques**: Encabezado · Buscador · Métricas · Tarjetas · Lista · Botón · Barra inferior.
   Cada bloque tiene un diseño asignado; al tocarlo se abre un selector con **las 107 piezas
   de la biblioteca con tu paleta ya aplicada**. Los bloques opcionales se apagan con el ojo.
3. **ADN de marca**: 3 colores, redondeo (0–32 px), tema claro/oscuro y densidad. Se aplica a
   todos los bloques a la vez: eso es lo que hace que siete piezas distintas parezcan un producto.
4. **Exportar**: HTML autocontenido (Shadow DOM declarativo, sin JS), tokens JSON y un prompt
   listo para pegar en otra IA.

### Tres decisiones técnicas que resuelven lo que estaba roto

**a) Recolorear solo el acento, nunca por posición.**
Mi primer intento fue mapear colores por rol (`surface`, `accent`, `ink`…). Rompía diseños:
un gris de fondo (`#F0F0F0`) se confundía con el acento y el buscador entero se pintaba de
azul; las cajas negras aparecían donde el diseño esperaba un fondo claro. Los 107 diseños **no
usan el mismo orden de colores entre sí**. La solución: se conserva el diseño original y solo
se sustituyen sus colores **con saturación real** (> 0.3) por tu acento y tu secundario.
Resultado: coherencia de marca sin romper nada.

**b) Tema oscuro por inversión de neutros, no de todo.**
Muchos diseños escriben `color:#14161B` y `background:#fff` a mano. En oscuro eso deja textos
invisibles. Se reescriben **solo esos neutros** (y solo cuando el diseño nació en claro); los
colores saturados no se tocan. Los diseños que ya eran oscuros se dejan intactos.

**c) Rejilla sin recortes.**
Las tarjetas de 265–380 px de alto no caben en dos columnas de 170 px. Se midieron las 21
tarjetas y las altas van a ancho completo; la pareja de la rejilla se elige con la **misma
clase de altura**. Nada se corta.

### Cómo probarlo

```bash
cd web && python3 -m http.server 8000
# http://localhost:8000/agente.html
```

También hay un acceso nuevo en la portada de la app (tarjeta **Agente**), un atajo en el
`manifest` y las tres piezas nuevas en el precache del service worker.

---

## 3. Mejoras propuestas (priorizadas)

`I` = impacto · `E` = esfuerzo · ★ = yo empezaría aquí

### A. Organización y arquitectura de información

| # | Mejora | I | E |
|---|---|---|---|
| 1 ★ | **Tres modos en vez de seis destinos.** Hoy: Inicio · Biblioteca · Creador · Plantillas · Colecciones. Propuesta: **Explorar · Crear · Agente**, con Colecciones y Plantillas como filtros dentro de Explorar. | Alto | Bajo |
| 2 ★ | **Buscador global (⌘K)** presente en todas las pantallas, con resultados por tipo (tarjeta, barra, plantilla) y "abrir en el Agente". Hoy el buscador solo vive en Inicio y en los listados. | Alto | Medio |
| 3 | **Biblioteca por rol, no por categoría.** El usuario no busca "Encabezados", busca "una barra inferior". Filtros de faceta: rol, claro/oscuro, plataforma (PWA/Compose/SwiftUI), densidad. | Alto | Medio |
| 4 | **Lista compacta + panel lateral.** En escritorio, el detalle en un panel a la derecha conserva el contexto y quita el ida-y-vuelta actual. | Medio | Medio |
| 5 | **Favoritos y recientes dentro de cada categoría**, no solo a nivel global. | Medio | Bajo |

### B. Sistema visual de la app (que se vea "pro")

| # | Mejora | I | E |
|---|---|---|---|
| 6 ★ | **Un acento, no veinte.** Eliminar `TAB_GRAD`: un color de marca + neutros, y que el color lo ponga el contenido (las miniaturas ya aportan color). Es el cambio que más "profesionaliza" la app. | Alto | Bajo |
| 7 ★ | **Escala tipográfica explícita**: 11/12/13/14/16/20/26/32, una sola familia, `letter-spacing` solo en títulos. Hoy hay tamaños ad hoc (11, 11.5, 12.5, 13, 14, 15, 16, 18, 19, 22, 26, 30). | Alto | Bajo |
| 8 | **Radios en 3 pasos** (10 / 14 / 20) en lugar de 20, 22, 24, 26, 28, 30, 32 y `999px` mezclados. | Medio | Bajo |
| 9 | **Retícula de 4/8 px y densidad declarada** (cómoda / compacta) en toda la app, como ya hace el Studio. | Medio | Bajo |
| 10 | **Sombras en 3 niveles.** Hoy casi todo lleva `--shadow` de 28 px de desenfoque: nada destaca porque todo flota. | Alto | Bajo |
| 11 | **Portada con el producto a la vista**: buscador grande + "recientes" + una fila de piezas reales por encima del pliegue; el titular, más corto. | Alto | Bajo |
| 12 | **Estados vacíos y esqueletos** reutilizando `card.wireframe`, que ya existe en la biblioteca. | Bajo | Bajo |
| 13 | **Un solo grosor de icono** (2 px, 20 px). Hoy conviven 2 y 3. | Bajo | Bajo |

### C. Agente (el corazón del producto)

| # | Mejora | I | E |
|---|---|---|---|
| 14 ★ | **Contenido editable por bloque.** El mayor salto de calidad percibida: hoy una app de café dice "Ingresos $24.380". Cada diseño debería declarar sus campos (`title`, `subtitle`, `price`, `image`) y el agente rellenarlos según el sector. Sin esto, el resultado siempre parece una maqueta. | Muy alto | Alto |
| 15 ★ | **Candado por bloque.** Bloqueas lo que ya te gusta y el agente regenera solo el resto. Es el gesto que hace que se sienta conversacional. | Alto | Bajo |
| 16 | **Tres propuestas en fila** en vez de una, para comparar (y "quedarme con la 2 y regenerar"). | Alto | Medio |
| 17 | **Revisión del agente**: puntuar la pantalla (contraste AA, nº de acentos, jerarquía de tamaños, densidad de texto) con avisos accionables. Reutiliza `contrast()` y `wcag()`, que ya existen. | Alto | Medio |
| 18 | **Historial del lienzo** (deshacer/rehacer de bloques + versiones con nombre). | Medio | Medio |
| 19 | **Enchufar una IA real** de forma opcional. Contrato ya definido por el export de tokens: `{ sector, palette, radius, theme, blocks:[{ slot, variantId, content }] }`. El motor de reglas queda como respaldo offline. | Muy alto | Medio |
| 20 | **Compartir la pantalla por enlace** reutilizando `share.js`, que ya comprime el proyecto en el `#`. | Medio | Bajo |

### D. Contenido y datos

| # | Mejora | I | E |
|---|---|---|---|
| 21 ★ | **Normalizar los 107 diseños** con metadatos: `role` (navegación, cabecera, héroe…), `height` (medida), `supports` (claro/oscuro), `fields` (contenido editable). Con eso el agente deja de necesitar recetas hechas a mano por sector. | Muy alto | Alto |
| 22 | **Variantes por sector**: el mismo layout con contenido de producto / plato / destino / curso. | Alto | Medio |
| 23 | **Búsqueda semántica local** por sinónimos ("navbar" → "barra", "input" → "entrada"). | Medio | Bajo |

### E. Técnico y calidad

| # | Mejora | I | E |
|---|---|---|---|
| 24 ★ | **Partir `app.js`** en `router.js`, `state.js`, `views/*.js`. 1.522 líneas en un archivo frenan cualquier cambio. | Alto | Medio |
| 25 | **Prueba de humo de los 107 diseños**: recorrerlos y comprobar que renderizan sin excepción y sin texto de contraste < 3:1. Detecta regresiones que el e2e actual no ve. | Alto | Bajo |
| 26 | **Snapshot visual** (Playwright) de cada categoría: cambiar un token no debería mover 30 pantallas. | Medio | Medio |
| 27 | **Tests unitarios** del motor (`tokens`, `mix`, `inkOn`, `bestAccent`). | Medio | Bajo |
| 28 | Comprobar que el precache del service worker incluye cada archivo nuevo (ya añadí `agente.html`, `agente.css`, `agente.js`); convendría generarlo desde una lista en el build. | Medio | Bajo |

### F. Producto

| # | Mejora | I | E |
|---|---|---|---|
| 29 | **Paquetes de estilo** ("style packs") descargables: un sector entero listo para usar. | Medio | Medio |
| 30 | **Modo equipo**: comentarios anclados a un bloque. | Medio | Alto |
| 31 | **Aprender de los cambios**: registrar en local qué bloques cambia la gente y reordenar las recomendaciones (sin servidor, sin datos personales). | Medio | Bajo |

---

## 4. Roadmap sugerido (3 sprints)

**Sprint 1 — coherencia visual y contenido (2 semanas)**
`6`, `7`, `10`, `11` (sistema visual + portada) y `15` (candado por bloque).
Sale una app que ya parece otra sin tocar la lógica.

**Sprint 2 — el agente de verdad (3 semanas)**
`21` (metadatos de los diseños) → `14` (contenido editable) → `17` (revisión) → `16` (tres propuestas).
Aquí el Agente deja de ser un compositor y pasa a ser un asistente.

**Sprint 3 — escala (2 semanas)**
`24` (partir `app.js`), `25` y `26` (calidad), `19` (IA opcional) y `20` (compartir).

---

## 5. Sistema visual del Studio (implementado)

Tokens en `web/css/agente.css`:

| Token | Oscuro | Claro | Uso |
|---|---|---|---|
| `--bg` | `#0A0C11` | `#F4F5F8` | lienzo |
| `--panel` | `#11141B` | `#FFFFFF` | paneles y tarjetas |
| `--panel-2/3` | `#161A23` / `#1C212C` | `#F7F8FB` / `#EFF1F6` | capas y estados |
| `--line` | `rgba(255,255,255,.075)` | `rgba(15,18,30,.09)` | bordes de 1 px |
| `--txt` / `--txt-2` / `--mut` | `#EAEDF4` / `#A9B2C3` / `#77808F` | `#111520` / `#4A5265` / `#78808F` | jerarquía de texto |
| `--acc` | `#6E7BFF` | `#5563F0` | **único** acento de interfaz |
| `--r-s/m/l` | 10 / 14 / 20 px | — | tres radios |
| `--sh-1/2/3` | sutil / media / profunda | — | tres sombras |
| Tipografía | Plus Jakarta Sans, 11–32 px | — | escala cerrada |

El acento del **diseño** (el que exportas) es distinto del acento de la **interfaz**: uno es
marca del usuario, el otro es herramienta.

---

## 6. Decisiones abiertas (para ti)

1. **¿IA real o reglas?** El motor de reglas es predecible, gratis y offline. Con IA
   (p. ej. un modelo que devuelva el JSON de bloques) el brief se siente mágico, pero necesita
   clave, cuota y un plan B offline. Mi recomendación: reglas por defecto, IA como mejora opcional.
2. **¿Se reescribe la app o se evoluciona?** El Studio es una pantalla nueva; la app de 12.3
   sigue intacta y con sus 174 pruebas. Se puede migrar por partes (primero portada y biblioteca).
3. **¿Cuánto se toca el contenido de los diseños?** Con `14`/`21` el producto sube de nivel,
   pero implica tocar los 107 diseños para declarar sus campos.

## Implementado · ronda 13.1

Se aplicó la coherencia visual a portada y biblioteca: acento compartido, jerarquía tipográfica, sombras y producto visible desde el inicio. La navegación se simplificó a Explorar, Crear y Agente. Se añadieron búsqueda global por teclado, candados persistentes por bloque y revisión orientativa del Agente.

Validación: 174 comprobaciones de regresión y 60 adicionales, todas correctas. Comprobados anchos de 390 y 1440 px sin desbordamiento horizontal del documento. El catálogo muestra 126 entradas en ejecución (incluidos diseños extra); el recuento no está fijado a mano.

Pendiente: edición del contenido de cada bloque y deshacer/rehacer. El Agente sigue usando reglas locales, no un servicio LLM.

## Implementado · ronda 13.2

Editor de textos y placeholders por diseño, accesible con Aa en cada bloque del Agente. Incluye guardado local, actualización del lienzo, exportación y restauración. Los textos se insertan con textContent o setAttribute; no se interpreta HTML del usuario. En filas de dos tarjetas se editan ambas. Pendiente: imágenes, enlaces y acciones, deshacer/rehacer y contenido semántico por sector.

## Implementado · ronda 13.3

Historial de 50 cambios por sesión, con agrupación de escritura y controles, recuperación exacta de la combinación generada y descarte de ramas al editar tras deshacer. Incluye orden de bloques, ahora persistente al recargar. Respeta el historial nativo al escribir en campos. Botones en barra superior y editor de contenido; acciones de bloque visibles en móvil.

## Implementado · ronda 13.4

Selector con comparación Actual/Propuesta y aplicación explícita, búsqueda por múltiples palabras, filtro por tema original, ordenación y recuento. Vista adaptada a móvil, navegación por teclado y foco devuelto al cerrar. La propuesta no modifica el estado ni el historial hasta aplicarse. La comparación muestra un diseño individual, no la composición completa de tarjetas.

## Implementado · ronda 13.5

Proyectos locales con nombre (hasta 30), guardar copia, abrir, duplicar, renombrar, actualizar y eliminar. Confirmación explícita en acciones destructivas; comprobación de errores de almacenamiento. Las copias son independientes del borrador automático. Abrir reemplaza el borrador y reinicia el historial; no hay sincronización ni respaldo externo. Pruebas específicas: 22 comprobaciones, incluidas persistencia, cancelación, seguridad de nombres y fallo de almacenamiento. Pendiente: exportar/importar proyectos en JSON para respaldos portables.

## Implementado · ronda 13.6

Respaldo JSON individual o de todos los proyectos. Importación con validación de esquema, versión, diseños y sus roles, paleta, orden y límites; vista previa y confirmación. Añade copias nuevas sin tocar el borrador. No importa parcialmente al superar 30 proyectos o fallar localStorage. Límite de archivo 8 MB. Código separado en js/project-backup.js, incluido en precache. Se resuelve el pendiente de respaldos portables de la ronda anterior.

## Implementado · ronda 13.7

Imágenes editables en cuatro variantes de tarjeta mediante selectores explícitos: producto, foto, categoría y comida. Subida con decodificación y redimensionado en canvas, JPEG incorporado, texto alternativo, restauración y URLs HTTPS. Destinos seguros en botones/enlaces, con conversión semántica a enlaces en la exportación y sin navegación en el editor. Persistencia, proyectos, deshacer/rehacer y respaldos incluyen assets; importación valida URLs y límites. No incluye edición de imágenes en todas las variantes ni lógica transaccional de botones.

## Implementado · ronda 14.0

Rediseño visual integral del entorno: paleta neutra compartida, navegación lateral de escritorio, inspector no modal y selección de bloques en lienzo, capas reordenables, miniaturas de biblioteca contenidas y vista de proyectos con miniaturas. En móvil las propiedades se presentan como panel inferior y la navegación se fija abajo. El creador clásico se mantiene para no eliminar sus capacidades. Las reglas de composición y la exportación siguen separadas del nuevo estilo visual. Ver docs/DISENO-STUDIO-14.md.

## Corrección de dirección · 14.1

El usuario rechazó el acabado neutral de la ronda 14.0: buscaba una app creativa de vidrio lavanda, no un panel administrativo. Se conserva la estructura funcional, pero se cambia el material visual mediante css/lavender-glass.css: translucidez, reflejos, volumen suave, categorías tipo app launcher y temas lavanda claro/violeta nocturno. El agente adopta una identidad propia, Luma, con avatar 3D generado y almacenado localmente en WebP. No cambia la naturaleza del motor de reglas. Preferencias guardadas respetadas; instalaciones nuevas comienzan en claro.
