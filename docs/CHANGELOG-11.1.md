# Estilos 11.1

## Exportar con Tailwind
- El ZIP incluye ahora `tailwind/`: un proyecto React + Vite + **Tailwind CSS v4** con el mismo diseño que el HTML. Los valores del bloque (colores, radios, sombras, animaciones…) van como utilidades con valores arbitrarios (`bg-[#EEF2FF]`, `rounded-[24px]`, `translate-x-[6px]`…); el CSS propio solo trae las animaciones y las variantes Glass/Soft/Outline/Bold. Con el modo oscuro automático activado, la página usa variantes `dark:`.
- Verificado: se instaló y compiló con Vite, y los estilos calculados de cada bloque coinciden con los del HTML exportado.

## Copia automática en un archivo
- En Ajustes (Chrome y Edge de escritorio): se elige un archivo una vez y la app lo actualiza sola unos segundos después de cada cambio (estilos, constructor, temas, capturas). El manejador se guarda en IndexedDB.
- Tras cerrar el navegador, Chrome pide confirmar el permiso con un gesto: la app avisa y ofrece «Reactivar». Si el navegador no tiene la API (Firefox, Safari, móviles) lo explica y no ofrece el botón.

## Compartir por enlace
- «Copiar enlace del proyecto» (o el menú de compartir del sistema): el proyecto va comprimido (deflate) y codificado en base64url dentro del `#` de la dirección, así que no se envía a ningún servidor. Los enlaces típicos pesan unos cientos de caracteres.
- Al abrir un enlace se pide confirmación («Sustituye tu proyecto actual… podrás deshacerlo»), se limpia el `#` de la dirección y se avisa de los componentes que no existen en ese dispositivo. Un enlace dañado o demasiado grande se rechaza (tope de 3 MB descomprimido).
- Las imágenes reemplazadas no viajan en el enlace; para eso están el ZIP y la copia de seguridad.

## Reordenar capas con el dedo
- Cada capa tiene un asa (⠿) que se arrastra con el dedo o el ratón; arrastrar sobre una capa de una carpeta mete la capa en esa carpeta; las capas bloqueadas no se mueven; se puede deshacer; la lista se desplaza sola al acercarse al borde. Las flechas siguen disponibles.
- Corrección durante las pruebas: una regla (`.builder-wrap button{touch-action:manipulation}`) hacía que el navegador cancelara el gesto táctil; el asa usa `touch-action:none` con más especificidad.

## Calidad de las imágenes del constructor
- Selector Baja (640 px), Media (1000 px, como hasta ahora) y Alta (1600 px) para las imágenes que se reemplazan a partir de ese momento. El panel muestra cuántas imágenes hay en el proyecto y cuánto pesan.

## Publicación condicionada a las pruebas
- `pages.yml` ejecuta `tests.yml` (reutilizable) antes de desplegar: si las pruebas fallan o se cancelan, la PWA no se publica. La publicación manual admite `skip_tests` para emergencias.
- `tests.yml` sigue ejecutándose en cada pull request.

## Reproducibilidad de las pruebas en CI
- `tests/package.json` fija Playwright en la versión exacta probada (1.63.0) y `tests/package-lock.json` se instala con `npm ci`. Con una versión flotante (`^1.63.0`) la primera ejecución en GitHub falló: npm resolvió una versión cuyo `playwright-core` aún no estaba disponible en el registro, y la publicación quedó bloqueada (la protección funcionó, pero por una causa evitable).

## Verificación
- 104 comprobaciones de extremo a extremo correctas en Chromium (escritorio y móvil con pantalla táctil simulada por CDP, claro y oscuro).
- `actionlint` sin errores en `pages.yml` y `tests.yml`.
- No cubierto por las pruebas: recordar el archivo de la copia automática tras recargar (leer de IndexedDB un manejador de OPFS cierra el Chromium de pruebas; en Chrome real los manejadores de `showSaveFilePicker` se guardan así) y la ejecución de los workflows en GitHub.
- El APK no se ha compilado.
