# 12.4 · Textos adaptados a tu idea

- **«Adaptar textos a mi idea ✦»** (pantalla de revisión): detecta el sector del brief (comida y café, tienda, finanzas, fitness, viajes, salud, música, educación) y rellena títulos, notas, cifras, acciones y placeholders de los bloques con textos coherentes. Una cafetería deja de mostrar «Ingresos $24.380».
- Respeta lo que editaste a mano, no toca las barras de navegación, conserva insignias e iconos y se puede **deshacer** (Ctrl+Z o historial). «Restaurar» de cada bloque recupera el texto original.
- Motor de reglas local (`web/js/tinta-sectors.js`), sin red ni IA, con pruebas propias.
- Android: el botón Atrás vuelve atrás dentro de Tinta (cierra diálogos y menú primero), los enlaces http(s) se abren en el navegador y la versión sale de `version.json`.
- Pruebas: `npm test` ejecuta todas (22 archivos) con servidor propio; nuevas pruebas de versión/precache, botón Atrás y adaptación de textos.
