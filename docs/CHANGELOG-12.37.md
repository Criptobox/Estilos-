# 12.37 · Plantillas inspiradas en apps reales y selector de barra

## 6 plantillas nuevas (15 en total) con 19 bloques nuevos
Hechas a partir de las capturas de referencia (tienda clara y oscura, envíos, salud, asistente de IA y panel de agentes). Cada una usa estructura distinta, no solo otros colores:

| Plantilla | Qué trae |
|---|---|
| **Tienda · compra completa** | buscador, banner de oferta, categorías en círculos, listado de productos y barra de pastilla negra |
| **Tienda oscura · destacados** | banner, cuadrícula de productos, resumen de la compra y barra de cristal |
| **Envíos · pedidos** | cuadrícula de servicios, pedidos con estado, mapa con ruta y repartidor, métodos de pago y barra con pastilla activa |
| **Salud · doctores** | cabecera con degradado, especialistas con valoración, elegir fecha y hora |
| **Asistente de IA** | orbe luminoso, campo de mensaje con atajos, cursos y barra mínima de tres destinos |
| **Panel de agentes** | tres cifras clave, gráfico de línea, agentes con progreso |

**Bloques nuevos**
- 4 barras inferiores: pastilla negra con círculo activo, cristal flotante con etiquetas, oscura con pastilla activa y mínima de tres destinos (subcategoría «De apps reales»).
- 1 cabecera: saludo sobre degradado.
- 10 tarjetas: banner de oferta, categorías en círculos, cuadrícula de servicios, producto en fila, dos productos en cuadrícula, pedido con estado, métodos de pago, especialista, agente con progreso y asistente con orbe.
- 2 tarjetas de datos de ejemplo (mapa con ruta y resumen de costes), 1 de cifras (tres cifras clave) y 1 widget (fecha y hora).

Las copias repetidas (pedidos, especialistas, agentes, productos) traen contenido distinto cada una y su ilustración cambia por copia y por sector. «Adaptar textos» no pisa estos datos de ejemplo. Todo respeta paletas, estilos visuales, modo oscuro y el guardián de contraste.

## Selector de barra inferior
En «Tu pantalla», bajo «Probar / Editar bloques», hay un selector **Barra inferior** con las 20 barras de la biblioteca (o «Sin barra»). Elegir una la aplica a todas las pantallas de la app y deja solo esa en la selección; se puede deshacer.

## Pruebas
Nueva `tests/tinta-referencias.cjs` (plantillas, contenido distinto por copia, contraste, selector de barra). Las pruebas de conteo pasan a 200 diseños y 15 plantillas; la galería móvil de algunas se prepara con «Ver todos».
