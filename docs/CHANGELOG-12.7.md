# 12.7 · Una sola biblioteca, dentro de Tinta

- El menú de Tinta ya no abre otra página: **«Biblioteca de diseños»** lleva al paso 02 (Los bloques), donde están los 126 diseños de la biblioteca más los nuevos, con búsqueda, categorías, módulos y estilos.
- **Favoritos en Tinta**: estrella en cada diseño y filtro «★ Favoritos». Comparte los datos guardados de la biblioteca clásica (los favoritos que ya tenías aparecen), conserva los que Tinta no conoce y funciona con teclado.
- `biblioteca.html` redirige a Tinta (`index.html#bloques`). La versión clásica queda solo para enlaces compartidos antiguos (`#p1=…`) y para quien la abra con `?clasica=1`.
- El Agente y los atajos de la app (manifest) apuntan a la biblioteca de Tinta.
- Pruebas: `tests/tinta-favoritos.cjs` (16 comprobaciones) y ajustes en las que usaban la página clásica.
