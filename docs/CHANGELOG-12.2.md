# Estilos 12.2 — nuevo aspecto (fase 3 de 3)

## Detalle del componente
- Pestañas **Detalles, Código, Editor y Relacionados**. Relacionados muestra en cuadrícula más estilos de la misma categoría (antes iban en una tira dentro de Detalles).
- Panel de **Uso** con el consejo del estilo y para qué fondos está pensado.
- **Descargar PNG / SVG** del componente (pestaña Código). El SVG lleva el componente en un `<foreignObject>` con XHTML bien formado y la fuente de la app incrustada, y se ve igual en cualquier navegador; el PNG se genera a partir de él al doble de resolución. En navegadores que no permiten exportar el canvas se avisa y queda el SVG. Los estilos con código propio pueden variar algo.

## Paletas
- Vista propia: una fila por paleta con su barra de colores (cada color se copia con un toque, sin abrir el detalle), modo Claro/Oscuro, guardar y filtro Todas / Claras / Oscuras.

## Plantillas
- Cuadrícula de dos columnas (tres en pantallas anchas) con las vistas previas reducidas a la mitad.

## Iconos de la app
- Nuevos iconos 192, 512 y maskable con el degradado violeta→azul y el símbolo de capas.

## Decisiones
- **Tipografías** sigue como lista de estilos: la biblioteca contiene estilos tipográficos (título con acento, precio destacado…), no fuentes; una pantalla de fuentes tipo «Aa Inter / Poppins» pediría añadir y empaquetar fuentes, que no se ha hecho.
- No se ha hecho el «Generador IA» (no hay servidor).

## Pruebas
- 159 comprobaciones de extremo a extremo (nuevas: pestañas del Detalle, Paletas, Plantillas, SVG/PNG válidos, iconos y manifest).
