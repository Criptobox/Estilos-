# Estilos

Biblioteca de referencia de componentes UI para consultar sin internet: **107 estilos** en 16 categorías (Chat, Tarjetas, Avatares, Plantillas, Barras, Botones, Paletas, Tipografía, Entradas, Encabezados, Listas, Hojas, Datos, Formularios, Avisos…) más **27 capturas de referencia**. Cada estilo se dibuja como componente real, trae su paleta, radio, consejo de uso y el **mismo HTML/CSS** que ves en la vista previa, listo para copiar.

> Versión actual: **1.6** (`versionCode 7`, paquete `com.estilos.app`, minSdk 26, targetSdk 34).

## Modo oscuro
- Tema **Automático / Claro / Oscuro**: botón en la cabecera de Inicio (alterna) y selector en Ajustes. Se guarda en `localStorage` (`estilos-theme`) y se aplica antes de pintar (sin destello).
- Toda la interfaz usa variables CSS (`:root` y `:root[data-theme="dark"]` en `css/styles.css`); las vistas previas mantienen su propio escenario claro/oscuro.
- Android 10+ (API 29): tema `DayNight` en `res/values-v29`, así el modo Automático y las barras del sistema siguen al teléfono. En Android 8–9 el modo Automático usa claro; elige Oscuro a mano.

## Novedades 1.6
- 32 estilos nuevos (listas, hojas, datos, formularios, avisos, reseña, entrada de evento, reproductor, perfil, chat IA…).
- Los 75 estilos originales se rehicieron: iconos SVG en vez de glifos, vista previa y código idénticos, escenario claro/oscuro/blanco.
- Nueva interfaz: búsqueda global, relacionados, exportar paleta (HEX/CSS/Tailwind/JSON), contraste WCAG.
- Correcciones: botón Atrás (historial + gancho `estilosBack`), diálogos propios en lugar de `confirm`, sin `onclick` inline, colores e ids saneados (no se ejecuta código inyectado), copiar con alternativa manual, catálogo base separado de los datos del usuario (migración desde 1.5 con copia de seguridad).

## Estructura

```
web/
  index.html
  css/styles.css
  js/util.js            helpers (esc, colores, contraste)
  js/icons.js           iconos SVG inline
  js/designs-core.js    motor: tokens(), D{}, designCode()
  js/designs-{a,b,c,d}.js  los diseños: D["familia.variante"] = (t,e) => [html, css]
  js/data.js            SEED (107) y REFS (27)
  js/app.js             vistas, almacenamiento, navegación
app/                    envoltorio Android (WebView)
docs/                   análisis y hoja de ruta
```

### Añadir un diseño
1. En `designs-*.js`: `D["card.mio"] = t => [\`<html>\`, \`css\`]` (usa `t.c0…c3`, `t.a`, `t.r`, `t.dark`).
2. En `data.js` añade una entrada con `v:"card.mio"`.

## Instalar como PWA (sin APK)
Sube el repo a GitHub → *Settings → Pages → Source: GitHub Actions*. El workflow `pages.yml` publica `web/` en `https://<usuario>.github.io/<repo>/`. Ábrelo en Chrome/Safari → *Instalar app / Añadir a pantalla de inicio*. Funciona sin conexión (service worker `web/sw.js`; cada despliegue sella la versión `1.6.<n.º de build>` automáticamente y los móviles se actualizan solos).

## Probar en el navegador
```bash
cd web && python3 -m http.server 8000
```

## Compilar el APK
JDK 17 + Android SDK 34:
```bash
gradle wrapper --gradle-version 8.9
./gradlew :app:assembleDebug
```
Firma release: variables `ESTILOS_KEYSTORE`, `ESTILOS_KEYSTORE_PASSWORD`, `ESTILOS_KEY_ALIAS`, `ESTILOS_KEY_PASSWORD`. **Nunca subas el keystore.**

## Verificado / no verificado
Verificado en Chromium: render de los 107 estilos, navegación, favoritos, Atrás, inyección bloqueada. **No compilado** el APK (sin Android SDK aquí): prueba en dispositivo el portapapeles y el botón Atrás.

Más: [docs/ROADMAP.md](docs/ROADMAP.md).
