# Estilos 4.0.0

Biblioteca UI y constructor visual multipantalla, pensado para móvil y disponible como PWA y envoltorio Android.

## Biblioteca
- 107 diseños base en 15 categorías con componentes.
- 27 capturas de referencia.
- Previsualización, código, paletas, favoritos, búsqueda y contraste WCAG.

## Constructor 4.0
- Hasta 8 pantallas por proyecto, con creación, duplicación, cambio y eliminación.
- Hasta 12 componentes por pantalla.
- Cada pantalla guarda su propio título, descripción, capas y propiedades.
- Edición de color, tipografía, tamaño, peso, alineación, redondeo, espaciado, borde, sombra, ancho y desplazamiento.
- Arrastre del asa en la vista previa para ajustar posición.
- Temas predefinidos: Violeta Studio, Midnight, Ivory y Mint.
- Guardado de temas personalizados en el dispositivo.
- Exportación HTML autocontenida con navegación entre pantallas.

## Versiones
- Web/PWA: `4.0.0` (GitHub Actions añade el número de compilación).
- Android: `versionCode 11`, `versionName 4.0`.
- Application ID: `com.estilos.app`; minSdk 26; targetSdk 34.

## Ejecutar
```bash
cd web
python3 -m http.server 8000
```
Abrir `http://localhost:8000`.

## Compilar APK
Requiere JDK 17, Android SDK 34 y Gradle 8.9.
```bash
gradle :app:assembleDebug
```
El workflow `android.yml` compila una APK debug y la publica como artifact.

## Estado de verificación
Se comprueba la sintaxis de todos los JavaScript y la integridad del ZIP. La compilación APK y las pruebas en un teléfono físico deben confirmarse en GitHub Actions/dispositivo.


## Estilos 5.0
Incluye edición del contenido de cada componente, navegación entre pantallas, guardado local y exportación HTML o React + CSS. Consulta `docs/CHANGELOG-5.0.md`.


## Versión 5.0
Editor de contenido por componente, navegación entre pantallas, guardado local y exportación HTML o React + CSS. Ver `docs/CHANGELOG-5.0.md`.
\n\n## Estilos 6.0\nBiblioteca de 15 componentes con búsqueda y categorías, cuatro plantillas completas y nuevos bloques de navegación, formularios y datos. Ver `docs/CHANGELOG-6.0.md`.\n

## Estilos 7.0
Favoritos, búsqueda y filtros, colecciones propias y componentes personalizados reutilizables. Ver `docs/CHANGELOG-7.0.md`.


## Estilos 8.0
Estudio visual con avatares, iconos, ilustraciones, fondos, recursos animados, seis paletas e importación de imágenes. Ver `docs/CHANGELOG-8.0.md`.


## Estilos 9.0
Component Studio: variantes Glass, Soft UI, Outline y Bold; animaciones configurables; duración, elevación y presets rápidos. Ver `docs/CHANGELOG-9.0.md`.


## 9.1 — Component Studio integrado
Las variantes, animaciones, elevación y presets se encuentran ahora en el editor de propiedades de cada componente del constructor principal. Los cambios se guardan con el proyecto y se trasladan a la exportación HTML.


## 10.0 — Selector visual de diseños
La biblioteca del constructor muestra miniaturas reales de los diseños, agrupadas por categoría y filtrables mediante búsqueda. Al tocar una tarjeta se añade el componente seleccionado a la pantalla.
