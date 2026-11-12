# 12.52 · Modo de pantalla, barras editables y sin huecos

**Modo claro u oscuro de la pantalla.** En «Tu pantalla», sobre «Barra inferior», hay un selector **Auto · Claro · Oscuro**:

- **Oscuro** pasa la pantalla a noche con un gris neutro y **conserva los colores** de tu paleta (botones, acentos). Si la paleta ya es oscura, la usa tal cual.
- **Claro** vuelve a los colores claros, incluso con una paleta oscura.
- **Auto** sigue a la paleta o al fondo, como antes. El modo elegido manda sobre un fondo de la capa de fondos que no case (un fondo claro con modo oscuro se ignora). Se guarda en el borrador y se comparte por enlace.

**Herramientas al editar un bloque.** Antes, al tocar la barra inferior solo se podía animar. Ahora la barra de herramientas del bloque ofrece:

- **Cambiar ⇄** (barras y cabeceras): una lista con todas las alternativas; al elegir una, sustituye a la actual.
- **Colores** (barras): fondo, iconos y color del activo, y forma (original, cuadrada, redondeada o píldora), con «Restablecer». Se aplica a cualquier barra y se exporta.
- **Foto** (bloques con imagen o avatar): abre el editor de foto y enlace.
- **Botón** ahora también está en tarjetas y cabeceras (antes solo en bloques de acción): eliges qué botón y cambias su color y estilo. La paleta sigue sin recolorear botones de tarjetas por su cuenta.

**Sin hueco a los lados.** Estilos visuales y Animaciones tenían las tarjetas de ancho fijo y dejaban la mitad derecha vacía, como ya se había arreglado en Plantillas, Paletas y Fondos. Ahora llenan el ancho (dos columnas en el móvil).

- `tests/tinta-pantalla.cjs` cubre el modo, las herramientas de barra y los huecos.
