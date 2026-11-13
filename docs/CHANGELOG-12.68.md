# 12.68 · Modo motor (Tinta dentro de FORJA)

Decisión: FORJA es la app principal (chat, claves, Auto, consumo, GitHub, Netlify, revisión). Tinta aporta su biblioteca, las recetas y el equipo de agentes como **motor**. La biblioteca sigue viviendo aquí (una sola fuente) y FORJA usa una copia versionada.

- `crear.html?motor=1` cargada en un iframe del **mismo origen** atiende peticiones `postMessage` `{tipo:'tinta:pedir', id, accion, datos}` y responde `{tipo:'tinta:respuesta', id, ok, datos | error}`. Al arrancar avisa con `{tipo:'tinta:listo', api:1}`.
- Acciones: `ping` (versión, nº de bloques y plantillas) · `instrucciones` (sistema del chat y prompt para la idea) · `leer` (valida y repara la respuesta del modelo; si no sirve, da el mensaje de corrección) · `dibujar` (receta → HTML de la app completa con todas sus pantallas, lista de pantallas y borrador para reabrir en Tinta) · `equipo` (abre al equipo de 8 agentes sobre la receta y devuelve la versión elegida —equipo, mezcla o crítico— ya dibujada; cerrar con ✕ cancela).
- Seguridad: solo responde a su ventana madre y solo si es del mismo origen. No guarda nada: aplica en silencio, exporta y restaura el estado. En modo motor la página es transparente y solo se ve el equipo cuando trabaja.
- `tools/build-tinta.py` incrusta también `equipo.css`, así la copia autónoma sirve de motor.
- Pruebas: e2e `tinta-motor.cjs` (15 comprobaciones con una página madre simulada).
