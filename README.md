# Estilos · Tinta actual + biblioteca y editor clásicos

Biblioteca UI y constructor visual multipantalla, pensado para móvil y disponible como PWA y envoltorio Android.

## Entrada de esta entrega

**La portada publicada es ahora Tinta**, con la mancha 3D, modo oscuro, estilos de botones/tarjetas y Deshacer/Rehacer. `web/index.html` contiene la misma versión que `web/crear.html`. Ya no abre la interfaz clásica por defecto.

- Tinta: `/` o `/index.html`; alias compatible: `/crear.html`.
- Biblioteca clásica preservada: `/biblioteca.html`.
- Editor clásico y sus proyectos: `/agente.html`.
- GitHub Pages publica la carpeta `web` mediante `.github/workflows/pages.yml`. Ver [`LEEME-SUBIR-A-GITHUB.md`](LEEME-SUBIR-A-GITHUB.md).
- La caché PWA cambia de versión y precarga los recursos de Tinta; se conserva el almacenamiento de proyectos. La navegación busca primero la versión de red y usa la caché sin conexión.
- Fuente de la portada: `web/crear.html`. Tras editarla, ejecutar `python tools/sync-tinta-entry.py`; CI verifica que ambas entradas coincidan.

## Especificación maestra de la biblioteca

El documento aportado por el usuario se conserva en [`docs/BIBLIOTECA-MAESTRA-UI-UX.md`](docs/BIBLIOTECA-MAESTRA-UI-UX.md). Define 26 módulos de alcance objetivo, no funciones ya completadas.

La cobertura actual, las carencias y las entregas incrementales se registran en [`docs/PLAN-BIBLIOTECA-MAESTRA.md`](docs/PLAN-BIBLIOTECA-MAESTRA.md). La primera entrega del catálogo verificable está disponible: fichas, familias, etiquetas, módulos, estados documentados/detectados y calidad pendiente, preservando los 138 registros e IDs existentes. Detalles y generación del inventario: [`design-library/README.md`](design-library/README.md). No se consideran auditados los recursos por tener una ficha.

Preview de desarrollo: `python tools/tinta-preview.py` → puerto 8081, ruta `/crear.html`. El proceso puede detenerse entre sesiones; no es un hosting permanente.

## En validación · Tinta y el recorrido de tres pasos

Abrir **`web/crear.html`** (o `/crear.html` en el servidor web). Es un prototipo independiente: no sustituye el editor ni modifica sus proyectos.

- **Idea:** avatar 3D basado en la mancha aportada, breve descripción y acceso directo a explorar.
- **Bloques:** biblioteca completa conectada al mismo recorrido (126 diseños originales + 12 nuevos de Tinta), con búsqueda, 19 categorías, filtro de colección, vista ampliada y selección persistente.
- **Pantalla:** revisión por función, orden de tarjetas y resolución explícita de encabezados o barras alternativos. Composición real y descarga de HTML estático autónomo, sin servicios ni IA remota.
- Acabado blanco cálido/grafito/coral, sombras de contacto, relieve y degradados locales. No carga Lavender Glass.
- La selección usa `estilos-tinta-prototype-v1`, independiente de las claves del editor. El brief propone recetas por palabras; no interpreta instrucciones arbitrarias con un modelo de lenguaje.
- El HTML descargado utiliza Shadow DOM declarativo (navegadores modernos). Es visual, no una app con pagos o autenticación.

**Conectado:** catálogo completo y motor de renderizado `designParts`, con las altas, cambios de ficha y borrados guardados en la biblioteca de este navegador. El código propio se muestra como HTML/CSS saneado, sin ejecutar JavaScript. Las categorías adicionales participan en revisión, composición y exportación; no se descartan al crear. El avatar ya no lleva círculo decorativo.

**Edición y proyectos disponibles:**
- En revisión, **Texto** permite cambiar textos y placeholders de cada bloque (hasta 500 caracteres por campo), aplicar o restaurar los originales. La vista, la exportación HTML y los proyectos usan el mismo contenido editado.
- **Mis proyectos** guarda hasta 30 copias de Tinta, con nombres de hasta 80 caracteres. Abrir, actualizar y eliminar piden confirmación; renombrar no altera la composición. Usa la clave independiente `estilos-tinta-projects-v1`.
- Descarga/importación de proyecto JSON `estilos-tinta-project` versión 1 (máximo 8 MB). Importar crea una copia; no reemplaza el trabajo en curso. Un bloque ausente se informa y no se elimina silenciosamente del proyecto.
- Los proyectos clásicos de este navegador se muestran por separado. Su enlace abre el editor original con la confirmación del proyecto seleccionado; no convierte formatos ni sobrescribe su copia guardada.
- El visor aislado puede bloquear el almacenamiento o las descargas. Para guardar de forma persistente, usar la app en el navegador; JSON permite llevar la composición a otra instalación con los mismos bloques.

