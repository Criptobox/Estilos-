# Plan de adopción de la biblioteca maestra UI/UX

## Especificación de referencia

`BIBLIOTECA-MAESTRA-UI-UX.md` es una copia del documento versión 1.0 aportado por el usuario (`biblioteca_maestra_diseno_ui_ux.md`). Define el alcance objetivo. No constituye un inventario de funciones ya implementadas ni una cesión de licencias sobre recursos externos.

Se conserva el recorrido Tinta **Idea → Bloques → Pantalla**, el avatar basado en la mancha sin círculo decorativo y el acabado blanco cálido/grafito/coral. Ampliar el inventario no significa sustituir las elecciones del usuario ni rehacer la aplicación desde cero.

## Punto de partida comprobable

- 126 registros de la biblioteca original y 12 diseños nuevos de Tinta: **138 registros en 19 categorías**, antes de altas, cambios o borrados personales.
- Conteos originales obtenidos ejecutando `data.js` y `designs-extra.js`: tarjetas 21, botones 10, barras 12, encabezados 5, entradas 6, formularios 5, listas 4, hojas 4, avisos 4, datos 5, chat 5, avatares 5, plantillas 9, paletas 7, tipografía 7, animaciones 6, fondos 4, widgets 5 e iconos 2.
- Tinta añade tarjetas 4, botones 3, barras 3 y encabezados 2. Son registros actuales; todavía hay que auditar qué casos deberían agruparse como variantes.
- Ya disponibles: búsqueda por nombre/descripción, categorías y colección, ampliación, selección, conflictos explícitos de encabezados/barras, orden dentro de categorías, composición móvil de 390 px, edición de textos, imágenes compatibles y destinos, proyectos locales y exportación HTML/JSON.
- La adaptación del entorno a 320/390/768/1440 px **no implica** que cada diseño ni la composición final tengan versiones tablet y desktop verificadas.
- El catálogo se presenta como HTML/CSS visual. No equivale a una biblioteca de componentes con todas sus interacciones, estados, React/Tailwind o auditoría de accesibilidad terminados.
- El asistente usa recetas locales; no hay LLM, arquitectura de aplicaciones generada ni backend de pagos/autenticación.

## Cobertura por módulo

“Parcial” significa que existe una base reutilizable, no que el módulo cumpla todos sus criterios.

| Módulo del documento | Situación actual | Trabajo pendiente principal |
|---|---|---|
| 01. Botones y acciones | Parcial: 13 registros | Agrupar variantes y documentar estados; comportamiento real de copy, loading, split y dropdown. |
| 02. Tarjetas y contenedores | Parcial: 25 registros | Familias por función, variantes estructurales, estados y propiedades. |
| 03. Formularios y entradas | Parcial: 5 formularios y 6 entradas | Controles completos, validación asociada al campo, autocompletado y patrones funcionales. |
| 04. Navegación | Parcial: 15 barras y 7 encabezados | Sidebars, navbar web, breadcrumbs, paginación, menús y footers. |
| 05. Indicadores y estado | Demos dispersas en avisos, datos y animaciones | Inventario específico y estados deterministas/indeterminados documentados. |
| 06. Identidad y gráficos | Avatares de catálogo y avatar propio de Tinta | Clasificar recursos, procedencias y variantes; no alterar Tinta sin petición. |
| 07. Tipografía | 7 demos | Escalas, licencias, combinaciones y propiedades configurables. |
| 08. Color y gradientes | 7 paletas y colores por registro | Tokens semánticos por tema y contraste verificado. |
| 09. Iconografía | SVG internos y 2 demos de sets | Metadatos por icono, estilos, accesibilidad y procedencia. |
| 10. Layout y composición | Composición móvil por función | Layouts configurables, rejillas y comportamientos por breakpoint. |
| 11. Pantallas de apps | 9 plantillas generales, no 9 flujos completos | Plantillas independientes por pantalla y estados asociados. |
| 12. Secciones web | Sin colección específica completa | Hero, features, pricing, testimonios, newsletter y footer responsive. |
| 13. Sistemas visuales | Tratamientos visuales en demos | Fichas de sistemas coherentes, reglas y compatibilidades. |
| 14. Movimiento | 6 demos y movimiento de Tinta | Estados, triggers, parámetros, rendimiento y reduced motion por recurso. |
| 15. Superficies y efectos | Ejemplos en tarjetas/fondos | Inventario con parámetros y límites de uso. |
| 16. Multimedia | Fotos editables en zonas compatibles | Galerías, carruseles, lightbox, vídeo/audio y archivos con interacción real. |
| 17. Visualización de datos | 5 registros de datos y algunos widgets | Tablas, gráficos accesibles, leyendas, unidades y fuente de datos. |
| 18. Responsive | Entorno probado en cuatro anchos | Validación y metadatos por recurso; composición tablet/desktop real. |
| 19. Accesibilidad y UX | Foco, labels, confirmaciones y mensajes presentes | Auditoría sistemática de contraste, teclado, lector y estados por componente. |
| 20. Design tokens | Variables del entorno y tokens del motor clásico | Contrato unificado de color, espacio, radio, sombra y capas. |
| 21. Código y documentación | Fuentes HTML/CSS y pruebas del editor | Paquete/ficha por recurso; exportadores adicionales solo cuando existan y se prueben. |
| 22. Plantillas por producto | Recetas locales y algunas plantillas | Arquitectura, mapas de pantallas, componentes y flujos por sector. |
| 23. Creador visual | Selección, composición, textos, fotos, enlaces y proyectos | Inspector de estilo, responsive, variantes, estados y más controles sin perder elecciones. |
| 24. Organización física | Código existente compartido | Definir estructura compatible antes de mover archivos o romper URLs/caché. |
| 25. Metadatos centrales | ID/nombre/categoría/descripción y algunos atributos | Esquema central validado con familia/variantes/estados/procedencia/calidad. |
| 26. Aceptación | Pruebas automatizadas de recorridos | Checklist verificable por recurso; no marcar listo solo por tener preview. |

