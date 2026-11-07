# Estilos Studio 14 · diseño del entorno

## Objetivo

Dar prioridad a la pantalla que se está diseñando, en vez de añadir controles sobre una interfaz de catálogo. Las muestras de componentes conservan sus colores; el entorno utiliza superficies neutrales y un único acento índigo.

## Distribución

- **Escritorio, ≥1200 px:** navegación lateral, capas (260 px), lienzo flexible e inspector (300 px). Entre 1200 y 1370 px la navegación se compacta a iconos con nombres accesibles.
- **Tablet:** lista de bloques y lienzo en dos columnas; las propiedades se abren en panel inferior.
- **Móvil, ≤720 px:** ajustes/lienzo por pestañas y propiedades en panel inferior. La biblioteca conserva acceso en la navegación inferior.
- **Biblioteca, ≥1000 px:** navegación lateral y área editorial amplia. En tamaños menores utiliza navegación inferior.

El brief es plegable y se inicia cerrado en escritorio. En las filas de bloque, las acciones secundarias son contextuales al seleccionar, enfocar o pasar el cursor; en pantallas táctiles permanecen visibles. Las flechas permiten reordenar sin arrastrar.

## Inspector

Reutiliza el editor de contenido y sus funciones existentes. En escritorio es un panel complementario, no un diálogo modal: no hay fondo bloqueante ni trampa de foco. En móvil se conserva el diálogo con foco contenido y Escape. Seleccionar desde el lienzo también selecciona la capa correspondiente.

No se han añadido nuevas acciones comerciales: los destinos siguen siendo enlaces, no lógica de carrito ni envío.

## Biblioteca

Los marcos tienen altura consistente. Las muestras se dibujan a 240 px y se ajustan al espacio disponible con un ResizeObserver. Esto solo afecta a las miniaturas de catálogo: no modifica el diseño, su detalle ni su exportación. Los estilos con código propio conservan su iframe aislado.

## Proyectos

En escritorio se muestran como una vista dentro del espacio de trabajo, con miniaturas de encabezado, tarjeta y acción. Las vistas se generan con el estado guardado, no con el borrador actual. Los helpers de render aceptan un estado explícito, sin mutar la pantalla para producir miniaturas. Cada miniatura vive en un iframe sandbox sin scripts ni interacción.

Las copias siguen siendo explícitas. Abrir, actualizar y eliminar conservan sus confirmaciones. El historial del editor no cruza entre proyectos.

## Compatibilidad

- `css/studio-shell.css` aplica la nueva presentación a ambas páginas y está incluido en el precache.
- Se conserva el creador clásico y sus gestos táctiles. Sus controles de arrastre mantienen `touch-action:none`.
- Se comparten las preferencias de tema de biblioteca y Agente. El tema de la pantalla diseñada continúa siendo independiente del tema del entorno.
- Proyectos anteriores y respaldos no requieren migración.
- El Agente continúa usando recetas locales; no incorpora un LLM.

## Fuera de esta ronda

- El lienzo del Agente sigue siendo una pantalla móvil de 390 px; la adaptación del entorno al escritorio no implica exportación responsive multiformato.
- La gestión de proyectos en móvil sigue siendo un diálogo.
- El inspector aún concentra contenido, imágenes y destinos en un panel desplazable; las pestañas avanzadas y la edición de más variantes visuales quedan pendientes.
- No se ha sustituido toda la navegación del creador clásico ni su motor.

## Validación

La suite `tests/studio-shell.cjs` cubre distribución de escritorio, selección, foco no modal, historial con inspector abierto, arrastre y recuperación del orden, rol de bloque en el selector, cinco anchos de viewport, panel inferior móvil, miniaturas y tema compartido.