**Color, estilo de botones y tema de Tinta:**
- **Color / estilo** está disponible en revisión y en la ficha ampliada de los 13 diseños de la categoría Botones. Permite elegir un botón o enlace dentro del bloque y ajustar fondo, texto/iconos, acabado sólido/borde/tonal/degradado, radio, espaciado, tamaño de texto y sombra.
- Vista temporal, Aplicar y Restaurar original. No selecciona recursos ni cambia texto, destino o estados. Se guarda un estilo personal para un botón concreto por bloque; los demás conservan su diseño. El estilo personal tiene prioridad sobre el acabado del laboratorio de estados.
- Persistencia en borrador, proyectos, JSON y HTML exportado. Los proyectos anteriores siguen siendo compatibles; las propiedades importadas están tipadas y no admiten CSS arbitrario.
- El botón **◐** de la cabecera alterna claro/oscuro y recuerda la preferencia en `estilos-tinta-ui-theme-v1`. Cambia la interfaz, no recolorea los componentes del diseño ni su HTML exportado.
- En el visor aislado el tema y el estilo funcionan durante la sesión; se informa si el almacenamiento está bloqueado. El editor de estilos aplica directamente con JavaScript, sin depender de envíos de formulario bloqueados por el sandbox.

**Inspector de tarjetas disponible:**
- En revisión, **Diseño / estilo**, y en la ficha ampliada, **Diseño de la tarjeta**. Cubre los 25 recursos de Tarjetas, sin añadir ni sustituir diseños.
- Fondo sólido o degradado de dos colores y ángulo, borde (color/grosor), radio, sombra y espaciado interior. Los valores iniciales de geometría se leen del diseño real. El texto conserva sus colores, salvo que elijas explícitamente un color personal; los enlaces y botones no se recolorean.
- En mosaicos, pasteles y tarjetas superpuestas se elige la superficie concreta. Se guarda un estilo para una superficie por bloque; no se acumulan estilos para todas sus celdas. Fotos, ilustraciones y capas interiores permanecen y pueden cubrir el fondo exterior.
- Previsualizar no selecciona recursos. Cancelar descarta cambios temporales; Aplicar y Restaurar son acciones explícitas. El original del catálogo no se modifica.
- `draft.cardStyles` es opcional en borradores/proyectos/JSON v1. Se valida sin CSS ni selectores importados; los proyectos anteriores son compatibles. HTML de pantalla y componente individual incluyen el estilo, manteniendo los controladores existentes.
- Funciona en tema claro/oscuro y en el visor aislado. Si el navegador bloquea almacenamiento, informa que solo se aplicó a la sesión y recomienda JSON.
- Detalles y límites: [`design-library/INSPECTOR-TARJETAS.md`](design-library/INSPECTOR-TARJETAS.md). Encabezados, inspector general y estilos reutilizables siguen pendientes. Deshacer/rehacer de Tinta ya está disponible (ver abajo).

**Deshacer / Rehacer en Tinta:**
- Botones visibles en los tres pasos; muestran en su descripción la próxima acción que recuperan. Atajos Ctrl/⌘+Z y Ctrl/⌘+Mayús+Z; también Ctrl+Y.
- Historial de sesión de hasta 50 cambios aplicados: idea, selección, alternativas, orden, textos, fotos, destinos, estados/variantes y estilos de botones/tarjetas. Escribir la idea se agrupa hasta salir del campo.
- Previews sin aplicar, filtros, navegación, tema y demostraciones transitorias no se incluyen. No se intercepta el deshacer nativo dentro de campos de texto; con diálogos abiertos no se ejecuta el historial global.
- Un cambio nuevo después de deshacer descarta la rama de rehacer. «Empezar una selección nueva» es reversible; abrir un proyecto confirmado inicia un historial independiente.
- El borrador recuperado se guarda si el navegador lo permite. El historial no se exporta ni se conserva al recargar; las copias con nombre y los proyectos clásicos no se deshacen.
- Presupuesto de memoria aproximado de 16 MiB, además del límite de 50 pasos; se liberan los más antiguos y se informa. Se conserva al menos el último cambio, que puede superar ese presupuesto si contiene fotos grandes. Detalles: [`design-library/HISTORIAL-TINTA.md`](design-library/HISTORIAL-TINTA.md).

