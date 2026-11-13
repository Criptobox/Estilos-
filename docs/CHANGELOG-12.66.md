# 12.66 · Android con Internet y diálogos rediseñados

- Causa del error «Sin respuesta» al conectar una IA en el móvil: la app Android no declaraba el permiso `INTERNET` (hasta ahora solo cargaba sus propios archivos), así que ninguna IA ni GitHub podía responder. Se añade el permiso y una comprobación en `tests/versions.cjs` para que no vuelva a perderse.
- Peticiones nativas: `EstilosAndroid.httpRequest` (OkHttp 4.12) saca las peticiones https de las IA y de GitHub por la app, sin la restricción CORS del navegador (NVIDIA NIM y otros no aceptan conexiones desde un navegador) y con soporte de PATCH, que GitHub necesita para actualizar la rama. Solo https, respuesta de hasta 5 MB, cancelable. En el navegador normal sigue usándose `fetch`.
- «Conectar una IA» rediseñado: proveedores como botones (con ✓ si ya están conectados), tarjeta con la clave y botón para mostrarla u ocultarla, acciones claras, estado con indicador de progreso, aviso del modelo en uso y lista de modelos con su resultado y botón «Usar».
- Todos los diálogos nuevos (conectar IA, chats, GitHub, paleta desde imagen) comparten el estilo «hoja»: usan los colores del tema claro y oscuro de la app, tamaños de letra legibles, campos y botones del mismo tamaño. Antes salían con letra enorme y sin estilo.
- El mensaje de «sin respuesta» sugiere probar otro proveedor (Groq y Gemini suelen aceptar conexiones desde el navegador).
- Pruebas: e2e `tinta-nativo-http.cjs` (10 comprobaciones con un puente simulado) y la de IA actualizada. La compilación de Android se verifica en CI.
