# 12.55 · Pruebas unitarias

Tercera parte de la revisión externa: la suite solo tenía pruebas de extremo a extremo (Playwright), lentas y que necesitan navegador. Ahora hay **26 pruebas unitarias con `node:test`**, sin dependencias nuevas y sin navegador, en `tests/unit/`.

| Archivo | Qué comprueba |
|---|---|
| `util.test.cjs` | `esc` (los cinco caracteres), `safeColor` (descarta inyecciones), `safeId`, contraste WCAG e `inkOn` |
| `contraste-paletas.test.cjs` | fórmula de contraste, 66 paletas válidas (19 oscuras) y texto legible sobre cada acento (≥ 4.5:1) |
| `sectores-plantillas.test.cjs` | detección de sectores con y sin acentos, 48 plantillas válidas y las reglas de `problems` (un encabezado, una barra, tarjetas, copias 2–6, sin repetidos) |
| `capas.test.cjs` | 20 fondos y 11 estilos visuales sin recursos externos, 41 ilustraciones seguras y las 17 categorías |
| `historial.test.cjs` | deshacer y rehacer, límite de pasos y presupuesto de bytes |
| `compartir.test.cjs` | enlace compartido de ida y vuelta, enlaces corruptos y copia de seguridad que no es JSON |

- Se ejecutan con `cd tests && npm run test:unit` y, en CI, como primer paso de `tests.yml` (antes de instalar Chromium), así un fallo de lógica se ve en segundos.
- Los módulos del navegador sin exportaciones se cargan en un contexto aislado de `vm` (`tests/unit/cargar.cjs`), sin tocar el código de la app.
- Quedan fuera de esta tanda: cobertura medida, el catálogo completo (necesita el navegador) y la regresión visual.