**Imágenes y destinos disponibles:**
- En revisión, **Foto / enlace** permite cambiar imágenes compatibles por URL HTTPS o archivo PNG/JPEG/WebP de hasta 5 MB. Se redimensiona a 1024 px, se aplana la transparencia sobre blanco cálido y se incorpora como JPEG (hasta 750 000 caracteres por foto; máximo 6 MB de imágenes por pantalla). Se puede editar su descripción accesible y restaurar el original.
- Zonas compatibles: Producto con aire de Tinta; Producto clara, Texto sobre foto, Categoría con ilustración y Comida de la biblioteca; etiquetas `img` de diseños propios. No se sustituyen arbitrariamente los iconos ni los gráficos.
- Destinos HTTP(S), `mailto:`, `tel:` y `#seccion` (requiere que exista ese ID). Se rechazan JavaScript, credenciales y esquemas no permitidos. Los enlaces externos llevan `noopener noreferrer`. Los botones conservan su diseño al convertirse en enlaces reales.
- La vista previa no navega; los enlaces se activan en el HTML descargado. No se añaden servicios de pagos, reservas o autenticación.
- Las fotos locales, descripciones y destinos se conservan en borrador, proyectos, JSON y HTML. Las fotos por URL requieren conexión; no se descargan automáticamente. Los proyectos JSON anteriores, sin imágenes, siguen siendo válidos.
- Cada diálogo permite cancelar sin aplicar; restaurar es una acción explícita. Los errores de archivo, URL o almacenamiento se informan sin fingir que se ha guardado una copia.

**Pendiente:** unificación de formatos con el editor clásico. No se ha hecho push.

Estados y variantes locales disponibles en los tres botones nuevos de Tinta, Producto con aire y Campo con validación: laboratorio de pruebas, configuración explícita y controlador incluido en el HTML. No se extiende esta capacidad al resto del catálogo sin implementarla. Detalles: [`design-library/ESTADOS-INTERACTIVOS.md`](design-library/ESTADOS-INTERACTIVOS.md).

Pruebas del prototipo: `node tests/tinta.cjs`, `node tests/tinta-library.cjs`, `node tests/tinta-workflow.cjs`, `node tests/tinta-assets.cjs`, `node tests/tinta-catalog.cjs`, `node tests/tinta-states.cjs`, `node tests/tinta-button-style.cjs`, `node tests/tinta-card-style.cjs`, `node tests/tinta-history.cjs` y `python tools/build-tinta.py && node tests/tinta-standalone.cjs` (requiere servir `web` en el puerto 8080). Se comprueban navegación, selección, conflictos, persistencia, reordenación, exportación real y tamaños 320/390/768/1440 px.

## Nuevo en 14.1 · Lavender Glass y Luma

Cambio de dirección visual a partir de una referencia de vidrio esmerilado lavanda: transparencias, reflejos interiores, sombras suaves y superficies redondeadas. Se mantienen la organización y las funciones del editor; se reemplaza su acabado administrativo plano.

- **Luma** es la identidad visual del agente: avatar 3D propio, visible en biblioteca, cabecera del editor y presentación del asistente. El asset es WebP local (aprox. 8 KB), sin servicios externos.
- Biblioteca con cabecera creativa y categorías como iconos sobre superficies de vidrio.
- Editor con paneles esmerilados, lienzo lavanda y marco de dispositivo de acabado suave.
- Dos temas: lavanda claro (predeterminado para nuevas instalaciones) y violeta nocturno. Se respetan las preferencias ya guardadas.
- El avatar no añade un modelo de IA: las propuestas siguen usando recetas locales, como indica la interfaz.

La referencia se usa como dirección de materiales y atmósfera, no como una maqueta copiada. Los estilos seleccionados en el lienzo conservan su propio contenido y tokens; el nuevo acabado no se inyecta en su HTML exportado.

Pruebas: `node tests/lavender.cjs`.

## Nuevo en 14.0 · Rediseño del entorno Studio

