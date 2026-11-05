# Análisis del APK Estilos v1.5

Resultado de abrir `Estilos_v1.5.apk` (3,1 MB).

## Qué es

Una app **híbrida mínima**: una sola `Activity` en Kotlin que muestra un `WebView` a pantalla completa y carga `file:///android_asset/index.html`. Toda la aplicación (interfaz, datos y lógica) es web.

| Dato | Valor |
|---|---|
| Paquete | `com.estilos.app` |
| Versión | 1.5 (código 6) |
| SDK | min 26 · target/compile 34 |
| Permisos | ninguno (funciona sin internet) |
| Clases propias | 1 (`MainActivity`); el resto del dex es la stdlib de Kotlin |
| Firma | v1+v2+v3, certificado `CN=Estilos` |
| `allowBackup` | `false` |

## Contenido de `assets/`

- `index.html` (88 KB): CSS inline + un único `<script>` de ~330 líneas.
- `fonts/plus-jakarta-sans.woff2`: tipografía de la interfaz.
- `ref/ref01..27.jpg` (2,8 MB): capturas de referencia.

## Cómo funciona la lógica

- **Datos**: `SEED` (75 estilos con `id, tab, name, ref, desc, colors, radius, tip, mode` y a veces `code`) y `REFS`.
- **Persistencia**: `localStorage` → `estilos-db-v1` (toda la base) y `estilos-favs-v1` (favoritos). Al abrir, `load()` mezcla lo guardado con el SEED y aplica migraciones.
- **Vistas**: `home`, `explore`, `detail`, favoritos, con un `render()` que reescribe `innerHTML`.
- **Previsualización**: `preview(e)` dibuja cada estilo en HTML/CSS según su categoría; `codeFor(e)` genera el código para copiar.
- **Edición**: formulario para añadir/editar, importar/exportar JSON, restaurar base original.

## Qué es exacto y qué es reconstrucción

- **Exacto**: todo lo de `web/` (HTML, fuente, imágenes y lógica, tal cual venían). La reconstrucción de `MainActivity.kt` sigue el bytecode instrucción por instrucción.
- **Reconstruido**: el tema (`Theme.Estilos`). El APK lo define con 4 ítems, todos `#0F1115`/`false`; el padre y los nombres exactos de los ítems son una estimación razonable.
- **No verificado**: no había Android SDK en el entorno de análisis, así que **el proyecto Gradle no se ha compilado todavía**. Las versiones de AGP/Kotlin/Gradle son razonables pero sin probar.
- **Verificado**: la separación de `index.html` en `css/` + `js/` produce el mismo DOM en seis pantallas, con los mismos 75 estilos y sin errores de script (probado en jsdom).

## Aviso sobre la firma

El APK está firmado con un certificado propio (`CN=Estilos`). **Conserva ese keystore.** Si compilas una versión nueva con otra clave, Android no la instalará encima de la v1.5 (tendrías que desinstalar y se perderían los datos locales). Antes de cambiar de clave, usa *Exportar JSON* en la app.
