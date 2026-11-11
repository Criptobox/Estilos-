# 12.35 · Biblioteca organizada por categorías y subcategorías

«Los bloques» ya no es una sola lista larga. Ahora abre con **15 categorías** (más «Todo el catálogo»); cada una tiene sus **subcategorías** y solo enseña lo suyo.

| Categoría | Subcategorías |
|---|---|
| Plantillas | las 9 plantillas |
| Paletas de color | Claras · Oscuras · Rojos, naranjas y dorados · Verdes · Azules y turquesas · Violetas y rosas · Neutras |
| Animaciones | Entrada · Tarjetas · Botón principal · Microinteracciones |
| Barras inferiores | Esenciales y limpias · Flotantes y en isla · Con botón central · Indicador de activo |
| Botones | Principales · Suaves, de borde y texto · Circulares y cantidad · Chips, acceso y estados |
| Tarjetas | Tienda y comida · Viajes y eventos · Música, fitness, salud y cursos · Finanzas y resúmenes · Perfil y social · Promociones y editoriales · Tareas, subida y esqueletos |
| Cabeceras | Con buscador · Título y navegación · Saludo y perfil |
| Avatares y mascotas | Personas · Robots y mascotas · Orbes y efectos |
| Formularios y entradas | Entradas y búsqueda · Acceso y pago · Controles y selectores · Contacto y valoración |
| Datos y widgets | Gráficos · Cifras y métricas · Progreso y pasos · Calendario, clima y más |
| Listas y chat | Listas · Chat y mensajes |
| Avisos, diálogos y hojas | Avisos y banners · Estados vacíos y de éxito · Diálogos y hojas |
| Pantallas | Pantallas completas · De recorrido |
| Tipografía, fondos e iconos | Tipografía · Colores y gradientes · Fondos y superficies · Iconos |
| Favoritos y recientes | Favoritos · Recientes · Elegidos · Mis estilos |

- Cada uno de los 181 diseños está en **una sola** categoría y subcategoría; los números de los chips coinciden con lo que se ve.
- Cada categoría tiene su dirección (`#bloques/tarjetas/viajes`), así que el botón Atrás del navegador y de Android funciona, y «Seguir eligiendo» vuelve a la categoría donde estabas.
- Hay buscador global (en el inicio) y buscador dentro de cada categoría.
- «Todo el catálogo» conserva la vista completa con los filtros avanzados de antes (módulo, estilo, estados…).
- Al enviar tu idea, la biblioteca abre en «Favoritos y recientes › Elegidos» (la receta que se te propone).
- Los componentes de «Los estilos» propios aparecen en «Mis estilos».

Nueva prueba `tests/tinta-categorias.cjs` (78 comprobaciones, móvil, claro y oscuro, con axe-core). Las pruebas antiguas se adaptaron a la nueva navegación.