- Sistema visual compartido entre biblioteca y editor: superficies neutras, índigo, bordes sutiles y sin brillos decorativos. Preferencia de tema compartida.
- Navegación lateral en escritorio; navegación inferior en móvil. Acceso directo a proyectos desde la biblioteca. El creador clásico sigue disponible.
- Editor con capas a la izquierda, lienzo al centro e inspector de propiedades a la derecha desde 1200 px. En móvil y tablet el inspector es un panel inferior.
- Selección directa de bloques en el lienzo o la lista, con indicador de selección. El inspector de escritorio no bloquea la interacción con el resto de la app.
- Reordenación por arrastre desde la miniatura del bloque, con las flechas como alternativa táctil y de teclado. Compatible con deshacer/rehacer.
- Brief plegable (cerrado inicialmente en escritorio) para priorizar la lista de bloques. Selector con elección de rol para recuperar bloques opcionales o reemplazarlos.
- Biblioteca con tarjetas de marco consistente y miniaturas ajustadas para no recortar diseños altos. La vista detallada conserva el tamaño completo.
- Proyectos como vista de trabajo en escritorio, con miniaturas aisladas del diseño guardado. Las miniaturas resumen encabezado, tarjeta y acción; no representan la pantalla completa. En móvil se conserva el diálogo de gestión.

No se ha cambiado el formato de proyectos ni se han eliminado funciones de exportación o respaldo. El lienzo del Agente sigue siendo móvil (390 px), no un constructor de diseños de escritorio responsive.

Pruebas nuevas: `node tests/studio-shell.cjs`. Detalles: `docs/DISENO-STUDIO-14.md`.

## Nuevo en 13.7 · Imágenes y destinos por bloque

Desde **Aa → Editar contenido**:

- Imágenes en cuatro variantes: **Producto clara**, **Texto sobre foto**, **Categoría con ilustración** y **Comida**. Otros diseños muestran sus limitaciones; no se sustituyen iconos arbitrariamente.
- URL HTTPS o archivo PNG/JPEG/WebP de hasta 5 MB. El archivo se redimensiona a un máximo de 1024 px y se incorpora como JPEG (la transparencia se aplana sobre blanco). No se admite SVG. La imagen comprimida debe caber en el límite de 750 000 caracteres.
- Descripción alternativa y restauración de la ilustración original.
- Destinos para botones y enlaces: http(s), mailto, tel o ancla #seccion. No implementa acciones de compra, envío de formularios ni navegación entre pantallas. Las anclas dependen de que exista un destino compatible en la página exportada.
- Los botones con destino se exportan como enlaces, conservando sus estilos. El editor evita navegar al pulsarlos.
- Imágenes, descripciones y enlaces se incluyen en proyectos, historial y respaldos JSON. Respaldos anteriores sin estos campos siguen siendo compatibles.

Las imágenes externas requieren internet; las subidas quedan dentro del HTML/JSON. Si el almacenamiento del navegador se llena, se avisa: exporta el HTML antes de salir. Mantén las imágenes pequeñas para no agotar el almacenamiento local.

Pruebas: `node tests/media.cjs`.

## Nuevo en 13.6 · Respaldos portables JSON

En **Agente → Proyectos**:

- **Exportar todos · JSON** descarga las copias guardadas. Cada proyecto tiene también **Exportar JSON**.
- Actualiza antes las copias si quieres incluir los últimos cambios del borrador.
- **Importar respaldo** valida el archivo y muestra sus nombres antes de confirmar.
- La confirmación añade copias con identificadores nuevos: no sobrescribe proyectos ni cambia la pantalla actual.
- Límite de archivo: **8 MB**; límite total: **30 proyectos**. La importación es completa o no se guarda ninguno, incluido si falla el almacenamiento.
- Solo se acepta el formato versionado de proyectos de Estilos, no el JSON de tokens. Se validan bloques, roles, paleta, orden, textos y tamaños. El JSON no se ejecuta como código.

El archivo permite llevar las pantallas a otro navegador sin cuenta ni nube. El historial de deshacer no se incluye. Conserva el respaldo en un lugar seguro: contiene el contenido escrito en tus proyectos.

Pruebas: `node tests/backup.cjs`.

## Nuevo en 13.5 · Proyectos locales

En **Agente → Proyectos** puedes guardar hasta 30 pantallas con nombre, abrirlas, duplicarlas, renombrarlas, actualizarlas o eliminarlas. Abrir, actualizar y eliminar requieren confirmación.

La pantalla de trabajo se guarda automáticamente. Los proyectos son **copias explícitas independientes**: usa **Actualizar** para reemplazar una copia con la pantalla actual. Abrir una copia reemplaza el borrador y reinicia el historial. Guarda una copia del borrador antes de abrir otro proyecto si deseas conservarlo.

Se guardan los bloques, el orden, los candados, los textos, la paleta, el tema y el brief. Los proyectos viven solo en el almacenamiento del navegador: no se sincronizan ni tienen respaldo en la nube; borrar los datos del sitio los elimina. Un error de almacenamiento se muestra sin anunciar un guardado exitoso.

Pruebas: `node tests/projects.cjs`.

