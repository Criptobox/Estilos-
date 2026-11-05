# Estilos 10.9 — Auditoría y correcciones de integración

- Corregido el historial para sincronizar el estado de la pantalla activa antes de capturar o restaurar.
- Corregida la creación de una nueva rama después de deshacer: ahora el siguiente cambio también puede deshacerse.
- Añadidos límites de memoria al historial (máximo 60 estados, presupuesto total de 12 millones de caracteres y límite por estado).
- Si el proyecto excede el tamaño admitido por el historial, se evita almacenar copias excesivas y se informa al usuario.
- Revisada la integración de carpetas, bloqueo, visibilidad, edición directa, imágenes, exportación y accesos móviles.
- Pruebas aisladas de secuencia: cambio → deshacer → nueva rama → deshacer/rehacer y sincronización de pantalla activa.
- Validación de sintaxis JavaScript y estructura HTML del paquete.

## Correcciones al integrar en main
- **En el móvil, la barra del constructor tapaba la barra principal** (Inicio, Explorar, Crear…): no se podía salir del constructor. Ahora se apila encima.
- **Tocar una tarjeta del selector visual no añadía el diseño** (la acción leía `data-id` y la tarjeta solo tiene `data-picker-id`). En el móvil, donde el arrastre HTML5 no funciona con el dedo, no había forma de añadir componentes.
- Modo Imagen: tocar un icono SVG no hacía nada (se comparaba `tagName` con "SVG" y el DOM devuelve "svg"). Ahora se reemplaza por la imagen elegida.
- Modo Texto e Imagen: ya se pueden editar textos e iconos que están dentro de botones del propio diseño (antes se ignoraba cualquier botón).
- Carpetas: crear, renombrar y eliminar usan hojas propias en lugar de `prompt()`/`confirm()`; Enter confirma.
- Ctrl/Cmd+Z y +Y solo actúan en el constructor (antes deshacían cambios del constructor desde otras pantallas).
- Se recuperan las correcciones de la 9.1 que el paquete había perdido: el desplazamiento X/Y y el arrastre ya no se anulan con las animaciones, Flotar y Pulso se repiten, se quita la casilla «Sombra suave» (la sustituye la elevación), y en la exportación Outline respeta el estilo de borde y se respeta «reducir movimiento».
- Al escribir en un campo del constructor y tocar la barra inferior ya no se pierde el toque.
- Las ediciones de texto e imagen se aplican sobre un documento inerte (DOMParser): el HTML analizado no ejecuta atributos `on*` ni carga recursos.
- Versión unificada en 10.9 (workflow de Pages, comentarios, README) y sin las diez copias `preview-10.x.html`.

## Modo oscuro y mejoras de la PWA integradas
- Tema Automático / Claro / Oscuro (cabecera de Inicio y Ajustes), también en el constructor: selector visual, capas, carpetas, historial y barra móvil. La maqueta del teléfono muestra el diseño tal cual.
- Editor en vivo en el detalle, código para Tailwind, Compose, SwiftUI y Flutter, capturas propias con extracción de paleta, copia de seguridad en archivo, búsqueda sin acentos, vistas previas diferidas, service worker «caché primero», referencias en WebP y foco accesible en hojas y visor.
- Modo Texto: los textos que van junto a un icono (p. ej. «＋ Añadir al carrito») se editan con una hoja y el icono se conserva.
- Modo Texto: «Deshacer» no funcionaba con el modo activo (cualquier clic, incluido el de Deshacer, guardaba antes un punto de historial). Ahora el punto se guarda solo al empezar a editar.
- La maqueta del constructor se dibuja al momento (sin parpadeo) aunque el resto de vistas previas sea diferido.
