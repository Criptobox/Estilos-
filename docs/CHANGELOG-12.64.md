# 12.64 · Lanzadores a chats web

- En «Crear con un chat de IA»: botones para ChatGPT, Claude, Gemini, GLM, DeepSeek y Kimi. Cada uno copia el prompt (con tu idea y el catálogo) y abre el chat en otra pestaña del navegador (`noopener`), donde ya tienes la sesión iniciada. En la app Android el enlace se abre en el navegador del móvil.
- «Pegar la respuesta copiada y crear»: lee el portapapeles, valida la respuesta y arma la pantalla. Al volver a la app tras abrir un chat, el botón se resalta. Si el navegador no deja leer el portapapeles (típico en móviles y WebView), enfoca el recuadro de la respuesta y explica cómo pegar a mano.
- Portapapeles vacío: lo dice. El prompt va en el portapapeles, no en la dirección, porque es demasiado largo para una URL.
- Corrección visual: los botones principales de los diálogos (Generar con mi IA, Copiar el prompt, Crear mi pantalla, Probar y cargar modelos, Subir proyecto, Guardar y usar, Crear con el equipo) salían sin fondo; ahora llevan el estilo coral.
- Pruebas: e2e `tinta-chats.cjs` (11 comprobaciones; estable en 8 ejecuciones).
- Pendiente (Android): leer y copiar el portapapeles con un puente nativo, para no depender del permiso del WebView.
