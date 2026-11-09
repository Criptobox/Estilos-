# 12.17 · Revisión de diseño visible en tu pantalla

- **Nueva sección «Revisión de diseño»** al principio de la lista de tu pantalla (paso 3). Aplica al instante las mismas reglas con las que el motor compone: dos acciones principales que compiten, bloques muy pesados a la vez, acentos cálidos y fríos mezclados, mezcla de estilos o de app con página web, demasiadas tarjetas, bloques que no encajan con el sector de tu idea, y la falta de encabezado, barra de navegación o acción principal.
- Cada aviso nombra los bloques implicados con su nombre real («Acción coral» y «Acción en grafito» compiten entre sí) en lugar de sus ids. El título cuenta los avisos; si no hay ninguno, dice «Sin avisos: la pantalla cumple las reglas de diseño».
- Se actualiza al elegir, quitar o cambiar de bloques. Las propuestas del motor llegan siempre sin avisos.
- Los bloques que aún no tienen ficha de diseño no se revisan ni generan falsos avisos; el panel lo indica.
- Pruebas: avisos con nombres y bloques implicados, panel con una propuesta del motor, con dos acciones principales y con un bloque sin ficha (264 comprobaciones del motor).
