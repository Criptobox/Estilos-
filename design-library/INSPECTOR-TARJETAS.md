# Inspector de tarjetas · entrega incremental

## Acceso y alcance

En `crear.html`, abrir una ficha de Tarjetas → **Diseño de la tarjeta**, o seleccionar un recurso y usar **Tu pantalla → Diseño / estilo**. Los 25 recursos existentes de esta categoría están cubiertos. No se añaden diseños ni IDs. No es todavía un inspector para todas las categorías.

- Fondo original, sólido o degradado de dos colores con ángulo.
- Borde de 0–8 px y color; radio de 0–48 px; padding de 0–32 px.
- Sombra original intacta mientras se usa el acabado Original; al personalizar, sin sombra, suave o elevada.
- Texto con sus colores originales o color personal explícito. La coloración personal envuelve únicamente los nodos de texto elegibles, sin cambiar su contenido ni el color heredado de enlaces/botones. No modifica SVG, imágenes ni campos.
- Las propiedades originales disponibles (padding superior, radio superior izquierdo, borde superior y colores) se leen del elemento renderizado para inicializar los controles; los ajustes personales son uniformes en los cuatro lados. Las sombras originales complejas se resumen como Suave al activar un acabado personal.
- Preview temporal; Aplicar y Restaurar explícitos. Cerrar/Escape descarta el borrador temporal.

## Superficies y límites

La superficie habitual es el contenedor exterior del recurso. Para `card.tile` y `card.pastel`, cada celda es elegible. Para `card.stack`, se elige frente o reverso. Se guarda **una configuración para una superficie concreta por bloque**, no múltiples estilos independientes por celda. Cambiar de superficie y aplicar restaura las demás al diseño original.

Fotos, ilustraciones, secciones internas y pseudoelementos decorativos se conservan. Pueden cubrir el fondo personalizado: no se promete recolorear una foto ni todos los detalles de una tarjeta. No se modifican ancho, alto, tipografía, composición ni el código del catálogo. Espaciado grande en diseños de altura fija puede exigir revisión visual.

El contraste es orientativo: solo se calcula al elegir texto personal, contra fondo sólido o extremos del degradado. No certifica capas internas, fotos, transparencias, estados ni todo el catálogo. Con texto original se pide revisar la legibilidad sobre el nuevo fondo.

## Persistencia y seguridad

`cardStyles` es una propiedad opcional del borrador y del JSON de proyecto versión 1. Se conserva en las copias con nombre, importación y exportación HTML individual o de pantalla. Los proyectos anteriores siguen siendo válidos. Las configuraciones importadas se validan contra IDs y superficies existentes; formatos, rangos, enteros y HEX6 se restringen. No se aceptan CSS, selectores ni JavaScript del proyecto.

El borrador local omite estilos incompatibles con aviso y conserva la selección. Una importación inválida se rechaza. Almacenamiento bloqueado no se presenta como guardado persistente: el estilo solo queda en la sesión y la UI recomienda descargar JSON.

Pipeline: textos/assets → estilo de superficie → estados/controladores → estilo de botones. Nunca se aplica en el modelo de edición de texto. Las marcas de estilo son de render/exportación y no alteran los índices de campos ni el contenido original. Los cinco recursos con controladores mantienen su comportamiento; el inspector no añade interactividad a recursos estáticos.

El tema oscuro pertenece a Tinta. Los Shadow DOM de componentes fijan `color-scheme:light` para que los controles nativos no cambien de aspecto por la preferencia de la interfaz. Personalizar una tarjeta oscura es una decisión separada.

## Verificación

- `node tests/tinta-card-style.cjs`: 66 comprobaciones de edición temporal/aplicada/restaurada, 25 recursos, superficies, colores, contraste orientativo, proyectos/JSON, HTML individual/pantalla, estado favorito/selección y variante horizontal, normalización y almacenamiento incompatible.
- `python tools/build-tinta.py && node tests/tinta-standalone.cjs`: prueba de la copia autónoma en iframe `sandbox="allow-scripts"`, incluido estilo de tarjeta y aviso de almacenamiento bloqueado.
- Tamaños 320, 390, 768 y 1440 px sin desbordamiento horizontal del inspector. El diálogo conserva acciones y cierre visibles al desplazarse.
- Regresión de selección, textos, imágenes, destinos, proyectos, catálogo, tema y estados: suites Tinta existentes. No sustituye una auditoría individual de accesibilidad de todos los recursos.

Deshacer/rehacer de los cambios aplicados ya está disponible: ver `HISTORIAL-TINTA.md`. Pendiente: encabezados, inspector general y estilos personales reutilizables. Sin push ni despliegue permanente.
