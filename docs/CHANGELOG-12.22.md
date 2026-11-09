# 12.22 · Tarjetas propias de cada estilo de app

Antes casi todos los sectores compartían la misma tarjeta («Producto con aire»). Ahora cada estilo tiene la suya, con diseño y contenido propios:

| Estilo | Tarjeta | Qué trae |
|---|---|---|
| Tienda | **Producto con etiqueta** | etiqueta de oferta, precio, nota de envío y botón de compra |
| Viajes | **Destino con foto grande** | ubicación, valoración, noches y reserva |
| Música | **Pista de música** | carátula, título, artista, duración y botón de reproducir |
| Fitness | **Entrenamiento del día** | duración destacada, nivel, barra de progreso y empezar |
| Educación | **Curso con avance** | portada, lección actual, barra de avance y continuar |
| Salud | **Cita con especialista** | especialista, horarios disponibles y agendar |
| Comida | **Plato de la carta** | foto pequeña, nombre, descripción, precio y añadir |
| Finanzas | **Movimiento de cuenta** | icono, comercio, categoría e importe |

- Entran en la biblioteca (buscador, filtros, ficha, favoritos), admiten el editor de «Diseño de tarjeta» y las paletas, y cambian de ilustración por copia igual que «Producto con aire».
- Las **8 plantillas** usan ahora la tarjeta de su sector (cafetería mezcla productos y platos; finanzas, saldo y cuatro movimientos). **Explorar** y **Guardados** usan la tarjeta «de lista» (la última elegida).
- Arreglos de contenido: el saldo ya no sale como «$2,480.00.00» (precios con miles); «20 min» y similares varían por copia; con una paleta, el texto propio solo se aplica a tarjetas de color o de diseño oscuro (así las etiquetas oscuras y el saldo siguen legibles).
- Inventario de la biblioteca: 138 → **146 registros** (`design-library/catalog.json`, regenerado).
- Pruebas: `tests/tinta-tarjetas.cjs` (nueva) y contadores actualizados en las que cuentan diseños.
