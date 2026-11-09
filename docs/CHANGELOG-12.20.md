# 12.20 · Accesibilidad (WCAG 2.1 AA)

Auditoría automática con axe-core de Tinta y del Editor, en tema claro y oscuro. Resultado inicial: 6 botones sin nombre accesible (críticos), un editor con elementos interactivos anidados y decenas de textos con contraste insuficiente.

- **Lectores de pantalla**: las vistas previas decorativas (plantillas y editor de estilos) ya no exponen sus botones internos (`aria-hidden` + `inert`); la barra lateral plegada del Editor tiene nombres accesibles.
- **Contraste**: el texto secundario pasa de 2.8–4.3:1 a ≥ 4.5:1 sobre el papel en Tinta y en el Editor (pasos, filtros, notas, etiquetas, resúmenes, fichas…), y el naranja del titular se oscurece ligeramente.
- **Tema oscuro**: corregido un fallo antiguo — el botón «Elegir bloque» salía con texto claro sobre fondo claro (contraste 1.1:1). También se aclararon los grises de los componentes nuevos (plantillas, paletas, animaciones, pantallas…).
- **Prueba automática** `tests/a11y.cjs` (axe-core 4.10.2, fijado en `tests/package.json`): 16 pantallas (Tu idea, Los bloques, Tu pantalla, menú, copia de seguridad, crear mi estilo, ficha, Editor × claro/oscuro) sin incidencias críticas ni serias.
- Fuera de alcance, a propósito: el texto de ejemplo de los componentes de la biblioteca (forma parte del diseño que se copia) y las miniaturas del Editor. Quedan avisos menores (orden de encabezados, zonas del Editor) por revisar.
