# Estilos 10.9 — Auditoría y correcciones de integración

- Corregido el historial para sincronizar el estado de la pantalla activa antes de capturar o restaurar.
- Corregida la creación de una nueva rama después de deshacer: ahora el siguiente cambio también puede deshacerse.
- Añadidos límites de memoria al historial (máximo 60 estados, presupuesto total de 12 millones de caracteres y límite por estado).
- Si el proyecto excede el tamaño admitido por el historial, se evita almacenar copias excesivas y se informa al usuario.
- Revisada la integración de carpetas, bloqueo, visibilidad, edición directa, imágenes, exportación y accesos móviles.
- Pruebas aisladas de secuencia: cambio → deshacer → nueva rama → deshacer/rehacer y sincronización de pantalla activa.
- Validación de sintaxis JavaScript y estructura HTML del paquete.
