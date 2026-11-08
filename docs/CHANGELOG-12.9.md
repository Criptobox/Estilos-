# 12.9 · Compartir una pantalla por enlace

- **«Copiar enlace ↗»** en «Tu pantalla»: crea un enlace con tus bloques, textos y estilos (comprimido dentro del `#`, no se envía a ningún servidor) y lo copia al portapapeles; si el navegador no lo permite, deja el enlace seleccionado.
- Quien abre el enlace lo recibe como una **copia en Mis proyectos** («Compartido · …»): nunca pisa su borrador. Se limpia el `#` de la dirección al importar.
- No incluye imágenes subidas (pesan demasiado); avisa si el enlace es largo (>6000 caracteres), porque algunas apps de mensajería lo recortan.
- Seguridad: enlaces corruptos o con bloques desconocidos se rechazan con un aviso; el texto recibido se muestra siempre como texto (sin HTML); tope de tamaño al descomprimir.
- Corrección en la documentación del proyecto: la revisión de contraste del Agente ya existía; no es una mejora pendiente.
- Pruebas: `tests/tinta-share.cjs` (19 comprobaciones).