## Nuevo en 13.4 · Comparar antes de aplicar

El selector del Agente permite buscar por varias palabras, filtrar por tema original y ordenar por catálogo, nombre o diseño actual. Muestra el número de coincidencias y permite limpiar los filtros.

Selecciona una miniatura para comparar **Actual / Propuesta** con tu paleta y tus textos. El proyecto no cambia hasta pulsar **Aplicar diseño**. Cancelar o Escape descartan la propuesta sin tocar el historial. Aplicar se puede deshacer y rehacer. La comparación corresponde al bloque seleccionado; en tarjetas no simula la pareja completa que forma el lienzo.

Pruebas: `node tests/picker.cjs`.

## Nuevo en 13.3 · Deshacer y rehacer

- Historial de **50 cambios por sesión**: bloques, candados, visibilidad, orden, sector, marca, brief y contenido.
- Botones en la barra superior y en el editor de contenido. Atajos **Ctrl/⌘Z**, **Ctrl/⌘Mayús+Z** y **Ctrl+Y** fuera de campos de texto.
- Escritura y controles continuos se agrupan; un cambio nuevo tras deshacer descarta la rama de rehacer.
- El diseño actual y el orden sobreviven a una recarga; el historial empieza vacío al volver a abrir.
- Acciones de los bloques siempre visibles en móvil, sin depender del hover.

Pruebas: `node tests/history.cjs`.

## Nuevo en 13.2 · Contenido propio

En el Agente, pulsa **Aa** junto a un bloque para editar sus textos y placeholders. Los cambios se guardan automáticamente por diseño, se muestran en el lienzo y se incluyen en el HTML exportado. Si hay dos tarjetas se pueden editar las dos desde el mismo editor. **Restaurar originales** elimina las sustituciones de los diseños abiertos.

Solo se admite texto (máximo 500 caracteres por campo), no HTML. Esta versión no edita imágenes, enlaces ni acciones. El editor admite Escape y mantiene el foco de teclado dentro del diálogo.

Pruebas del editor: `node tests/content.cjs`.

## Nuevo en 13.1 · Explorar y coherencia visual

- Navegación simplificada: **Explorar · Crear · Agente**. Plantillas y Colecciones viven dentro de Explorar.
- Portada con vistas previas reales, categorías y recuento dinámico del catálogo.
- Acento de marca compartido, tipografía y sombras normalizadas.
- Buscador global con **Ctrl/⌘K**, `/`, flechas, Enter y Escape.
- Candado por bloque: conserva diseño y visibilidad al regenerar; se recuerda al recargar.
- Revisión del Agente con seis comprobaciones orientativas de estructura, contraste de tokens y tamaños declarados. No sustituye una auditoría de accesibilidad de todos los bloques.
- Verificación: `node tests/e2e.cjs` (174) y `node tests/mejoras.cjs` (60).

## Nuevo en 13.0 · Agente de diseño (`web/agente.html`)
- **Flujo tipo Stitch**: escribes un brief (o eliges sector) y el agente propone una pantalla completa.
- **7 bloques**: Encabezado, Buscador, Métricas, Tarjetas, Lista, Botón y Barra inferior. Cada bloque se cambia por cualquiera de los 107 diseños de la biblioteca, con tu paleta ya aplicada.
- **ADN de marca**: 3 colores, redondeo, tema claro/oscuro y densidad aplicados a todos los bloques a la vez.
- **Exportar**: HTML autocontenido (Shadow DOM declarativo, sin JS), tokens JSON y prompt para otra IA.
- Recolor seguro: solo se sustituyen los colores con saturación real (nunca los grises de fondo); en oscuro se invierten solo los neutros. Los diseños que ya eran oscuros se dejan intactos.
- Acceso desde la portada (tarjeta **Agente**), atajo en el manifest y precache en el service worker.
- Corrección: el `fonts/plus-jakarta-sans.woff2` tenía el espacio a 0.17 em (las palabras se pegaban); ahora 0.26 em.
- Análisis completo y plan de mejoras: `docs/ANALISIS-Y-MEJORAS.md`.

