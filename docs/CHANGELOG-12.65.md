# 12.65 · Portapapeles nativo en Android

- El puente `EstilosAndroid` de la app gana `copyText` y `readText` (ClipboardManager). `util.js` los expone como `nativeCopy` / `nativeRead`; sin puente (navegador normal) devuelven false / null y se usa `navigator.clipboard` como siempre.
- Usan el puente: copiar el prompt y pegar la respuesta de los chats («Crear con un chat de IA»), copiar el código de un componente y copiar el enlace para compartir. Ya no dependen del permiso del WebView.
- Corrección: «Copiar enlace» generaba un enlace roto dentro de la app Android (la página se carga desde `file://`). Ahora usa la dirección pública de la web (`https://criptobox.github.io/Estilos-/index.html`); si el nombre del sitio fuera otro, hay que ajustar `shareBase()` en `crear.js`.
- Seguridad: el puente solo lo llama la web local al tocar un botón; los enlaces externos siguen abriéndose en el navegador del móvil; texto limitado a 200 000 caracteres.
- Pruebas: e2e `tinta-portapapeles.cjs` (7 comprobaciones, puente simulado). La compilación de Android se verifica en CI (`android.yml`).
