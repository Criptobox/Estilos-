# 12.36 · Estilos visuales para toda la pantalla

Nueva categoría de la biblioteca, **Estilos visuales**, y una capa nueva (como las paletas): con un toque cambia el lenguaje de diseño de **toda la pantalla** —tarjetas, botones, campos, cabeceras y la barra inferior— sin tocar los bloques que elegiste.

| Estilo | Idea | Cómo se ve |
|---|---|---|
| **Minimalismo** | Poco, caro y con aire | blanco, bordes finos, esquinas discretas, botón negro |
| **Diseño suizo** | Rejilla, grotesca y un rojo | tipografía Helvetica en negrita, filetes negros, esquinas rectas, botón rojo en mayúsculas |
| **Bento grid** | Una caja por función | fondo gris suave y cajas blancas muy redondeadas |
| **Claymorfismo** | Redondo, pastel y amable | rosas y lilas, relieve de plastilina, botones inflados |
| **Skeuomorfismo / neumorfismo** | Relieve, brillo y materiales | gris azulado con sombras dobles, botones y campos en relieve o hundidos |
| **Liquid Glass** | El cristal necesita algo detrás | fondo de color difuminado y paneles de cristal con desenfoque |
| **Neofuturismo** | Fondo oscuro y un neón | negro azulado, bordes y brillos cian, botón con degradado neón |
| **Brutalismo** | Creadores y lanzamientos | fondo amarillo, bordes negros gruesos, sombras duras, tipografía monoespaciada |

- Subcategorías: Limpios y ordenados · Suaves y táctiles · Cristal y neón · Atrevidos. Cada tarjeta trae una vista previa hecha con bloques reales.
- Es una **capa**: se quita pulsando otra vez, se deshace con Deshacer, se guarda en proyectos y copias, viaja en el enlace de compartir y en el HTML exportado.
- Convive con las paletas: el estilo manda en fondo y formas, y la paleta aporta el acento donde tiene sentido (suizo, clay, neofuturismo, brutalismo). Lo que ajustaste a mano en un bloque (Diseño / Color) se respeta.
- El contraste de todos los textos se corrige con el guardián de 12.25.
- Si el fondo del estilo es un degradado (clay, liquid), la barra inferior exportada usa un color liso para no romperse.
- Nueva prueba `tests/tinta-visual.cjs` (28 comprobaciones). Las categorías de la biblioteca pasan de 15 a 16.
