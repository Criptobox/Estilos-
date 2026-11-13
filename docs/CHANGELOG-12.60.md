# 12.60 · Crear con un chat de IA (modo copiar y pegar)

- Botón «Crear con un chat de IA» en Tu idea: escribes la idea, copias el prompt, lo pegas en cualquier chat (ChatGPT, Gemini, Claude, GLM…) y pegas su respuesta.
- El modelo no escribe HTML ni CSS: elige bloques, paleta, tipografía y fondo del catálogo y redacta algunos textos. El diseño y el contraste los pone Tinta. El prompt es corto (< 9 000 caracteres) y ordena el catálogo por relevancia para la idea.
- `web/js/tinta-receta.js` (puro, sin DOM ni red): extrae el JSON aunque venga con texto, ```json, comas sobrantes o comillas tipográficas; valida y repara (ids inventados, cabecera o barra que faltan, orden, copias fuera de rango, valores que no existen) y avisa de cada ajuste.
- Si la respuesta no sirve, la app da el motivo y copia un mensaje de corrección para pegar en el mismo chat.
- La receta se aplica como una plantilla (`applyTemplate`): se puede deshacer con Ctrl+Z y respeta la idea escrita.
- Pruebas: 9 unitarias (`receta.test.cjs`) y e2e `tinta-receta.cjs`.
- Siguiente: chat dentro de la app con clave propia y lanzadores a chats web.
