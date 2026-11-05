# Estilos 10.9.0

Biblioteca UI y constructor visual multipantalla, pensado para móvil y disponible como PWA y envoltorio Android.

## Biblioteca
- 107 diseños base en 15 categorías con componentes.
- 27 capturas de referencia.
- Previsualización, código, paletas, favoritos, búsqueda y contraste WCAG.

## Constructor
- Hasta 8 pantallas por proyecto, con creación, duplicación, cambio y eliminación.
- Hasta 12 componentes por pantalla.
- Cada pantalla guarda su propio título, descripción, capas y propiedades.
- Edición de color, tipografía, tamaño, peso, alineación, redondeo, espaciado, borde, sombra, ancho y desplazamiento.
- Arrastre del asa en la vista previa para ajustar posición.
- Temas predefinidos: Violeta Studio, Midnight, Ivory y Mint.
- Guardado de temas personalizados en el dispositivo.
- Exportación HTML autocontenida con navegación entre pantallas.

## Modo oscuro
- Tema **Automático / Claro / Oscuro**: botón en la cabecera de Inicio (alterna) y selector en Ajustes. Se guarda en `localStorage` (`estilos-theme`) y se aplica antes de pintar (sin destello).
- Toda la interfaz usa variables CSS (`:root` y `:root[data-theme="dark"]` en `css/styles.css`); las vistas previas mantienen su propio escenario claro/oscuro.
- Android 10+ (API 29): tema `DayNight` en `res/values-v29`, así el modo Automático y las barras del sistema siguen al teléfono. En Android 8–9 el modo Automático usa claro; elige Oscuro a mano.


## Versiones
- Web/PWA: `10.9.0` (GitHub Actions añade el número de compilación).
- Android: `versionCode 27`, `versionName 10.9`.
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

## Historial
- **10.9**: Auditoría y correcciones de integración. Ver `docs/CHANGELOG-10.9.md`.
- **10.8**: Deshacer y rehacer. Ver `docs/CHANGELOG-10.8.md`.
- **10.7**: Grupos y carpetas de capas. Ver `docs/CHANGELOG-10.7.md`.
- **10.6**: Panel visual de capas. Ver `docs/CHANGELOG-10.6.md`.
- **10.5**: Reemplazo de imágenes en el lienzo. Ver `docs/CHANGELOG-10.5.md`.
- **10.4**: Edición de texto directa. Ver `docs/CHANGELOG-10.4.md`.
- **10.3**: Edición táctil directa. Ver `docs/CHANGELOG-10.3.md`.
- **10.2**: Constructor optimizado para móvil. Ver `docs/CHANGELOG-10.2.md`.
- **10.1**: Colocación visual por arrastre. Ver `docs/CHANGELOG-10.1.md`.
- **10.0**: Selector visual de diseños. Ver `docs/CHANGELOG-10.0.md`.
- **9.1**: Component Studio integrado en el constructor principal: variantes, animaciones, elevación y presets en cada componente. Ver `docs/CHANGELOG-9.1.md`.
- **9.0**: Component Studio: variantes Glass, Soft UI, Outline y Bold; animaciones configurables; duración, elevación y presets rápidos. Ver `docs/CHANGELOG-9.0.md`.
- **8.0**: estudio visual con avatares, iconos, ilustraciones, fondos, recursos animados, seis paletas e importación de imágenes. Ver `docs/CHANGELOG-8.0.md`.
- **7.0**: favoritos, búsqueda y filtros, colecciones propias y componentes personalizados reutilizables. Ver `docs/CHANGELOG-7.0.md`.
- **6.0**: biblioteca de 15 componentes con búsqueda y categorías, cuatro plantillas completas y nuevos bloques de navegación, formularios y datos. Ver `docs/CHANGELOG-6.0.md`.
- **5.0**: edición del contenido de cada componente, navegación entre pantallas, guardado local y exportación HTML o React + CSS. Ver `docs/CHANGELOG-5.0.md`.
- **4.0**: constructor multipantalla. Ver `docs/CHANGELOG-4.0.md`.
