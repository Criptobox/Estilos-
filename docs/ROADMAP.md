# Hoja de ruta

Hallazgos de la revisión del código y propuestas para llevar Estilos al siguiente nivel. Cada punto indica cuánta evidencia hay:

- ✅ **Comprobado**: reproducido o leído directamente en el código.
- ⚠️ **Por confirmar en un dispositivo**: se deduce del comportamiento documentado de Android; hay que probarlo en un móvil.

## 1. Errores y riesgos (arreglar primero)

| # | Hallazgo | Evidencia | Arreglo propuesto |
|---|---|---|---|
| 1 | **El botón Atrás del sistema cierra la app** desde cualquier pantalla. La navegación es interna (`view`) y nunca usa la API de historial, así que `canGoBack()` siempre es falso. | ✅ 0 usos de `pushState`/`popstate` | `history.pushState` en `goNav/openDetail/goTab` + `popstate`; en Android, `OnBackPressedCallback` (el `onBackPressed` actual está obsoleto en target 34). |
| 2 | **Eliminar un estilo y "Restaurar base original" probablemente no hacen nada en el APK.** Usan `confirm()`, y el WebView solo muestra diálogos JS si tiene un `WebChromeClient`; sin él, `confirm()` devuelve `false`. | ⚠️ `confirm()` en 2 sitios; solo hay `WebViewClient` | Reemplazar `confirm()` por una hoja de confirmación propia (ya existe `openSheet`). Funciona igual en web y Android. |
| 3 | **Inyección de código por JSON importado o por el formulario.** Los colores y los `id` se insertan sin escapar dentro de atributos `onclick="copyColor('…')"` y `style="…"`. | ✅ Reproducido: un color o `id` con `');…//` ejecuta JS (importación y formulario) | Validar colores (`/^#[0-9a-f]{3,8}$/i`), no construir handlers con strings: delegación de eventos con `data-id`. Validar el esquema completo al importar. |
| 4 | **Copiar al portapapeles puede fallar en silencio.** `copyText` solo usa `navigator.clipboard`; si no está disponible muestra el texto en el aviso en vez de copiarlo. | ✅ código · ⚠️ comportamiento real en el móvil | Fallback con `execCommand('copy')` (ya existe en `copyIO`) o un puente nativo a `ClipboardManager`. |
| 5 | **Las migraciones pisan ediciones del usuario.** `load()` reemplaza 21 ids fijos (`tar-7`, `bar-1`…) por la versión del SEED una sola vez (flag `estilos-fix-v15`). | ✅ código | Separar datos: SEED inmutable + capa del usuario (overrides, añadidos, borrados). Se acaban las migraciones por lista de ids. |
| 6 | **Etiqueta de versión desfasada**: el menú dice `v1.3` y la app es 1.5. | ✅ | Una sola fuente de versión (`build.gradle.kts` → inyectada en la web). |
| 7 | `save()` no está protegida (cuota de `localStorage`) y *Importar* reemplaza toda la base sin copia de seguridad. | ✅ código | `try/catch` con aviso; guardar copia previa; importar con "fusionar o reemplazar". |
| 8 | **WebView más amplio de lo necesario**: `allowFileAccess = true` y carga por `file://`. | ✅ código | `WebViewAssetLoader` (`https://appassets.androidplatform.net/`), `allowFileAccess = false`, y `shouldOverrideUrlLoading` para bloquear navegación externa. |

## 2. Base de trabajo (para iterar rápido)

1. **Compilar de verdad**: abrir el proyecto en Android Studio / CI, añadir el Gradle wrapper (`gradle wrapper`) y confirmar que el APK sale igual que el original.
2. **Conservar el keystore original** (ver `ANALYSIS.md`). Guardarlo como secreto del CI, nunca en el repo.
3. **Datos fuera del código**: pasar `SEED`/`REFS` a `web/data/styles.json` y `refs.json`. Así se editan sin tocar JS y se pueden validar con un esquema en CI.
4. **Pruebas**: Vitest para `lum`, `inkOn`, `bestAccent`, `codeFor`, import/export; un test de humo en jsdom (el mismo que usé para verificar la separación).
5. **Vista previa gratis**: publicar `web/` en GitHub Pages en cada push. Podrás ver y probar cambios desde el móvil sin compilar el APK.
6. **Release automático**: el workflow ya compila el APK debug; añadir release firmado al crear un tag.

## 3. Mejoras de producto (siguiente nivel)

Ordenadas por impacto / esfuerzo:

