# 12.6 · Instalar como app (PWA) y arreglo de la publicación

- **Botón «Instalar la app»** en el menú de Tinta: lanza el aviso nativo del navegador cuando está disponible y, si no, explica los pasos (Chrome/Edge o Safari en iOS). Desaparece cuando ya está instalada y no aparece en el APK de Android.
- Manifest: `id` estable, descripción, categorías y **capturas** (móvil y escritorio) para el diálogo de instalación enriquecido de Chrome/Android.
- iOS: `apple-touch-icon` y metadatos de app web.
- **Corrección de la publicación**: en 12.4 y 12.5 varias pruebas dependían de `/home/user/shots` y fallaban en CI, lo que bloqueaba el despliegue de la PWA. Ahora todo usa un directorio temporal.
- Pruebas: `tests/pwa.cjs` (16 comprobaciones: instalabilidad según Chromium, service worker, botón, aviso nativo, offline).
