# Inventario verificable de Estilos · esquema 1

- `catalog.json`: inventario base reproducible de **251 registros**, agrupados en **242 familias preliminares**, con los 26 módulos de la especificación definidos. Los módulos sin recursos no están implementados por el hecho de figurar en el esquema.
- `catalog.schema.json`: contrato JSON Schema 2020-12 de las fichas.
- Fuente de comportamiento/metadatos: `web/js/tinta-catalog.js`.
- Especificación: `docs/BIBLIOTECA-MAESTRA-UI-UX.md`.

## Regenerar

Desde la raíz del repositorio:

```bash
node tools/build-tinta-catalog.cjs
```

El generador usa los datos y diseños existentes. No requiere navegador, no mueve los componentes ni cambia los IDs que usan las pantallas/proyectos. El inventario base no incluye cambios personales de localStorage. El botón **Descargar inventario JSON** en Tinta exporta las fichas del catálogo disponible en ese navegador, incluidas sus altas/cambios/borrados personales.

## Familias y variantes

Los diseños de la biblioteca que comparten una variante del motor se agrupan en una familia. Dos acciones nuevas de Tinta comparten una base estructural y se agrupan como variantes grafito/coral. Los diseños de código propio conservan una familia estable por ID, sin agruparlos automáticamente por similitud visual.

Cada ID actual sigue teniendo un registro y puede volver a abrirse desde un proyecto. Esto es una agrupación de inventario, **no una auditoría completa de duplicados ni una eliminación de registros**. Los casos dudosos se marcan `review-pending`.

## Qué se comprueba y qué no

- El validador comprueba IDs únicos, campos básicos, módulos conocidos y referencias de variantes.
- El JSON Schema describe el contrato; las relaciones entre IDs/familias se comprueban en el validador y las pruebas.
- `frameworks` declara HTML/CSS y, en cinco recursos implementados, JavaScript local (`vanilla-js`). React/Tailwind no se anuncian como disponibles. Ver `ESTADOS-INTERACTIVOS.md`.
- `quality.status: inventory`: no significa terminado ni certificado.
- `preview.kind: live-html-css`: vista renderizada, no captura estática. La auditoría individual de cada recurso no está aprobada por este campo.
- `states.selectors_detected`: selectores encontrados en CSS, no comportamientos interactivos certificados. El estado de partida es `default`; los cinco recursos con controlador local documentan además sus estados implementados y la prueba del controlador. Las auditorías individuales no se dan por aprobadas por ese motivo.
- Responsive, accesibilidad, procedencia/licencia y duplicados siguen pendientes de revisión individual donde corresponda.
- Autor, licencia y fechas desconocidos son `null`; no se deducen de una referencia visual.
- `version` versiona la ficha de metadatos; no atribuye una versión certificada al componente.

## En la interfaz

Ampliar un bloque muestra módulo, ID, tipo, familia, etiquetas y estado de revisión. Las variantes, propiedades, calidad y procedencia se despliegan bajo demanda. Los cinco recursos compatibles incluyen un laboratorio funcional de variantes/estados, sin crear IDs duplicados. Navegar entre variantes no cambia la selección.

Se puede filtrar por módulo, familia y tratamiento visual detectado en CSS, además de categoría/colección. La búsqueda incluye nombre, descripción, ID, familia y etiquetas, sin depender de tildes.

**Descargar componente** entrega un HTML real con Shadow DOM declarativo y los ajustes actuales del bloque. Las imágenes locales se incorporan; las URLs remotas siguen necesitando conexión. Copiar código ofrece selección manual cuando el portapapeles está bloqueado.

El inventario JSON no es un respaldo de proyectos y no se importa con el botón **Importar JSON** de Mis proyectos. Las pantallas mantienen su formato propio `estilos-tinta-project` versión 1.

## Pruebas

Con `web` servido en el puerto 8080:

```bash
node tests/tinta-catalog.cjs
```

Las pruebas comprueban 251 IDs, módulos, filtros, etiquetas, familias, variantes, procedencia pendiente, consistencia entre inventario base y runtime, exportación real de componentes, portapapeles bloqueado, adaptación del entorno y conservación de selección/proyectos. No sustituyen una auditoría de accesibilidad o responsive de cada diseño.
