# 12.59 · Paleta a partir de una foto o un logo

- Botón «Crear una paleta desde una foto o un logo» en Paletas de color. Acepta PNG, JPG o WebP de hasta 10 MB.
- La imagen se reduce a 96 px en el dispositivo y se agrupan sus colores (`web/js/tinta-colores.js`). El acento es el color más vivo y frecuente, así un logo sobre fondo blanco da su color de marca. El segundo acento sale de otro tono de la imagen.
- Modo Automático, Clara u Oscura. Fondo, tarjetas, texto y línea se derivan del tono del acento y se ajustan para mantener el contraste (texto ≥ 7:1, acento ≥ 3:1 sobre el fondo).
- Se previsualiza antes de guardar. Solo se guardan los colores, nunca la imagen.
- Las paletas propias (máx. 12) viven en el dispositivo (`estilos-tinta-paletas-v1`), aparecen con la subcategoría «Mis paletas» y se pueden eliminar.
- Limitación: los enlaces para compartir no llevan paletas propias; quien los abre ve la pantalla sin paleta.
- Pruebas: 4 unitarias (`colores.test.cjs`) y e2e `tinta-paleta-imagen.cjs`.
