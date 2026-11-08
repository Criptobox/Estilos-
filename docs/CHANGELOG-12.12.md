# 12.12 · Las páginas web llegan con textos de su sector

- **«Ayúdame a empezar» deja la página lista**: las secciones web que propone el motor llevan titulares, beneficios, precio, opinión, cifras, llamada final y enlaces del pie propios del sector (cafetería, tienda, finanzas, fitness, viajes, salud, música y educación). Antes quedaban con textos neutros.
- Las cifras, precios, nombres y opiniones son **ejemplos para sustituir**, no datos reales.
- Al pulsar **↻ Otra propuesta**, los textos se cambian con los bloques; los bloques que ya habías editado a mano no se tocan.
- «Adaptar textos a la idea» sigue sin pisar esos textos.
- Nuevo módulo `web/js/tinta-slots.js`: traduce los huecos de un bloque a los textos de Tinta. Lo usan la app y el convertidor `spec-to-tinta`, así que ya no hay dos copias de esa lógica.
- La copia vive en `design-library/copy.json` y el validador comprueba que cada valor cabe en su hueco (máximo de caracteres, líneas y elementos).
- Pruebas: copia para los 8 sectores y las 10 secciones, textos visibles en la vista previa, cambio de propuesta sin textos huérfanos (227 comprobaciones del motor).