## Aspecto (12.0)
- Violeta → azul sobre azul noche, con cristal y brillo; **oscuro por defecto** y un claro a juego (Ajustes → Tema; Automático sigue al sistema).
- Barra inferior de 5 elementos con etiqueta: **Inicio, Biblioteca, Creador, Plantillas, Colecciones**. Ajustes pasa a la cabecera de Inicio.
- **Inicio**: título, buscador, accesos rápidos con cifras reales y «Recientes» (los últimos estilos abiertos).
- **Biblioteca**: cuadrícula de categorías con filtros Todo / Fundamentos / Componentes; cada categoría abre su lista, con un chip «Todo».
- **Colecciones**: los estilos guardados.
- **Creador móvil** (pantallas de hasta 759 px): lienzo siempre visible, barra de herramientas (Añadir, Estilos, Colores, Texto, Tamaño) y hojas que suben desde abajo y empujan el lienzo en vez de taparlo, con los cambios en vivo. Modos Diseño / Código / Vista previa, barra de acciones sobre el componente y hoja de Capas y pantallas. En escritorio se mantiene la distribución en columnas.
- **Detalle**: pestañas Detalles, Código, Editor y Relacionados; panel de Uso; **descarga del componente como PNG o SVG**.
- **Paletas**: filas con la barra de colores (cada color se copia con un toque) y filtro Todas / Claras / Oscuras.
- **Plantillas**: cuadrícula de dos columnas con vistas previas reducidas.
- Iconos de la app con el nuevo estilo.

## Biblioteca
- 107 diseños base en 15 categorías con componentes.
- 27 capturas de referencia.
- Previsualización, código, paletas, favoritos, búsqueda y contraste WCAG.

## Constructor
- Hasta 8 pantallas por proyecto, con creación, duplicación, cambio y eliminación.
- Hasta 12 componentes por pantalla.
- Cada pantalla guarda su propio título, descripción, capas y propiedades.
- Edición de color, tipografía, tamaño, peso, alineación, redondeo, espaciado, borde, sombra, ancho y desplazamiento.
- Arrastre del asa en la vista previa para ajustar posición.
- Temas predefinidos: Violeta Studio, Midnight, Ivory y Mint.
- Guardado de temas personalizados en el dispositivo.
- Tamaño de la maqueta: móvil pequeño, móvil, móvil grande o tablet.
- Exportar: HTML autocontenido con navegación entre pantallas, o **ZIP** con ese HTML, un proyecto **React + CSS** y un proyecto **React + Tailwind v4** (Vite), con las imágenes como archivos. Opción de modo oscuro automático en la página exportada.
- **Compartir con un enlace**: el proyecto va comprimido en el `#` de la dirección (no pasa por ningún servidor); quien lo abre confirma y puede deshacerlo. Las imágenes no viajan en el enlace.
- **Reordenar capas arrastrando el asa** (⠿) con el dedo o el ratón; también se puede arrastrar a una carpeta.
- **Calidad de las imágenes** que reemplazas: Baja (640 px), Media (1000 px) o Alta (1600 px).
- Las imágenes que reemplazas se guardan en IndexedDB (no en `localStorage`, que se llena con pocas fotos).
- El historial de deshacer/rehacer sobrevive a las recargas (misma pestaña).
- Las ediciones de texto e imagen guardan, además de la ruta, la etiqueta y el texto original; si un diseño cambia, la edición solo se aplica si el nodo sigue siendo el mismo.
- «Aplicar al constructor» en la paleta de una captura: ajusta el color principal y el fondo y la guarda como tema.

## Novedades (PWA)
- Archivos nuevos: `web/js/stacks.js` (tokens para otras plataformas) y `web/js/userrefs.js` (capturas propias y extracción de paleta).
- **Editor en vivo** (pestaña *Editor* del detalle): colores, radio y modo con vista previa al instante; *Aplicar a este estilo* o *Guardar variante*.
- **Código para más plataformas**: HTML/CSS (componente completo) y tokens del tema para Tailwind (v3 y v4), Jetpack Compose, SwiftUI y Flutter.
- **Capturas propias** en *Referencias* (se guardan en este dispositivo con IndexedDB) y **sacar la paleta** de cualquier captura → crear un estilo con ella.
- **Copia automática en un archivo** (Chrome y Edge de escritorio): eliges un archivo una vez y la app lo actualiza sola con cada cambio; tras reiniciar el navegador pide reactivarla con un toque.
- **Copia de seguridad en archivo**: descargar, compartir (menú del sistema) e importar `.json`. Incluye tus estilos, el proyecto del constructor con sus imágenes, tus temas y tus capturas propias.
- Búsqueda sin acentos y con varias palabras; vistas previas que se dibujan al acercarse a la pantalla.
- Service worker «caché primero»: abre al instante sin conexión o con mala red.
- Capturas de referencia en WebP (2,8 MB → 0,65 MB).
- Accesibilidad: el foco queda dentro de hojas y visor y vuelve al botón que los abrió; *Eliminar* pasa al menú «⋯» del detalle.
- Opción en Ajustes para atenuar las vistas previas claras de las listas en modo oscuro.

