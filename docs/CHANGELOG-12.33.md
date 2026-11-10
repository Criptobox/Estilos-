# 12.33 · 17 componentes para apps

Nuevos bloques de la biblioteca (181 en total), con el mismo diseño de Tinta, editables con «Texto», adaptados a tu paleta clara u oscura y con el contraste revisado:

| Tipo | Componentes |
|---|---|
| **Datos** | Medidor de meta · Gráfico de línea · Gráfico de anillo · Ranking en barras · Cifra con tendencia |
| **Widgets** | Calendario del mes · Días de la semana · Seguimiento por pasos |
| **Listas** | Tareas por estado |
| **Entradas** | Etiquetas · Búsqueda con filtros (buscador, categorías, rango de precio) |
| **Formularios** | Contacto · Pago con tarjeta · Valoración con estrellas |
| **Avisos** | Avisos de estado (éxito, atención y error) |
| **Hojas** | Diálogo de confirmación · Hoja inferior de opciones |

- Los gráficos son SVG, sin librerías ni scripts. Las cifras, fechas y ejes llevan marca «fija»: **«Adaptar textos a mi idea» no los pisa**; solo adapta los componentes de texto libre (filtros, formularios, avisos, diálogo y hoja).
- Los campos y botones son de vista (no envían nada), igual que el resto de bloques.

## Arreglo
Las 7 pantallas de recorrido de 12.26 mostraban «undefined · Nuevo» en su ficha y no aparecían en el filtro de categorías; ahora tienen la categoría «Pantallas de recorrido» (y por eso el filtro pasa de 19 a 20 categorías).

Nueva prueba `tests/tinta-widgets.cjs` (biblioteca, buscador, composición, adaptar textos y contraste en claro, Noche y Olivo).
