# Esta entrega abre Tinta, no la interfaz antigua

La versión actual incluye la mancha 3D sin círculo decorativo, el recorrido Idea → Bloques → Pantalla, catálogo de 138 recursos, proyectos, edición de textos/fotos/destinos, estados interactivos disponibles, modo oscuro, estilos de botones y tarjetas y Deshacer/Rehacer.

## Comprobar antes de subir

1. Para verla de inmediato, abre **ABRIR-TINTA-ACTUAL.html**, incluido en el ZIP de entrega. Es una copia autónoma para visualizar; NO es la raíz del código fuente.
2. En el código fuente, **web/index.html** y **web/crear.html** contienen Tinta actual.
3. La interfaz clásica se conserva aparte en **web/biblioteca.html** y **web/agente.html**, accesible desde el menú de Tinta. No hay conversión ni borrado de proyectos clásicos.

## Actualizar tu repositorio Estilos-

- Descomprime el ZIP completo. Copia su contenido sobre la raíz de tu repositorio, **reemplazando** los archivos existentes. No lo metas en otra subcarpeta.
- Incluye `.github` y `.gitignore`, aunque el explorador los oculte.
- Importante: reemplazar `web/index.html`, `web/sw.js`, `web/manifest.webmanifest` y `.github/workflows/`; no copiar solo los JS nuevos.
- GitHub Pages debe usar **GitHub Actions** como fuente. El workflow `pages.yml` publica **web**, después de las pruebas. No publiques la raíz del repositorio ni una rama/carpeta antigua.
- Haz commit y push, y espera a que el workflow «Publicar PWA» termine correctamente. Esta entrega no realiza el push ni el despliegue por ti.
- Si subes desde la web de GitHub, sube los archivos descomprimidos respetando las carpetas, no el ZIP como único archivo.

## Si una instalación anterior sigue mostrando la pantalla vieja

Cierra y vuelve a abrir la página con conexión para que el service worker busque la actualización. Si es necesario, realiza una recarga forzada o cierra todas las pestañas de esa instalación y vuelve a abrirla. No borres los datos del sitio sin exportar tus proyectos antes. El nuevo SW reemplaza la caché de recursos antigua; no elimina localStorage ni las copias guardadas.

## Verificación de mantenimiento

```sh
python tools/sync-tinta-entry.py --check
cd tests
npm ci
npx playwright install chromium
npm test
```

Las pruebas de entrada comprueban la portada real bajo una subruta como `/Estilos-/`, el catálogo actual, el inspector de tarjetas, el funcionamiento offline y la actualización desde una caché antigua. El editor clásico se prueba en su ruta separada.
