# 12.51 · Estilos de fondo y la idea arma pantallas completas

**Estilos de fondo.** Una capa nueva que cambia solo el fondo de la pantalla, sin tocar los bloques. Está en **Los bloques › Estilos de fondo** (categoría nueva, 20 fondos en 4 grupos):

| Grupo | Fondos |
|---|---|
| **Degradados suaves** (6) | Aurora, Atardecer, Océano claro, Menta fresca, Lavanda, Durazno cálido |
| **Cristal y burbujas** (4) | Cristal rosa y cian, Cristal azul, Burbujas, Niebla |
| **Patrones y texturas** (5) | Puntos, Cuadrícula, Diagonales, Papel crema, Rayas suaves |
| **Oscuros con brillo** (5) | Noche violeta, Neón oscuro, Carbón, Aurora oscura, Brasa |

- Se aplica de un toque («Usar de fondo»), se quita igual, se guarda en el borrador, se comparte por enlace y llega a la exportación.
- Cada fondo tiene una vista previa hecha con bloques reales.
- Los fondos oscuros activan la capa oscura de la pantalla (con la paleta oscura elegida o «Carbón») para que los textos se lean; un fondo claro anula una paleta oscura. Un estilo visual de pantalla completa (cristal, 3D…) sigue mandando sobre el fondo.
- Solo gradientes y colores: sin imágenes ni recursos externos.

**La flecha de enviar arma pantallas completas.** Al enviar una idea con un tema que tiene plantillas (tienda, comida, salud, finanzas, educación…), la app arma una pantalla entera con la plantilla que más se parece a tu idea y te lleva a «Tu pantalla». Si envías la idea otra vez sin tocar nada, propone otra distinta, recorriendo todas las del tema. Si ya elegiste bloques, o el tema no tiene plantillas, se mantiene la receta de cuatro bloques.

- Se adaptaron las pruebas que esperaban el comportamiento anterior (Atrás de Android, adaptación de textos, enlace compartido y copias de tarjeta).
- `tests/tinta-propuesta.cjs` cubre la propuesta y `tests/tinta-fondos.cjs` los fondos.
