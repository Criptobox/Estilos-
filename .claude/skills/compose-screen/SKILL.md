---
name: compose-screen
description: Arma una pantalla a partir de un brief usando solo bloques de la biblioteca de Estilos y la devuelve como ScreenSpec validada. Úsala para generar o probar pantallas de ejemplo.
---

# compose-screen

Del brief a una `ScreenSpec` que pasa la validación.

## Pasos

1. **Entender el brief:** sector, tono, pantallas pedidas y restricciones. Si falta algo que cambie el resultado, pregunta una vez.
2. **Elegir bloques** de `design-library/ai-metadata.json`. Solo cuentan los bloques que tienen metadatos. Lee `when_to_use` y `avoid_when` de cada candidato.
3. **Componer** respetando:
   - un encabezado como máximo, arriba; una navegación como máximo, abajo;
   - una acción principal por pantalla (`a-dark` y `a-coral` no conviven);
   - `max_per_screen` de cada bloque y los huecos obligatorios;
   - textos dentro de `max` caracteres;
   - los huecos con `parts` llevan varias líneas separadas por salto de línea;
   - cada bloque una sola vez por pantalla.
4. **Escribir `rationale`:** una frase concreta por bloque que explique por qué está.
5. **Guardar** en `ai/spec/examples/<nombre>.screen.json` con el formato de `ai/spec/screen-spec.schema.json`.
6. **Validar:** `node ai/tools/validate-ai.cjs`. Corrige hasta ver ✓. Para verla dibujada: `node ai/tools/spec-to-tinta.cjs <archivo> --out proyecto.json --shot captura.png` (el JSON se importa en Mis proyectos).
7. **Ofrecer tres variantes** distintas entre sí (por ejemplo distinta cabecera, tarjeta o acción) y decir en una línea qué cambia en cada una.

## Reglas

- Nunca uses un `ref` que no esté en el catálogo.
- Textos en español, naturales, sin relleno tipo "Lorem ipsum".
- Si ningún bloque sirve para una función, dilo y sugiere abrir un issue «Nuevo bloque» en vez de forzar uno.
