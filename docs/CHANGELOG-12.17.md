# 12.17 · Una ilustración distinta en cada tarjeta

- Las tarjetas con imagen («Producto con aire») ya **no repiten la misma taza de café**: cada copia muestra un objeto distinto del sector de tu idea, dibujado con los **colores de tu paleta**.
- **23 ilustraciones planas** propias (SVG de 240×140, sin texto ni scripts): croissant, tarta, té, bolsa, camiseta, zapatilla, auriculares, tarjeta, monedas, cartera, mancuernas, botella, maleta, montaña, brújula, corazón con pulso, pastilla, planta, vinilo, nota musical, libro, birrete y lápiz. Cada sector usa 3 o 4, en orden (cafetería conserva la taza original en la primera).
- Una tarjeta suelta (sin copias) también usa el objeto de su sector: una tienda de ropa ya no enseña un café. Sin sector reconocido se conserva la imagen original, y una **foto tuya siempre manda** sobre la ilustración.
- Funciona igual en Inicio, Explorar y Guardados, en las plantillas y en la exportación HTML.
- Las plantillas de tienda, fitness, viajes, salud, música y educación pasan a la tarjeta de producto para aprovecharlo (finanzas conserva su tarjeta de saldo).
- Pruebas: `tests/tinta-ilustraciones.cjs` (17 comprobaciones, incluida la de que ningún color inválido se inyecta en el SVG).
