# 12.8 · Un solo estilo en toda la app

- Nueva piel compartida `web/css/tinta-skin.css`: papel cálido, tinta oscura, acento coral, relieve suave, botones de píldora y tipografía Jakarta, en claro y oscuro. Sustituye al vidrio lavanda (`lavender-glass.css`, eliminado).
- **Editor (Agente)**: cabecera de Tinta («estilos®» + pasos 01–04, con «Editor» activo), Luma con el mismo lenguaje, paleta inicial coral y rótulo «Editor» en lugar de «Estilos Studio». En escritorio la cabecera ocupa todo el ancho y la barra lateral queda debajo.
- **Biblioteca clásica** (solo `?clasica=1` o enlaces compartidos): misma piel y entrada en tinta oscura.
- Pruebas: `lavender.cjs` pasa a `skin.cjs` y comprueba la identidad única (fondo, tipografía, marca, sin hoja lavanda, sin desbordamiento de 320 a 1440 px).
