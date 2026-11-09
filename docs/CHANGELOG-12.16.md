# 12.16 · Banco de pruebas del motor y mejor detección de sector

- **Banco de pruebas del motor** (`composer/tools/eval-engine.cjs`): mide con 42 briefs el sector y el tipo detectados, las propuestas sin avisos, la diferencia entre propuestas, el encaje con el sector, los textos que llegan y el tiempo. Separa `dev` (ideas que guiaron ajustes) de `holdout` (ideas nuevas), y la cifra que cuenta es la del holdout. Guía en `composer/evals/README.md`.
- Una prueba nueva (`tests/composer-evals.cjs`) falla si el holdout baja de los umbrales o si alguna métrica baja respecto a la línea base guardada. La comprobé rompiendo el vocabulario a propósito.
- **Mejor reconocimiento de ideas**: «receta» y «cocina» (comida), «supermercado», «mercado» y «marketplace» (tienda), «escapada» y «escapadas» (viajes). Mejora el sector detectado del 90 % al 97,6 % en los briefs.
- Primera medición: sector detectado 96,7 % y textos del sector 83,3 % en el holdout; 19 de los 51 bloques descritos no los usa ningún brief. «Librería» aún no se reconoce como tienda (hallazgo abierto).
