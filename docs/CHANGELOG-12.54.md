# 12.54 · Android con targetSdk 36

Segunda parte de la revisión externa: la app de Android pasa a **compileSdk y targetSdk 36** (Android 16), el nivel que Google Play pide para publicar y actualizar apps.

- **Herramientas**: Android Gradle Plugin 8.5.2 → 8.9.1 y Gradle 8.9 → 8.11.1 (en el workflow). Se añade `android.suppressUnsupportedCompileSdk=36` para evitar el aviso del plugin.
- **Bordes de pantalla**: desde la API 35 las apps se dibujan bajo las barras del sistema y ya no se puede desactivarlo. La actividad reserva el espacio de las barras y del teclado (`WindowInsets`), así que el contenido se ve igual que antes y el teclado sigue empujando la pantalla.
- **Atrás predictivo**: con targetSdk 36, `onBackPressed` deja de llamarse en Android 13+. Se registra un `OnBackInvokedCallback` (y se declara `enableOnBackInvokedCallback`) que sigue pasando por el gancho `estilosBack` de la web y solo sale de la app en la raíz. En Android 12 y anteriores se mantiene `onBackPressed`.
- **Sin probar en un dispositivo**: compila en CI, pero los márgenes con las barras y el gesto de Atrás hay que comprobarlos en un móvil con Android 15 o 16.
