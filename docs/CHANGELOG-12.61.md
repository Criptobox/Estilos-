# 12.61 · Conectar una IA con clave propia

Inspirado en el apartado de claves de FORJA-IA.

- Diálogo «Conectar una IA» (desde «Crear con un chat de IA»): eliges proveedor, pegas la clave y pulsas «Probar y cargar modelos».
- Proveedores: Groq, Google Gemini, OpenRouter, AiHubMix, OpenCode Zen (la clave es opcional), DeepSeek, NVIDIA NIM, OpenAI, Anthropic y «Otro» compatible con OpenAI (dirección propia; solo https o localhost).
- La app pide la lista real de modelos del proveedor y prueba cada uno con una petición de 16 tokens (3 a la vez, para no agotar el límite por minuto). Se descartan embeddings, voz, imagen y moderación; en proveedores de solo gratuitos, solo se prueban los «:free» o «-free». Tope de 24 por tanda.
- Solo se pueden usar los modelos que responden. Cada resultado se explica: «no existe», «clave sin acceso», «cuota agotada» (cuenta como válido), «sin respuesta». Un bloqueo de cuenta (por ejemplo la política de datos de OpenRouter) no se acusa al modelo.
- Si el proveedor no deja listar modelos, se prueban los de siempre. Si el navegador bloquea al proveedor (CORS) se dice claramente.
- «Generar con mi IA»: manda el prompt al modelo activo; si la respuesta no sirve, la devuelve una vez con las correcciones; después arma la pantalla.
- La clave se guarda solo en el dispositivo (`estilos-tinta-ia-v1`), solo se envía al proveedor elegido y no entra en copias de seguridad, enlaces compartidos ni borradores.
- Limitación conocida: algunos proveedores no aceptan conexiones desde un navegador. En Android se resolverá con una conexión nativa más adelante.
- Pruebas: 11 unitarias (`ia.test.cjs`) y e2e `tinta-ia.cjs` con un proveedor simulado.