1. **Código para más stacks.** Hoy `codeFor` solo genera HTML/CSS. Añadir Tailwind, Jetpack Compose, Flutter y SwiftUI con un selector en el detalle. Es lo que más valor práctico da a una biblioteca de componentes.
2. **Editor en vivo.** En el detalle, sliders de radio y selectores de color que actualizan la vista previa y el código; "guardar como variante".
3. **Accesibilidad de color.** Badge de contraste AA/AAA por paleta (ya existe `lum()`) y vista de daltonismo.
4. **Exportar paleta/tokens**: variables CSS, `tailwind.config`, tokens de Figma (JSON).
5. **Tus propias referencias.** Hoy las 27 capturas son fijas. Permitir añadir capturas propias (IndexedDB), con etiquetas, y **extraer la paleta de una imagen** con canvas.
6. **Colecciones / moodboards** y búsqueda global (no solo dentro de la pestaña), con etiquetas y filtros combinados.
7. **Compartir y respaldar**: hoja de compartir de Android y guardar el JSON como archivo (hoy solo hay un cuadro de texto). Sincronización opcional vía Gist o archivo.
8. ~~**Modo oscuro** de la propia app~~ (hecho), **i18n** (es/en) y mejoras de accesibilidad (`aria-label` en chips y botones de icono, foco visible, `prefers-reduced-motion`).
9. **Rendimiento**: imágenes de referencia a WebP con `loading="lazy"` (2,8 MB de JPG hoy) y renderizado por lotes si la base crece.

## 4. Orden sugerido

1. Compilar y confirmar firma/keystore (sección 2.1–2.2).
2. Arreglos 1–3 de la sección 1 (Atrás, confirmaciones, inyección): son los que se notan.
3. Datos a JSON + pruebas + GitHub Pages (2.3–2.5).
4. Resto de la sección 1 (separar SEED/usuario, hardening del WebView).
5. Producto: código multi-stack → editor en vivo → contraste/exportación.

## Estado en 1.6
Hecho: historial/Atrás, diálogos propios, delegación de eventos, saneado de entradas, copia con alternativa, versión única, SEED separado del usuario, 107 estilos y rediseño de UI.
Pendiente: compilar y probar en dispositivo, PWA/offline, tests automáticos en CI, edición visual de colores en el detalle.


## Estado 2.1
Hecho:
- Constructor de hasta doce capas.
- Reordenación por botones y arrastrar/soltar.
- Duplicación y eliminación individual de capas.
- Exportación HTML con marcos de vista previa responsivos.
- Versión de aplicación y caché PWA en 2.1.0.

Pendiente:
- Edición individual de propiedades por componente.
- Exportación React/Tailwind/Jetpack Compose/Flutter.
- Pruebas de compilación y uso real en Android.


## Estado 3.0
Hecho:
- Selección de componente desde la lista y desde la previsualización.
- Edición individual de etiqueta, fondo, color de texto, redondeo y espaciado.
- Duplicación, borrado y reordenación conservan la configuración de cada capa.
- Exportación HTML aplica los estilos individuales de cada bloque.

Siguiente:
- Edición de tipografía, tamaños, bordes, sombras y alineación por capa.
- Plantillas multipantalla y navegación entre pantallas.
- Exportadores específicos de React y Tailwind.
- Pruebas de interacción y compilación APK en CI.


## Estado 4.0
Hecho:
- Constructor de hasta ocho pantallas.
- Crear, duplicar, cambiar y eliminar pantallas.
- Guardado de componentes y ajustes de cada pantalla por separado.
- Editor avanzado: tipografía, peso, alineación, borde, sombra, ancho y desplazamiento.
- Arrastre táctil/ratón del asa del componente para ajustar su posición.
- Temas predefinidos y guardado de temas propios.
- Exportación HTML con navegación multipantalla funcional.

Siguiente:
- Árbol de navegación y enlaces entre pantallas.
- Editor de texto/contenido interno de cada componente.
- Exportación React/Tailwind como proyecto fuente real.
- Pruebas end-to-end en navegador y compilación APK.

## Estado tras las mejoras de PWA
Hecho: modo oscuro, editor en vivo, tokens multiplataforma, capturas propias + paleta, copia en archivo/compartir, búsqueda sin acentos, carga diferida, SW caché primero, WebP, foco accesible, menú «⋯».
Aparcado mientras la app sea solo PWA: endurecer el WebView (`WebViewAssetLoader`), `OnBackPressedCallback` y compilar el APK en CI.
