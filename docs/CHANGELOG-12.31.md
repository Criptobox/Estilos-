# 12.31 · Editar bloques desde la vista previa

En «Tu pantalla», encima del móvil hay dos modos:

- **▶ Probar** (por defecto): la vista previa funciona como la app (tocar una tarjeta abre el detalle, la barra navega…).
- **✎ Editar bloques**: tocar un bloque lo selecciona (borde de color) y aparece una **barra flotante** con su nombre y:
  - **Texto**: abre el editor de textos de ese bloque.
  - **Diseño** (tarjetas) y **Botón** (si el bloque tiene botón): abren el editor de diseño y de color/estilo.
  - **Animar ✦**: despliega las 21 animaciones agrupadas (Entrada, Tarjetas, Botón principal); pulsar una la aplica a toda la pantalla y a la exportación, y pulsarla otra vez la quita. La selección se conserva.
  - **↑ ↓**: mueven el bloque dentro de su grupo.
  - **✕**: deja de editar ese bloque.
- Los bloques que la app crea sola (pantallas de recorrido) solo se pueden animar.
- Funciona en móvil (la barra queda sobre la barra inferior) y en escritorio, en claro y oscuro. Las acciones se pueden deshacer con Deshacer/Ctrl+Z como el resto.
- Nueva prueba `tests/tinta-edicion.cjs` (34 comprobaciones, móvil y escritorio, con axe-core).
