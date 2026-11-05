# Estilos 3.0.0

## Editor visual por componente
- Selección individual de capas desde el listado o directamente desde la vista previa.
- Cada capa tiene ajustes propios: nombre visible, fondo, color de texto, redondeo y espaciado.
- Las propiedades individuales se guardan en el mismo almacenamiento local del constructor.
- Duplicar, eliminar y reordenar capas conserva los ajustes de cada instancia.
- Los estilos individuales también se reflejan en la exportación HTML.
- Los proyectos creados en 2.0/2.1 se migran automáticamente: sus componentes reciben valores iniciales sin perder la selección.

## Límites y compatibilidad
- Se mantienen hasta doce capas por pantalla.
- El formato de datos existente `estilos-builder-v1` se conserva y amplía de forma compatible.
- La versión web/PWA pasa a 3.0.0; Android pasa a versionCode 10 / versionName 3.0.
- La compilación del APK debe verificarse en CI o en un entorno con Android SDK y Gradle.
