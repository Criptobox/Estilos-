# Estilos 3.0.0

Biblioteca visual de componentes UI y constructor de pantallas, optimizada para móvil y disponible como PWA o aplicación Android.

## Contenido actual
- **107 diseños base** distribuidos en **15 categorías con diseños**.
- **27 capturas de referencia**.
- Previsualizaciones reales de componentes, paletas, radios y consejos de uso.
- Búsqueda, favoritos, relacionados, contraste WCAG y exportación de paletas.
- Catálogo base separado de las creaciones y ediciones del usuario.

## Novedades de Estilos 3.0
- Constructor visual con previsualización móvil en vivo.
- Hasta doce capas por pantalla.
- Selección de capas desde el listado o directamente desde la vista previa.
- Edición individual del nombre visible, color de fondo, color de texto, redondeo y espaciado de cada capa.
- Duplicar, eliminar y reordenar capas sin perder sus ajustes.
- Ajustes globales de título, descripción, color principal, fondo, tipografía y redondeo.
- Exportación de la composición a HTML.
- Migración compatible de proyectos guardados con las versiones 2.0 y 2.1.

## Versiones
- Web/PWA: `3.0.0` (el workflow de Pages sella el número de compilación).
- Android: `versionCode 10`, `versionName 3.0`.
- Paquete: `com.estilos.app`.
- `minSdk 26`, `targetSdk 34`.

## Estructura

```text
web/
  index.html
  css/styles.css
  js/util.js
  js/icons.js
  js/designs-core.js
  js/designs-{a,b,c,d}.js
  js/data.js
  js/designs-extra.js
  js/app.js
  preview-constructor.html
app/                    envoltorio Android (WebView)
docs/                   análisis, changelog y hoja de ruta
.github/workflows/      publicación PWA y compilación APK
```

## Ejecutar en navegador

```bash
cd web
python3 -m http.server 8000
```

Abrir `http://localhost:8000`.

## Publicar PWA
Subir el repositorio a GitHub y activar GitHub Pages con el workflow de GitHub Actions incluido. El service worker almacena la aplicación para uso sin conexión y cambia su versión en cada despliegue.

## Compilar APK

Requisitos: JDK 17, Android SDK 34 y Gradle 8.9.

```bash
gradle :app:assembleDebug
```

El workflow `android.yml` compila automáticamente una APK debug en GitHub Actions.

Para firmar una versión release se usan las variables `ESTILOS_KEYSTORE`, `ESTILOS_KEYSTORE_PASSWORD`, `ESTILOS_KEY_ALIAS` y `ESTILOS_KEY_PASSWORD`. No subir el keystore al repositorio.

## Estado de verificación
- Sintaxis de `app.js`, `util.js` y `sw.js`: comprobada con Node.js.
- Sintaxis del JavaScript del preview independiente: comprobada.
- Integridad del ZIP de entrega: comprobada.
- Compilación y prueba del APK en dispositivo: pendiente; este entorno no dispone de Gradle/Android SDK.