## Modo oscuro
- Tema **Automático / Claro / Oscuro**: botón en la cabecera de Inicio (alterna) y selector en Ajustes. Se guarda en `localStorage` (`estilos-theme`) y se aplica antes de pintar (sin destello).
- Toda la interfaz usa variables CSS (`:root` y `:root[data-theme="dark"]` en `css/styles.css`); las vistas previas mantienen su propio escenario claro/oscuro.
- Android 10+ (API 29): tema `DayNight` en `res/values-v29`, así el modo Automático y las barras del sistema siguen al teléfono. En Android 8–9 el modo Automático usa claro; elige Oscuro a mano.


## Versiones
- Web/PWA: `14.1.0` (GitHub Actions añade el número de compilación).
- Android: `versionCode 50`, `versionName 12.20`.
- Application ID: `com.estilos.app`; minSdk 26; targetSdk 34.

## Ejecutar
```bash
cd web
python3 -m http.server 8000
```
Abrir `http://localhost:8000`.

## Pruebas
Pruebas de extremo a extremo con Playwright y Chromium (`tests/e2e.cjs`): arranque y tema, búsqueda, editor en vivo, constructor (añadir, deshacer, carpetas, imágenes, texto), persistencia, copia de seguridad, exportación HTML/ZIP, accesibilidad, móvil y sin conexión.
```bash
cd tests
npm ci
npx playwright install chromium
npm test            # todas las pruebas (tests/run-all.cjs)
node run-all.cjs tinta   # solo las que contengan «tinta»
```
`run-all.cjs` levanta su propio servidor estático, genera el HTML autónomo y guarda capturas en un directorio temporal; también comprueba la coherencia de versiones (`version.json` ⇄ Gradle ⇄ README) y el precache del service worker. La versión de Android se cambia **solo** en `version.json`.

Las ejecuta el workflow `tests.yml` en cada pull request, y `pages.yml` las ejecuta antes de publicar: **si fallan, la PWA no se publica** (una publicación manual puede saltárselas con `skip_tests`).

## Compilar APK
Requiere JDK 17, Android SDK 34 y Gradle 8.9.
```bash
gradle :app:assembleDebug
```
El workflow `android.yml` compila una APK debug y la publica como artifact.

## Estado de verificación
Se comprueba la sintaxis de todos los JavaScript y la integridad del ZIP. La compilación APK y las pruebas en un teléfono físico deben confirmarse en GitHub Actions/dispositivo.

