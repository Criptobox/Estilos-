# 12.58 · Tipografías para toda la pantalla

Hasta ahora podías cambiar paleta, fondo, estilo visual y modo de la pantalla, pero la letra la decidía cada bloque. Ahora hay una **capa de tipografía** que cambia la letra de toda la pantalla de un toque, como las paletas y los fondos.

**Dónde**
- **«Tu pantalla» › Letra**: un selector junto al modo y la barra inferior, con «Original de cada bloque» y las 12 letras.
- **Los bloques › Tipografías** (categoría nueva): 12 tarjetas con una vista previa hecha con bloques reales, en 3 grupos.

| Grupo | Letras |
|---|---|
| **Modernas** (5) | Sistema, Jakarta, Geométrica, Humanista, Redondeada |
| **Clásicas con serifa** (3) | Editorial, Clásica, Elegante |
| **De carácter** (4) | Técnica, Máquina de escribir, Condensada, Manuscrita |

**Cómo funciona**
- Cambia la familia de la raíz de cada bloque y hace que todo la herede (títulos, textos y botones), y ajusta el peso y el espaciado de los títulos para cada letra. No toca los bloques guardados.
- Se quita de un toque (pulsar otra vez, o «Original»), se guarda en el borrador, se comparte por enlace y **llega a la exportación**.
- Manda sobre la letra propia de un estilo visual (por ejemplo, Brutalismo usa monoespaciada) cuando eliges una.

**Límite honesto**: la app no carga fuentes de internet (funciona sin conexión), así que cada letra es una familia que ya trae el dispositivo, con alternativas para Android, iOS, Windows y Mac. «Jakarta» va incluida en la app y se ve igual en todas partes; las demás pueden variar algo entre dispositivos y, si el dispositivo no tiene ninguna de las listadas, cae a una sans o serif genérica (en el navegador de pruebas, «Redondeada» cae a una sans gruesa).

- `tests/tinta-tipografia.cjs` (13 comprobaciones) y una comprobación nueva en `tests/unit/capas.test.cjs`.
