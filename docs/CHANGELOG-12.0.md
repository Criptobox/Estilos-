# Estilos 12.0 — nuevo aspecto (fase 1 de 3)

Basado en el preview aprobado (violeta → azul sobre azul noche, cristal, bordes con brillo).

## Sistema visual
- Tokens de color nuevos para oscuro y claro (`--grad`, `--glass-card`, `--nav-bg`, `--bd`, `--hero-grad`…); el resto de la interfaz los hereda.
- **Oscuro por defecto** (antes seguía al sistema). Automático, Claro y Oscuro siguen en Ajustes. `theme-color` y `manifest` actualizados.

## Navegación
- Barra inferior de cinco elementos con etiqueta y el activo en degradado: Inicio, Biblioteca, Creador, Plantillas y Colecciones (`aria-current` en el activo).
- Ajustes sale de la barra y pasa a la cabecera de Inicio, Biblioteca y Colecciones.

## Pantallas
- **Inicio**: título con degradado, buscador, cuatro accesos (Biblioteca, Creador, Plantillas, Colecciones) con cifras reales y «Recientes» (se guardan los últimos 8 estilos abiertos; sin historial, «Para empezar»).
- **Biblioteca** (nueva): cuadrícula de categorías con icono y degradado, recuento real y filtros Todo / Fundamentos (paletas, tipografía, fondos, iconos, animaciones, referencias) / Componentes.
- **Lista de una categoría**: chip «Todo» con todos los estilos; títulos y botones con el nuevo aspecto.
- **Colecciones**: antes «Guardados».
- Detalle, hojas, Ajustes y formularios heredan el nuevo aspecto.

## Pruebas
- 117 comprobaciones de extremo a extremo (13 nuevas de navegación: barra, Biblioteca, filtros, «Todo», Plantillas, Colecciones, Recientes y tema por defecto).

## Pendiente
- Fase 2: Creador móvil (lienzo siempre visible, herramientas con hojas desde abajo, capas y pantallas, exportar).
- Fase 3: Detalle con Variantes/Uso/Relacionados, Paletas y Tipografías con vistas propias, Plantillas, exportar PNG/SVG.