## Historial
- **12.20**: accesibilidad WCAG 2.1 AA (contraste, nombres, tema oscuro) con prueba automática axe-core. Ver `docs/CHANGELOG-12.20.md`.
- **12.19**: precios con formato propio por sector. Ver `docs/CHANGELOG-12.19.md`.
- **12.18**: copia de seguridad completa y restauración no destructiva. Ver `docs/CHANGELOG-12.18.md`.
- **12.17**: una ilustración distinta en cada tarjeta, según el sector y la paleta. Ver `docs/CHANGELOG-12.17.md`.
- **12.16**: todas las pantallas de la app (Inicio, Explorar, Guardados y Perfil) con barra navegable y exportación multi-pantalla. Ver `docs/CHANGELOG-12.16.md`.
- **12.15**: Mis estilos: crear, editar y borrar estilos propios en Tinta. Ver `docs/CHANGELOG-12.15.md`.
- **12.14**: paletas de color como capa sobre fondo, tarjetas y botones. Ver `docs/CHANGELOG-12.14.md`.
- **12.13**: Recientes y descarga PNG/SVG en Tinta. Ver `docs/CHANGELOG-12.13.md`.
- **12.12**: animaciones en la biblioteca, aplicables a la pantalla y a la exportación. Ver `docs/CHANGELOG-12.12.md`.
- **12.11**: plantillas completas en la biblioteca de Tinta. Ver `docs/CHANGELOG-12.11.md`.
- **12.10**: las tarjetas como estilos: «Copias» con contenido del sector. Ver `docs/CHANGELOG-12.10.md`.
- **12.9**: compartir una pantalla de Tinta por enlace (se recibe como copia). Ver `docs/CHANGELOG-12.9.md`.
- **12.8**: un solo estilo en toda la app (piel de Tinta en el Editor y la biblioteca clásica). Ver `docs/CHANGELOG-12.8.md`.
- **12.7**: una sola biblioteca dentro de Tinta (Favoritos incluidos); `biblioteca.html` redirige a Tinta. Ver `docs/CHANGELOG-12.7.md`.
- **12.6**: botón «Instalar la app» en Tinta, capturas e `id` en el manifest y arreglo de la publicación. Ver `docs/CHANGELOG-12.6.md`.
- **12.5**: el Agente ofrece «Ver 3 propuestas» para comparar y elegir. Ver `docs/CHANGELOG-12.5.md`.
- **12.4**: «Adaptar textos a mi idea» rellena los bloques según el sector; botón Atrás de Android y pruebas unificadas. Ver `docs/CHANGELOG-12.4.md`.
- **12.3**: el creador arma la página entera: pantalla vacía por defecto, posición Arriba/Contenido/Abajo, elementos sin tarjeta, cabecera y barra de ejemplo opcionales, 20 elementos por pantalla. Ver `docs/CHANGELOG-12.3.md`.
- **12.2**: nuevo aspecto (fase 3): Detalle con Relacionados y Uso, PNG/SVG del componente, Paletas, Plantillas e iconos. Ver `docs/CHANGELOG-12.2.md`.
- **12.1**: nuevo aspecto (fase 2): Creador móvil con lienzo siempre visible, herramientas y hojas. Ver `docs/CHANGELOG-12.1.md`.
- **12.0**: nuevo aspecto (fase 1): sistema visual oscuro/claro, barra de 5 elementos, Inicio, Biblioteca por categorías y Colecciones. Ver `docs/CHANGELOG-12.0.md`.
- **11.1**: exportación con Tailwind, copia automática en un archivo, compartir por enlace, reordenar capas con el dedo, calidad de imagen y publicación condicionada a las pruebas. Ver `docs/CHANGELOG-11.1.md`.
- **11.0**: copia de seguridad completa (con el constructor), imágenes en IndexedDB, historial persistente, tamaños de pantalla, exportación ZIP con React y modo oscuro, ediciones robustas, paleta → constructor, panel de capas accesible y pruebas automáticas. Ver `docs/CHANGELOG-11.0.md`.
- **10.9 + PWA**: modo oscuro (también en el constructor), editor en vivo, código para Tailwind/Compose/SwiftUI/Flutter, capturas propias y paleta, copia en archivo, búsqueda sin acentos, carga diferida, caché primero, WebP y foco accesible. En el constructor: textos junto a iconos editables y deshacer fiable en modo Texto. Ver `docs/CHANGELOG-10.9.md`.
- **10.9**: Auditoría y correcciones de integración. Ver `docs/CHANGELOG-10.9.md`.
- **10.8**: Deshacer y rehacer. Ver `docs/CHANGELOG-10.8.md`.
- **10.7**: Grupos y carpetas de capas. Ver `docs/CHANGELOG-10.7.md`.
- **10.6**: Panel visual de capas. Ver `docs/CHANGELOG-10.6.md`.
- **10.5**: Reemplazo de imágenes en el lienzo. Ver `docs/CHANGELOG-10.5.md`.
- **10.4**: Edición de texto directa. Ver `docs/CHANGELOG-10.4.md`.
- **10.3**: Edición táctil directa. Ver `docs/CHANGELOG-10.3.md`.
- **10.2**: Constructor optimizado para móvil. Ver `docs/CHANGELOG-10.2.md`.
- **10.1**: Colocación visual por arrastre. Ver `docs/CHANGELOG-10.1.md`.
- **10.0**: Selector visual de diseños. Ver `docs/CHANGELOG-10.0.md`.
- **9.1**: Component Studio integrado en el constructor principal: variantes, animaciones, elevación y presets en cada componente. Ver `docs/CHANGELOG-9.1.md`.
- **9.0**: Component Studio: variantes Glass, Soft UI, Outline y Bold; animaciones configurables; duración, elevación y presets rápidos. Ver `docs/CHANGELOG-9.0.md`.
- **8.0**: estudio visual con avatares, iconos, ilustraciones, fondos, recursos animados, seis paletas e importación de imágenes. Ver `docs/CHANGELOG-8.0.md`.
- **7.0**: favoritos, búsqueda y filtros, colecciones propias y componentes personalizados reutilizables. Ver `docs/CHANGELOG-7.0.md`.
- **6.0**: biblioteca de 15 componentes con búsqueda y categorías, cuatro plantillas completas y nuevos bloques de navegación, formularios y datos. Ver `docs/CHANGELOG-6.0.md`.
- **5.0**: edición del contenido de cada componente, navegación entre pantallas, guardado local y exportación HTML o React + CSS. Ver `docs/CHANGELOG-5.0.md`.
- **4.0**: constructor multipantalla. Ver `docs/CHANGELOG-4.0.md`.
