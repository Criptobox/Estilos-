# 12.57 · Las fotos ya no llenan el navegador

Revisión externa, hallazgo C4: las fotos que subías a Tinta se guardaban como texto (base64) **dentro del borrador y de cada proyecto**, en `localStorage` (unos 5 MB en total). Con unas pocas fotos grandes el almacenamiento se llenaba y el guardado fallaba: había riesgo de perder trabajo.

**Qué cambia**
- Las fotos de más de ~30 KB se guardan en **IndexedDB** (un almacén aparte, con mucho más espacio). El borrador y los proyectos solo llevan una referencia corta; un borrador con una foto grande pasó de cientos de miles de caracteres a unos 360.
- En pantalla, al exportar, al compartir y al deshacer nada cambia: la app sigue trabajando con la foto completa en memoria.
- **Al recargar** las fotos vuelven solas. Si no tienes ninguna foto guardada así, la app arranca exactamente igual que antes, sin esperas.
- La **copia de seguridad** y el JSON de un proyecto siguen llevando la foto completa, para que sean portables entre navegadores.
- Una misma foto usada varias veces se guarda una sola vez, y las fotos que ya no usa ningún borrador ni proyecto se limpian solas pasados unos segundos del arranque.
- **Sin IndexedDB** (modo privado en algunos navegadores, iframe aislado) todo sigue funcionando como antes, con las fotos dentro del texto. Si IndexedDB falla al escribir, la app lo detecta y vuelve a guardar con las fotos dentro.
- Las fotos pequeñas (< 30 KB) siguen dentro del texto: no compensa moverlas.

**Pruebas**: `tests/unit/almacen.test.cjs` (12 comprobaciones del almacén con un adaptador en memoria) y `tests/tinta-fotos.cjs` (11 comprobaciones con IndexedDB real: la foto sale del borrador, vuelve al recargar, no se duplica al guardar y la copia de seguridad la lleva completa).

**Límite conocido**: la copia de seguridad sigue teniendo el tope de 8 MB, así que con muchas fotos grandes habrá que exportar los proyectos por separado.
