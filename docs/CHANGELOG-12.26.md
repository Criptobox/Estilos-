# 12.26 · Apps completas: pantallas de recorrido

Además de Inicio, Explorar, Guardados y Perfil, «Crear todas las pantallas» genera ahora **7 pantallas de recorrido**, con el contenido de tu sector y enlazadas entre sí:

| Pantalla | Qué trae | Se llega desde |
|---|---|---|
| Bienvenida | ilustración del sector, título, puntos de avance, Empezar | es la primera de la app exportada; «Cerrar sesión» |
| Acceso | correo, contraseña, Entrar, Google/Apple, registro | Bienvenida |
| Detalle | imagen, etiqueta, descripción, cantidad y precio | tocar cualquier tarjeta |
| Carrito | 3 productos del sector, subtotal, envío, total | Detalle (solo en comida, tienda y viajes) |
| ¡Listo! | check animado y mensaje del sector («¡Cita agendada!», «¡Reserva confirmada!»…) | Carrito o Detalle |
| Ajustes | cuenta, interruptores que funcionan, idioma, cerrar sesión | Perfil |
| Chat | la mascota robot responde con una conversación del sector y sugerencias | Ajustes → «Hablar con el asistente» |

- Las pantallas de recorrido ocultan la barra inferior y tienen botón **Volver** (recuerda de dónde vienes).
- Se eligen una a una en «Pantallas de recorrido». Si quitas una, los botones que llevaban a ella van al siguiente destino con sentido (sin carrito, «Añadir» va directo a la confirmación).
- Funcionan igual en la vista del móvil y en el **HTML exportado**, que ahora abre en la Bienvenida.
- Las 7 son bloques de la biblioteca (164 en total) y respetan paletas claras y oscuras y el guardián de contraste.
- Nueva prueba `tests/tinta-recorridos.cjs`; `tinta-oscuras.cjs` ahora revisa también estas pantallas.
