# 12.53 · Higiene del repositorio y Android

Basado en una revisión externa del proyecto, contrastada con el código.

**Android (app WebView)**
- **Exportar funciona dentro de la app.** El WebView no descarga archivos creados en el navegador (blobs), así que exportar HTML, JSON o PNG no entregaba nada. Ahora la app expone un puente (`EstilosAndroid.saveFile`) y, al exportar, el sistema abre el selector «Guardar como» para elegir carpeta y nombre. En el navegador normal nada cambia. Lo usan Tinta, el editor clásico y la copia de seguridad de proyectos.
- **Subir archivos funciona dentro de la app.** Sin un `WebChromeClient`, los campos de archivo (fotos, importar proyectos) no abrían nada; ahora abren el selector del sistema.
- **WebView más estricto.** `allowFileAccess`, `allowContentAccess` y el acceso entre archivos quedan desactivados; los assets de la app siguen cargando.
- No se migró a `WebViewAssetLoader` (origen https): cambiaría el origen del almacenamiento y los proyectos guardados de quien ya tenga la app dejarían de verse. Queda pendiente junto con una migración por exportar/importar.
- **Sin probar en un dispositivo**: se comprueba que compila en CI y el lado web tiene prueba (`tests/tinta-nativo.cjs`), pero el guardado con el selector del sistema hay que verificarlo en un móvil real.

**Higiene**
- Se eliminan `tests/undefined/` (10 capturas, 2,6 MB; salían de scripts de revisión locales y se colaron en los commits 12.38–12.41) y se amplía `.gitignore`.
- Fuera las rutas del equipo del desarrollador: las pruebas usan la carpeta temporal del sistema y `tools/build-tinta.py` escribe en `dist/`.
- **Una sola fuente para la versión web**: `version.json` trae ahora `web` (14.1); `pages.yml` sella el despliegue con ese valor y `tests/versions.cjs` comprueba que `util.js` y el README coinciden.

**Pendiente de la revisión** (no incluido aquí): LICENSE (la elige el propietario), subir `targetSdk`, compilación con esbuild, CSP, pruebas unitarias y unificación de formatos de proyecto.
