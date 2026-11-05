# Estilos 2.1.0

## Constructor visual mejorado
- Se amplía el constructor de seis a doce capas.
- Cada capa se puede reordenar con controles arriba/abajo.
- Se incorpora reordenación mediante arrastrar y soltar en navegadores compatibles.
- Se pueden duplicar capas y eliminarlas individualmente, incluso si se duplicó el mismo componente.
- La exportación HTML muestra cada componente en un iframe adaptable con dimensiones visibles, título y aislamiento.
- Se actualizan las versiones de la aplicación y de la caché PWA para evitar que el dispositivo conserve scripts anteriores.

## Compatibilidad
- Se conserva el formato de guardado `estilos-builder-v1`; los proyectos existentes siguen siendo compatibles.
- La reordenación por botones también funciona en pantallas táctiles, sin depender del gesto de arrastrar.
- La exportación sigue siendo un HTML independiente.


---

# Estilos 2.0.0

## Novedades
- Constructor visual accesible desde la navegación inferior.
- Vista previa de móvil en vivo con personalización de nombre, descripción, color principal, fondo, tipografía y radio.
- Composición de hasta seis componentes reales del catálogo.
- Exportación de la composición como HTML autocontenido con previsualizaciones aisladas.
- 19 nuevos recursos originales: animaciones CSS, fondos, widgets, iconografía y combinaciones tipográficas.
- Nuevas categorías: Animaciones, Fondos, Widgets e Iconos.
- Persistencia local de los ajustes del constructor.
- Service worker actualizado para precargar la nueva colección y forzar la actualización de caché.
- Versionado PWA 2.0.x y versión Android 2.0.

## Compatibilidad
- Web/PWA sin dependencias externas nuevas.
- Los nuevos snippets usan HTML y CSS; no requieren bibliotecas externas.
- Android continúa cargando la carpeta `web` desde los assets de la aplicación.
