---
name: compose-screen
description: Arma una pantalla a partir de un brief usando solo bloques de la biblioteca de Estilos y la devuelve como ScreenSpec validada. Úsala para generar o probar pantallas de ejemplo.
---

# compose-screen

Del brief a una `ScreenSpec` que pasa la validación.

## Pasos

1. **Entender el brief:** sector, tono, pantallas pedidas y restricciones. Si falta algo que cambie el resultado, pregunta una vez.
1b. **Ver qué propone el motor de Tinta:** `node composer/tools/propose.cjs "<idea>"`. Es la línea base: parte de ahí y mejora solo si tienes una razón de diseño concreta.
2. **Elegir bloques** de `design-library/composition.json`. Solo cuentan los bloques que tienen metadatos. Lee `when_to_use` y `avoid_when` de cada candidato.
3. **Componer** respetando (el motor aplica estas reglas con `lint`):
   - un encabezado como máximo, arriba; una navegación como máximo, abajo;
   - una acción principal por pantalla (`a-dark` y `a-coral` no conviven);
   - `max_per_screen` de cada bloque y los huecos obligatorios;
   - textos dentro de `max` caracteres;
   - los huecos con `parts` llevan varias líneas separadas por salto de línea;
   - cada bloque una sola vez por pantalla.
4. **Escribir `rationale`:** una frase concreta por bloque que explique por qué está.
5. **Guardar** en `composer/spec/examples/<nombre>.screen.json` con el formato de `composer/spec/screen-spec.schema.json`.
6. **Validar:** `node composer/tools/validate-composer.cjs`. Corrige hasta ver ✓. Para verla dibujada: `node composer/tools/spec-to-tinta.cjs <archivo> --out proyecto.json --shot captura.png` (el JSON se importa en Mis proyectos).
7. **Ofrecer tres variantes** distintas entre sí (por ejemplo distinta cabecera, tarjeta o acción) y decir en una línea qué cambia en cada una.

## Reglas

- Nunca uses un `ref` que no esté en el catálogo.
- Textos en español, naturales, sin relleno tipo "Lorem ipsum".
- Si ningún bloque sirve para una función, dilo y sugiere abrir un issue «Nuevo bloque» en vez de forzar uno.