## Entregas incrementales

### 1. Catálogo verificable — primera entrega implementada

- Definir esquema central para fichas, familias y variantes, preservando IDs actuales de proyectos.
- Mapear los registros existentes a módulos/subcategorías sin duplicarlos ni perderlos.
- Registrar tipo, etiquetas, tecnologías realmente disponibles, dependencias y procedencia. Si una licencia o autor se desconoce, indicar `por verificar`, no inventarlo.
- Separar existencia de demo de calidad comprobada: estado de implementación, responsive, accesibilidad y pruebas.
- Mostrar la ficha en la vista ampliada y ampliar búsqueda por etiquetas/módulo. No llenar categorías con componentes ficticios.

**Primera entrega:** `design-library/catalog.json` contiene 138 registros y 129 familias preliminares; el esquema se encuentra en `catalog.schema.json`. La ficha ampliada, búsqueda por etiquetas/ID/familia, filtros de módulo/estilo/familia y descarga de inventario/componentes ya están disponibles. Los IDs de proyectos se conservan. Los estados documentados y los selectores CSS detectados se diferencian de las auditorías pendientes. Las familias no implican que la revisión de duplicados haya concluido.

**Aceptación comprobada en esta entrega:** los 138 registros están inventariados una sola vez, siguen seleccionables, el proyecto existente vuelve a abrirse y ningún recurso pendiente aparece como auditado. Las auditorías individuales de responsive, accesibilidad, licencia y duplicados siguen pendientes. Ver `design-library/README.md` y `tests/tinta-catalog.cjs`.

### 2. Fundamentos y componentes básicos — primera tanda de estados disponible

- Tokens semánticos y reglas de espaciado, radios, sombras y foco.
- Familias de botones, tarjetas, entradas y controles con variantes y estados reales.
- Vista de estados verificable, navegación por teclado y checklist de accesibilidad.

**Primera tanda implementada:** tres botones, Producto con aire y Campo con validación tienen laboratorio funcional y controlador local exportable. Mantienen sus IDs; los ajustes se conservan explícitamente en proyectos. Los restantes recursos y las auditorías individuales siguen pendientes. Ver `design-library/ESTADOS-INTERACTIVOS.md`.

**Aceptación objetivo del módulo completo:** hover/focus/disabled/loading se distinguen y se comportan como se documenta; no se crean copias del mismo recurso por cada color.

### 3. Navegación, patrones y layouts

- Menús, tabs, sidebars, footers, formularios, modales y estados.
- Mobile/tablet/desktop con cambios de composición, no solo zoom de la pantalla móvil.
- Inspector de propiedades general en Tinta sin mezclar su modelo con el editor clásico. Historial de deshacer/rehacer ya disponible para el borrador de Tinta (hasta 50 cambios de sesión, limitado también por memoria). Entrega parcial disponible: color, acabado, radio, espaciado, texto y sombra en los 13 diseños de Botones; un botón concreto por bloque, con persistencia y exportación. Tema claro/oscuro independiente para la interfaz. Segunda entrega: inspector de las 25 tarjetas, con superficie elegible en mosaicos/pasteles/superpuestas, colores, degradado/ángulo, borde, radio, sombra y padding; persistencia/JSON/HTML sin cambiar selección, contenido ni acciones. Abrir un proyecto inicia un historial independiente; las copias guardadas y proyectos clásicos no se deshacen. Encabezados y estilos reutilizables siguen pendientes.

### 4. Pantallas y secciones web

- Pantallas completas de apps y secciones web por separado.
- Plantillas por sector con mapa de pantallas, contenido de ejemplo, navegación y dependencias explícitas.

### 5. Sistemas visuales, movimiento y paquetes

- Sistemas visuales coherentes y fichas de compatibilidad.
- Recursos multimedia y movimiento con reduced motion.
- HTML/CSS como fuente comprobable; React, Tailwind, ZIP o SVG solo se anuncian al existir exportaciones funcionales verificadas.

## Regla de cierre de cada entrega

Aplicar los criterios del módulo 26: IDs estables, búsqueda, preview real, no duplicados, estados/variantes, pruebas responsive y accesibles aplicables, código/dependencias y procedencia. Mantener visibles las limitaciones y los pendientes.

## Preview durante el desarrollo

```bash
python tools/tinta-preview.py
```

Sirve en `0.0.0.0:8081`; la raíz redirige a `/crear.html`. Los procesos del entorno de desarrollo pueden detenerse entre sesiones: este preview no es un despliegue permanente. El HTML independiente se genera con `python tools/build-tinta.py`. Para disponibilidad continua hace falta desplegar el proyecto en un hosting; no se ha hecho push ni despliegue permanente.
