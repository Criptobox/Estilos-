# 12.9 · Tinta compone sola, con reglas de diseño

- **Motor de composición local** (`web/js/tinta-composer.js`): a partir de la idea detecta el sector y arma tres propuestas de pantalla distintas entre sí, con puntuación y reglas de diseño. Es determinista (la misma idea da las mismas propuestas), no usa red ni IA.
- Reglas que aplica: una acción principal clara, un solo acento coral, no dos bloques muy pesados a la vez, pantallas cortas, afinidad de cada bloque con el sector y coherencia de tono. Las propuestas solo incluyen pantallas sin avisos de diseño cuando hay alternativas.
- **Ayúdame a empezar** ahora usa los ocho sectores de Tinta (antes tres recetas fijas) y, en Bloques, aparece **↻ Otra propuesta** para cambiar entre las tres. Se conservan los bloques que ya elegiste.
- Datos de composición en `design-library/composition.json` (tono, acento, peso visual y afinidad por sector de 12 bloques de Tinta). `web/js/tinta-composition-data.js` se genera con `node tools/build-composition-data.cjs`; CI verifica que esté al día.
- Pruebas nuevas: `composer-engine.cjs` (reglas, determinismo, diversidad) y `composer-spec.cjs`.
