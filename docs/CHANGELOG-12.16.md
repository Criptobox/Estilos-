# 12.16 · Todas las pantallas de la app

- **«Crear todas las pantallas de la app»** (en «Tu pantalla», y activado al usar una plantilla): además de **Inicio**, Tinta genera las pantallas que enlaza la barra inferior —**Explorar, Guardados y Perfil**— con tus mismos bloques, tu paleta, tus animaciones y contenido de tu idea.
  - **Explorar**: tu cabecera (con buscador) y cuatro tarjetas con contenido distinto al de Inicio.
  - **Guardados**: cabecera sencilla y dos tarjetas.
  - **Perfil**: cabecera sencilla, avatar, lista de ajustes con filas del sector (Mis pedidos, Mis rutinas…) y botón «Editar mi perfil».
- **Vista previa navegable**: pestañas «Inicio · Explorar · Guardados · Perfil» sobre el teléfono, y la propia barra inferior del teléfono cambia de pantalla y marca la pestaña activa.
- **Exportación multi-pantalla**: un único HTML con las pantallas y un pequeño script que hace funcionar la barra (sin librerías). Con una sola pantalla la exportación no cambia.
- Se adapta a la barra elegida: de 4 botones con texto, de 5 con botón central de acción (que no navega) o solo con iconos (por posición).
- Sin sector reconocido o sin barra inferior no se activa y lo explica.
- Conserva el historial (Ctrl+Z), «Mis proyectos» y los enlaces compartidos.
- Arreglos de contenido (de la página de prueba de cafetería):
  - Las plantillas adaptan también el texto de la **cabecera y del botón** (antes quedaban «Algo bueno empieza aquí» y «Crear algo increíble»).
  - Más textos por sector y textos cortos propios, para que las tarjetas no repitan frases.
  - Un solo titular en las cabeceras (antes dos líneas sin relación).
  - Se oculta el «Seleccionar producto» de demostración en pantallas compuestas.
- Pruebas: `tests/tinta-pantallas.cjs` (38 comprobaciones).

Limitación conocida: las copias de una tarjeta con imagen comparten la misma foto.
