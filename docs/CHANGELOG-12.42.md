# 12.42 · Ilustraciones de comida

Cinco ilustraciones planas nuevas, dibujadas en vector (240×140, sin texto ni scripts), que se suman a las 23 anteriores (28 en total): **hamburguesa, porción de pizza, helado de cucurucho, patatas fritas y refresco**.

- Las usan las tarjetas de comida y reparto (12.41): la hamburguesería muestra hamburguesa, pizza y helado; la ficha pastel y el combo 2×1 llevan hamburguesa; la heladería lleva helados en cuatro sabores (fresa, chocolate, limón y menta, cambiando el color de las bolas); el combo muestra hamburguesa, patatas y refresco; y «Plato con valoración y precio» alterna patatas, hamburguesa y pizza.
- Cada tarjeta puede elegir qué plato dibuja en cada copia (`artKeys`) y declarar que su ilustración no se sustituya por la del sector (`keepArt`).
- Las ilustraciones nuevas no entran en la rotación automática del sector «comida» (taza, cruasán, tarta y té), para no cambiar la cafetería.
- Nuevo `TintaArt.get(nombre)` para pedir una ilustración concreta; `tests/tinta-ilustraciones.cjs` comprueba las 28.
