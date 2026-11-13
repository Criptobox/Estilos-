# 12.67 · Chat de diseño con tu IA

Idea de la persona usuaria: claves en un apartado de ajustes, un chat donde se elige el modelo y se habla, y al pedir algo, la pantalla de los agentes creándolo.

- Botón «Chatear con la IA ✦» en Tu idea. Chat a pantalla completa con selector de los modelos que respondieron en la prueba (de todos los proveedores conectados) y acceso directo a «⚙ Claves» (el diálogo de conectar IA). Al volver de Claves, el selector se actualiza.
- Saluda y propone tres ideas para empezar. Los mensajes se guardan en el dispositivo (`estilos-tinta-chat-v1`, máx. 60, sin claves) y se recortan al mandarlos al modelo (presupuesto de ~12 000 caracteres, turnos alternados) para gastar poco en los modelos gratuitos.
- El modelo recibe unas instrucciones fijas (asistente de diseño, catálogo ordenado por relevancia con lo último que pidió la persona, formato de receta, reglas) y, si ya hay una pantalla, un resumen de la pantalla actual para poder cambiarla («hazla oscura», «añade un carrito»).
- Si la respuesta contiene una receta válida, el chat enseña el texto sin el JSON, una tarjeta «Pantalla propuesta» y abre solo la pantalla del equipo trabajando sobre esa propuesta. Al terminar eliges Equipo / Mezclar / Crítico y se aplica (se puede deshacer). Si cierras al equipo con ✕, vuelves al chat.
- Las conversaciones sin receta («¿qué colores me recomiendas?») no abren nada. Los errores (cuota, clave, red) se explican en la conversación con un botón «Reintentar».
- `tinta-receta.js` gana `chatSystem(idea, actual)`; `tinta-chat.js` guarda el historial y prepara los mensajes (puro, sin DOM).
- Pruebas: 5 unitarias (`chat.test.cjs`) y e2e `tinta-chat.cjs` (17 comprobaciones con un proveedor simulado; estable en 6 ejecuciones).
