# 12.63 · Subir el proyecto a GitHub

- Botón «Subir a GitHub» junto a «Descargar mi pantalla» (aparece al crear la pantalla). Guía de 4 pasos dentro del diálogo para sacar el token.
- Sube en UN solo commit (blobs → árbol → commit → rama, API de Git de GitHub): `index.html` (la app completa con todas las pantallas), `README.md` (idea, pantallas, paleta, tipografía, colores y un prompt para continuar con una IA de programación) y `tinta-proyecto.json` (se reabre en Tinta).
- No pisa nada: parte del árbol existente y solo añade o actualiza esos archivos. Admite carpeta (opcional), rama (la principal por defecto; si no existe, se crea desde la principal) y repositorios recién creados y vacíos (commit inicial automático).
- «Comprobar token» dice quién eres y lista los repositorios donde puedes escribir; si solo hay uno, lo elige solo. Errores explicados en español (token no válido, falta el permiso Contents, repositorio no encontrado, límite de GitHub, red).
- GitHub Pages opcional: activa la web de la rama y da la dirección (`usuario.github.io/repositorio`).
- Seguridad: el token se guarda solo en el dispositivo (`estilos-tinta-github-v1`), solo se envía a `api.github.com`, no entra en copias de seguridad, enlaces ni borradores; «Olvidar token» lo borra. Se validan usuario, repositorio, rama y rutas (sin `..`), y los enlaces abren con `noopener`.
- Pruebas: 9 unitarias con un GitHub simulado (`github.test.cjs`) y e2e `tinta-github.cjs` (17 comprobaciones).
