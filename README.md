# Estilos 12.2.0

Biblioteca UI y constructor visual multipantalla, pensado para móvil y disponible como PWA y envoltorio Android.

## Nuevo aspecto (12.0)
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
- Web/PWA: `12.2.0` (GitHub Actions añade el número de compilación).
- Android: `versionCode 32`, `versionName 12.2`.
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
npm test
```
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
