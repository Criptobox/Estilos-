# 12.43 · Paneles de ventas y control

Tercera familia del zip «estilos completos». 10 bloques nuevos (251 diseños) y 3 plantillas (29 en total), en la subcategoría **Tarjetas › Paneles de ventas y control**.

| Plantilla | Qué trae |
|---|---|
| **Panel de ventas oscuro** (paleta «Café moka») | cifra de ventas con curva naranja, tres indicadores, mapa de calor de seis semanas y movimientos (cada uno con su concepto, fecha e importe) |
| **Finanzas · crema y oliva** (paleta «Malva») | saldo en crema con ingresos y gastos, saldo en verde oscuro, gráfico de línea y movimientos |
| **Centro de mando** (paleta «Azul acero») | cuatro acciones rápidas de colores, resumen del día con lo fijado y barras de resultados |

**Bloques nuevos**: 1 barra («Oscura con pastilla violeta») y 9 tarjetas: ventas con curva, mapa de calor, tres indicadores, movimiento oscuro, saldo en crema, saldo en verde, acciones rápidas, resumen del día y barras de resultados.

- Colores propios con cualquier paleta; el contraste lo revisa el guardián.
- Las cifras y gráficos de ejemplo no se pisan con «Adaptar textos»; los movimientos traen cuatro filas distintas.

## Pruebas
- `tests/tinta-referencias.cjs` pasa a 112 comprobaciones y cubre las 20 plantillas de referencias.
- `tinta-oscuras.cjs` ahora recorre las 8 plantillas de sector con cada paleta (las de referencias se revisan en `tinta-referencias.cjs`): con 29 plantillas superaba los 5 minutos que da el ejecutor a cada prueba.
- `tinta-tarjetas.cjs` acepta que una plantilla con paleta añada una clase a la tarjeta (la paleta se conserva al cambiar de plantilla, como siempre).
