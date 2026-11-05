# Estilos 6.0.0

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
- Web/PWA: `6.0.0` (GitHub Actions añade el número de compilación).
- Android: `versionCode 13`, `versionName 6.0`.
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
- **6.0**: biblioteca de 15 componentes con búsqueda y categorías, cuatro plantillas completas y nuevos bloques de navegación, formularios y datos. Ver `docs/CHANGELOG-6.0.md`.
- **5.0**: edición del contenido de cada componente, navegación entre pantallas, guardado local y exportación HTML o React + CSS. Ver `docs/CHANGELOG-5.0.md`.
- **4.0**: constructor multipantalla. Ver `docs/CHANGELOG-4.0.md`.
