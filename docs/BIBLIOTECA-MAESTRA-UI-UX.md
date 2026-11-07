# Biblioteca maestra de diseño UI/UX para aplicaciones y páginas web

**Versión:** 1.0\
**Propósito:** servir como catálogo organizado, guía de inventario y
especificación para construir una biblioteca reutilizable de diseño para
apps móviles, aplicaciones web y sitios web.

------------------------------------------------------------------------

## Cómo utilizar este documento

La biblioteca se divide en módulos independientes. Cada módulo puede
desarrollarse, almacenarse, buscarse y ampliarse por separado.

### Tipos de recursos

-   **Elemento:** pieza individual de interfaz, por ejemplo un botón.
-   **Variante:** una versión visual o funcional del mismo elemento, por
    ejemplo botón primario, outline o con icono.
-   **Estado:** condición del elemento, por ejemplo normal, activo,
    deshabilitado o cargando.
-   **Patrón:** combinación de varios elementos que resuelve una tarea,
    por ejemplo un formulario de inicio de sesión.
-   **Plantilla:** composición de una pantalla o sección completa.
-   **Sistema visual:** conjunto coherente de reglas de color,
    tipografía, formas, espaciado, superficies e iconografía.
-   **Recurso:** archivo reutilizable como SVG, imagen, fuente,
    animación o fragmento de código.

### Ficha estándar para registrar cada recurso

Cada elemento de la biblioteca debe tener, cuando corresponda:

  -----------------------------------------------------------------------
  Campo                               Descripción
  ----------------------------------- -----------------------------------
  ID                                  Identificador único y estable

  Nombre                              Nombre claro del recurso

  Módulo                              Categoría principal

  Subcategoría                        Clasificación específica

  Tipo                                Elemento, variante, patrón,
                                      plantilla o recurso

  Vista previa                        Imagen o demostración interactiva

  Descripción                         Qué hace y cuándo se utiliza

  Variantes                           Versiones disponibles

  Estados                             Normal, hover, focus, active,
                                      disabled, loading, error, success

  Propiedades                         Tamaño, color, radio, espaciado,
                                      alineación, etc.

  Responsive                          Comportamiento móvil, tablet y
                                      escritorio

  Accesibilidad                       Contraste, teclado, etiquetas y
                                      foco

  Código                              HTML, CSS, JavaScript, React y/o
                                      Tailwind

  Dependencias                        Librerías o recursos necesarios

  Etiquetas                           Palabras clave para búsqueda

  Versión                             Número de versión

  Licencia                            Procedencia y condiciones de uso
  -----------------------------------------------------------------------

### Reglas para evitar duplicados

1.  Un diseño base debe tener un único registro principal.
2.  Las diferencias pequeñas se guardan como variantes, no como recursos
    nuevos.
3.  Las diferencias de estructura o comportamiento justifican un
    elemento independiente.
4.  Las capturas de referencia no sustituyen al código funcional.
5.  Cada recurso debe tener una vista previa propia y verificable.
6.  Registrar autor, fuente o licencia cuando se conozcan.
7.  No guardar diez copias del mismo componente con nombres diferentes.

------------------------------------------------------------------------

# MÓDULO 01 --- Botones y acciones

## 1.1 Tipos de botones

-   Primary / principal.
-   Secondary / secundario.
-   Tertiary.
-   Text button.
-   Ghost.
-   Outline.
-   Filled.
-   Tonal.
-   Elevated.
-   Gradient.
-   Glass.
-   Neon.
-   Destructive.
-   Floating Action Button (FAB).
-   Extended FAB.
-   Icon button.
-   Split button.
-   Dropdown button.
-   Segmented button.
-   Social login button.
-   Payment button.
-   Download button.
-   Upload button.
-   Share button.
-   Copy button.
-   Play / pause.
-   Media controls.
-   Navigation action.
-   Sticky action.
-   Full-width button.
-   Compact button.
-   Circular button.
-   Pill button.

## 1.2 Formas

-   Rectangular.
-   Rectangular con esquinas suaves.
-   Redondeado.
-   Pill / cápsula.
-   Circular.
-   Cuadrado.
-   Asimétrico.
-   Con borde.
-   Sin borde.
-   Con fondo transparente.

## 1.3 Contenido

-   Solo texto.
-   Solo icono.
-   Icono a la izquierda.
-   Icono a la derecha.
-   Icono arriba.
-   Icono abajo.
-   Texto + indicador.
-   Texto + contador.
-   Texto + avatar.
-   Texto + flecha.
-   Texto + estado.
-   Texto + spinner.

## 1.4 Estados

-   Default.
-   Hover.
-   Focus visible.
-   Pressed.
-   Active.
-   Selected.
-   Disabled.
-   Loading.
-   Success.
-   Error.
-   Pending.

## 1.5 Propiedades configurables

-   Alto y ancho.
-   Padding horizontal y vertical.
-   Radio de esquina.
-   Color de fondo.
-   Color del texto.
-   Color del icono.
-   Borde y grosor.
-   Sombra.
-   Tipografía y peso.
-   Separación entre icono y texto.
-   Opacidad.
-   Animación al pulsar.
-   Área táctil.
-   Comportamiento responsive.

## 1.6 Usos habituales

-   Confirmar una acción.
-   Navegar a otra pantalla.
-   Comprar o pagar.
-   Guardar cambios.
-   Crear contenido.
-   Descargar archivos.
-   Compartir.
-   Eliminar o cancelar.
-   Ejecutar una herramienta.

------------------------------------------------------------------------

# MÓDULO 02 --- Tarjetas, paneles y contenedores

## 2.1 Tarjetas por función

-   Information card.
-   Product card.
-   Service card.
-   Pricing card.
-   Subscription card.
-   Profile card.
-   User card.
-   Statistics card.
-   KPI card.
-   Financial card.
-   Payment card.
-   Transaction card.
-   Promotion card.
-   Notification card.
-   Message card.
-   Article card.
-   Blog card.
-   Portfolio card.
-   Project card.
-   Task card.
-   File card.
-   Media card.
-   Music card.
-   Video card.
-   Location card.
-   Weather card.
-   Review card.
-   Testimonial card.
-   Feature card.
-   Comparison card.
-   Dashboard card.
-   Empty-state card.

## 2.2 Estructuras de tarjeta

-   Imagen superior + contenido.
-   Imagen lateral + contenido.
-   Icono + texto.
-   Título + descripción.
-   Métrica + variación.
-   Avatar + información.
-   Precio + beneficios + acción.
-   Imagen de fondo + superposición.
-   Contenido expandible.
-   Tarjeta apilada.
-   Tarjeta horizontal.
-   Tarjeta vertical.
-   Tarjeta compacta.
-   Tarjeta de ancho completo.
-   Tarjeta flotante.
-   Tarjeta dividida en secciones.

## 2.3 Estilos

-   Flat.
-   Elevated.
-   Outlined.
-   Filled.
-   Glassmorphism.
-   Neumorphism.
-   Gradient.
-   Dark surface.
-   Light surface.
-   Image overlay.
-   3D.
-   Border glow.
-   Soft shadow.
-   High contrast.

## 2.4 Estados y comportamiento

-   Normal.
-   Hover.
-   Selected.
-   Expanded.
-   Collapsed.
-   Loading.
-   Disabled.
-   Dragging.
-   Pressed.
-   Favorito.
-   Marcado.
-   Actualizado.

## 2.5 Propiedades

-   Fondo.
-   Radio.
-   Borde.
-   Sombra.
-   Padding.
-   Gap.
-   Elevación.
-   Imagen.
-   Proporción.
-   Alineación.
-   Número de columnas.
-   Acción al pulsar.
-   Comportamiento en móvil.

------------------------------------------------------------------------

# MÓDULO 03 --- Formularios y entradas de datos

## 3.1 Campos de entrada

-   Text input.
-   Email input.
-   Password input.
-   Search input.
-   Number input.
-   Telephone input.
-   URL input.
-   Date input.
-   Time input.
-   Date-time input.
-   Textarea.
-   OTP input.
-   PIN input.
-   Currency input.
-   Masked input.
-   Code editor input.
-   Multiline input.

## 3.2 Selectores

-   Select simple.
-   Select múltiple.
-   Dropdown.
-   Autocomplete.
-   Combobox.
-   Searchable select.
-   Country selector.
-   Language selector.
-   Timezone selector.
-   Color picker.
-   Date picker.
-   Date range picker.
-   Time picker.
-   File picker.
-   Image picker.
-   Emoji picker.
-   Icon picker.
-   Font picker.

## 3.3 Controles

-   Checkbox.
-   Radio button.
-   Toggle switch.
-   Segmented control.
-   Slider.
-   Range slider.
-   Stepper.
-   Quantity selector.
-   Rating selector.
-   Tag input.
-   Chip selector.
-   Multi-select chips.
-   Upload dropzone.

## 3.4 Formularios completos

-   Login.
-   Registro.
-   Recuperar contraseña.
-   Verificación OTP.
-   Perfil.
-   Dirección.
-   Pago.
-   Suscripción.
-   Contacto.
-   Búsqueda avanzada.
-   Filtros.
-   Configuración.
-   Formulario multipaso.
-   Encuesta.
-   Reserva.
-   Checkout.

## 3.5 Validaciones y mensajes

-   Campo obligatorio.
-   Formato incorrecto.
-   Contraseña débil.
-   Contraseña válida.
-   Datos duplicados.
-   Error del servidor.
-   Límite superado.
-   Archivo no permitido.
-   Carga correcta.
-   Guardado correcto.
-   Ayuda contextual.
-   Contador de caracteres.

## 3.6 Requisitos de calidad

-   Etiquetas visibles.
-   Mensajes comprensibles.
-   Navegación por teclado.
-   Foco visible.
-   Autocompletado correcto.
-   Errores asociados al campo.
-   No depender solo del color.
-   Adaptación a pantallas pequeñas.

------------------------------------------------------------------------

# MÓDULO 04 --- Navegación

## 4.1 Navegación móvil

-   Bottom navigation.
-   Floating bottom bar.
-   Tab bar.
-   Navigation drawer.
-   Sidebar móvil.
-   Menú hamburguesa.
-   Menú radial.
-   Menú contextual.
-   Navegación por gestos.
-   Barra inferior expandible.
-   Barra inferior con indicador.
-   Barra inferior con FAB.
-   Navegación por pasos.

## 4.2 Navegación web

-   Navbar horizontal.
-   Navbar vertical.
-   Navbar transparente.
-   Navbar sticky.
-   Navbar fija.
-   Navbar flotante.
-   Sidebar fija.
-   Sidebar colapsable.
-   Mega menu.
-   Dropdown menu.
-   Context menu.
-   Breadcrumbs.
-   Pagination.
-   Tabs horizontales.
-   Tabs verticales.
-   Subnavigation.
-   Table of contents.

## 4.3 Encabezados

-   Header clásico.
-   Header minimalista.
-   Header con búsqueda.
-   Header con perfil.
-   Header con notificaciones.
-   Header con acciones.
-   Header transparente.
-   Header con gradiente.
-   Header con imagen.
-   Header dinámico.
-   Header compacto al hacer scroll.
-   Header móvil.

## 4.4 Pies de página

-   Footer simple.
-   Footer corporativo.
-   Footer por columnas.
-   Footer con redes sociales.
-   Footer con newsletter.
-   Footer móvil.
-   Footer expandible.
-   Footer legal.
-   Footer de tienda.
-   Footer de documentación.

## 4.5 Estados de navegación

-   Ruta activa.
-   Ruta deshabilitada.
-   Elemento seleccionado.
-   Elemento con notificación.
-   Menú abierto.
-   Menú cerrado.
-   Submenú expandido.
-   Navegación cargando.

------------------------------------------------------------------------

# MÓDULO 05 --- Barras, indicadores y controles de estado

## 5.1 Progreso y carga

-   Linear progress.
-   Circular progress.
-   Determinate progress.
-   Indeterminate progress.
-   Loading bar.
-   Step progress.
-   Multi-step progress.
-   Skeleton loader.
-   Spinner.
-   Dots loader.
-   Wave loader.
-   Shimmer loader.
-   Upload progress.
-   Download progress.

## 5.2 Indicadores de estado

-   Online / offline.
-   Disponible / ocupado.
-   Éxito.
-   Error.
-   Advertencia.
-   Información.
-   Sincronización.
-   Conexión.
-   Batería.
-   Almacenamiento.
-   Salud del sistema.
-   Estado de pedido.
-   Estado de pago.
-   Estado de tarea.

## 5.3 Controles

-   Toggle.
-   Slider.
-   Range slider.
-   Volume control.
-   Brightness control.
-   Speed control.
-   Zoom control.
-   Rating stars.
-   Counter.
-   Scroll indicator.
-   Page indicator.
-   Carousel indicator.
-   Audio waveform.
-   Timeline scrubber.

## 5.4 Variantes

-   Lineal.
-   Circular.
-   Segmentada.
-   Con porcentaje.
-   Con etiqueta.
-   Con icono.
-   Con animación.
-   Compacta.
-   Vertical.
-   Horizontal.

------------------------------------------------------------------------

# MÓDULO 06 --- Avatares, ilustraciones e identidad gráfica

## 6.1 Avatares

-   Avatar fotográfico.
-   Avatar ilustrado.
-   Avatar 3D.
-   Avatar geométrico.
-   Avatar minimalista.
-   Avatar pixel art.
-   Avatar animado.
-   Avatar animal.
-   Avatar abstracto.
-   Avatar profesional.
-   Avatar gaming.
-   Avatar de IA.
-   Avatar de asistente.
-   Avatar de grupo.
-   Avatar con iniciales.

## 6.2 Variantes de avatar

-   Circular.
-   Cuadrado.
-   Rounded square.
-   Con borde.
-   Con estado online.
-   Con insignia.
-   Con nivel.
-   Con marco.
-   Con fondo personalizado.
-   Con animación.
-   Con indicador de actividad.

## 6.3 Ilustraciones

-   Hero illustrations.
-   Ilustraciones de onboarding.
-   Ilustraciones de funciones.
-   Ilustraciones de estados vacíos.
-   Ilustraciones de error.
-   Ilustraciones de éxito.
-   Ilustraciones educativas.
-   Ilustraciones comerciales.
-   Ilustraciones isométricas.
-   Ilustraciones 3D.
-   Ilustraciones lineales.
-   Ilustraciones flat.
-   Ilustraciones abstractas.

## 6.4 Otros recursos gráficos

-   Logotipos.
-   Mascotas digitales.
-   Personajes.
-   Stickers.
-   Emojis.
-   Badges ilustrados.
-   Texturas.
-   Patrones.
-   Formas geométricas.
-   Decoraciones.
-   Mockups.
-   Fotografías.
-   Fondos abstractos.
-   Marcas de agua.

------------------------------------------------------------------------

# MÓDULO 07 --- Tipografías y sistemas de texto

## 7.1 Familias tipográficas

-   Sans Serif.
-   Serif.
-   Slab Serif.
-   Display.
-   Monospace.
-   Rounded.
-   Geométricas.
-   Humanistas.
-   Condensadas.
-   Expandidas.
-   Variable fonts.
-   Handwritten.
-   Script.
-   Pixel.
-   Futuristas.

## 7.2 Escala tipográfica

-   Display XL.
-   Display Large.
-   Display Medium.
-   H1.
-   H2.
-   H3.
-   H4.
-   H5.
-   H6.
-   Subtitle Large.
-   Subtitle.
-   Body Large.
-   Body Medium.
-   Body Small.
-   Caption.
-   Overline.
-   Label.
-   Button.
-   Numeric.
-   Code.

## 7.3 Propiedades

-   Familia.
-   Peso.
-   Tamaño.
-   Altura de línea.
-   Espaciado entre letras.
-   Transformación.
-   Alineación.
-   Decoración.
-   Ancho de texto.
-   Número de líneas.
-   Truncamiento.
-   Escalado fluido.
-   Soporte de caracteres.
-   Licencia.

## 7.4 Combinaciones

-   Sans + Sans.
-   Serif + Sans.
-   Display + Sans.
-   Monospace + Sans.
-   Una sola familia con varios pesos.
-   Combinaciones editoriales.
-   Combinaciones corporativas.
-   Combinaciones tecnológicas.
-   Combinaciones de lujo.

------------------------------------------------------------------------

# MÓDULO 08 --- Colores, paletas y gradientes

## 8.1 Familias de paletas

-   Monocromática.
-   Complementaria.
-   Análoga.
-   Triádica.
-   Tetrádica.
-   Pastel.
-   Neón.
-   Oscura.
-   Clara.
-   Minimalista.
-   Corporativa.
-   Fintech.
-   Gaming.
-   Tecnológica.
-   Natural.
-   Retro.
-   Cyberpunk.
-   Lujo.
-   Editorial.
-   Infantil.

## 8.2 Tokens semánticos

-   Primary.
-   Primary hover.
-   Primary active.
-   Secondary.
-   Accent.
-   Background.
-   Surface.
-   Surface elevated.
-   Text primary.
-   Text secondary.
-   Text muted.
-   Border.
-   Divider.
-   Success.
-   Warning.
-   Error.
-   Info.
-   Focus.
-   Overlay.
-   Scrim.

## 8.3 Gradientes

-   Linear gradient.
-   Radial gradient.
-   Conic gradient.
-   Mesh gradient.
-   Duotone.
-   Multicolor.
-   Gradient border.
-   Gradient text.
-   Gradient overlay.
-   Gradient background.
-   Animated gradient.

## 8.4 Modos y accesibilidad

-   Light theme.
-   Dark theme.
-   High contrast.
-   Dimmed theme.
-   Automatic theme.
-   Color tokens por tema.
-   Contraste de texto.
-   Contraste de controles.
-   Estados no dependientes solo del color.

## 8.5 Datos que debe guardar cada color

-   Nombre.
-   HEX.
-   RGB.
-   HSL.
-   OKLCH, si se utiliza.
-   Rol semántico.
-   Tema.
-   Contraste con texto.
-   Variantes claras y oscuras.
-   Fuente o autor de la paleta.

------------------------------------------------------------------------

# MÓDULO 09 --- Iconografía

## 9.1 Estilos

-   Line icons.
-   Outline.
-   Filled.
-   Duotone.
-   Two-tone.
-   Rounded.
-   Sharp.
-   Minimal.
-   Geometric.
-   3D.
-   Isometric.
-   Animated.
-   Pixel icons.
-   Hand-drawn.

## 9.2 Categorías

-   Navegación.
-   Acciones.
-   Comunicación.
-   Usuario.
-   Seguridad.
-   Finanzas.
-   Comercio.
-   Archivos.
-   Multimedia.
-   Configuración.
-   Desarrollo.
-   IA.
-   Redes sociales.
-   Ubicación.
-   Tiempo.
-   Salud.
-   Transporte.
-   Estados.
-   Dispositivos.

## 9.3 Propiedades

-   Tamaño.
-   Grosor de trazo.
-   Color.
-   Relleno.
-   Radio.
-   Alineación.
-   Área táctil.
-   Estado.
-   Animación.
-   Nombre accesible.
-   Fuente del icono.
-   Licencia.

------------------------------------------------------------------------

# MÓDULO 10 --- Layouts y composición

## 10.1 Sistemas de distribución

-   Grid.
-   Flexbox.
-   CSS columns.
-   Masonry.
-   Bento grid.
-   CSS subgrid.
-   Absolute positioning.
-   Sticky layout.
-   Fixed layout.
-   Fluid layout.

## 10.2 Estructuras de pantalla

-   Single column.
-   Two columns.
-   Multi-column.
-   Sidebar + content.
-   Header + content + footer.
-   Split screen.
-   Full screen.
-   Dashboard.
-   Master-detail.
-   List-detail.
-   Card grid.
-   Feed.
-   Gallery.
-   Editorial.
-   Asymmetric.
-   Modular.
-   Layered.
-   Floating panels.
-   Canvas workspace.

## 10.3 Composiciones

-   Imagen + texto.
-   Texto + imagen.
-   Texto sobre imagen.
-   Tarjetas apiladas.
-   Bloques alternados.
-   Contenido centrado.
-   Contenido alineado a izquierda.
-   Composición diagonal.
-   Composición asimétrica.
-   Composición por módulos.
-   Composición con superposición.

## 10.4 Reglas de layout

-   Ancho máximo.
-   Ancho mínimo.
-   Columnas.
-   Gutter.
-   Márgenes.
-   Padding.
-   Gap.
-   Alineación.
-   Orden de lectura.
-   Flujo del contenido.
-   Overflow.
-   Scroll.
-   Puntos de ruptura.

------------------------------------------------------------------------

# MÓDULO 11 --- Pantallas completas de aplicaciones

Cada pantalla debe existir como plantilla independiente, con vista
previa, variantes y componentes identificados.

## 11.1 Acceso y bienvenida

-   Splash screen.
-   Welcome screen.
-   Onboarding 1, 2 y 3.
-   Introducción de funciones.
-   Selección de idioma.
-   Selección de tema.
-   Permisos.
-   Login.
-   Registro.
-   Recuperar contraseña.
-   Restablecer contraseña.
-   Verificación por email.
-   Verificación OTP.
-   Autenticación biométrica.
-   Selección de cuenta.

## 11.2 Inicio y navegación principal

-   Home.
-   Dashboard.
-   Feed.
-   Explorar.
-   Categorías.
-   Búsqueda.
-   Resultados.
-   Recomendaciones.
-   Favoritos.
-   Recientes.
-   Historial.

## 11.3 Contenido y detalle

-   Detalle de producto.
-   Detalle de servicio.
-   Detalle de artículo.
-   Detalle de proyecto.
-   Detalle de archivo.
-   Detalle de usuario.
-   Detalle de publicación.
-   Galería.
-   Visor multimedia.
-   Comentarios.
-   Reseñas.
-   Compartir.

## 11.4 Comercio y pagos

-   Catálogo.
-   Carrito.
-   Checkout.
-   Dirección de envío.
-   Método de pago.
-   Confirmación de pago.
-   Historial de compras.
-   Seguimiento de pedido.
-   Factura.
-   Suscripciones.
-   Planes.
-   Renovación.
-   Cancelación.
-   Reembolsos.

## 11.5 Comunicación

-   Lista de conversaciones.
-   Chat.
-   Chat grupal.
-   Mensajes.
-   Bandeja de entrada.
-   Notificaciones.
-   Centro de actividad.
-   Comentarios.
-   Llamadas.
-   Contactos.

## 11.6 Cuenta y configuración

-   Perfil.
-   Editar perfil.
-   Seguridad.
-   Privacidad.
-   Preferencias.
-   Idioma.
-   Tema.
-   Notificaciones.
-   Dispositivos.
-   Sesiones activas.
-   Ayuda.
-   Soporte.
-   Acerca de.
-   Términos.
-   Política de privacidad.

## 11.7 Gestión y productividad

-   Calendario.
-   Tareas.
-   Proyectos.
-   Archivos.
-   Carpetas.
-   Subidas.
-   Descargas.
-   Estadísticas.
-   Reportes.
-   Panel administrativo.
-   Gestión de usuarios.
-   Roles y permisos.

## 11.8 Estados de pantalla

-   Loading.
-   Skeleton.
-   Empty state.
-   Error.
-   Sin conexión.
-   Sin resultados.
-   Éxito.
-   Permiso denegado.
-   Mantenimiento.
-   Contenido bloqueado.
-   Sesión expirada.
-   Actualización requerida.

------------------------------------------------------------------------

# MÓDULO 12 --- Secciones y bloques para páginas web

## 12.1 Navegación y cabecera

-   Navbar.
-   Mega menu.
-   Header fijo.
-   Header transparente.
-   Header con CTA.
-   Barra de anuncios.
-   Breadcrumbs.
-   Subnavigation.

## 12.2 Secciones comerciales

-   Hero.
-   Hero con imagen.
-   Hero con vídeo.
-   Hero dividido.
-   Hero centrado.
-   Hero con formulario.
-   Propuesta de valor.
-   Beneficios.
-   Características.
-   Servicios.
-   Productos.
-   Soluciones.
-   Casos de uso.
-   Casos de éxito.
-   Estadísticas.
-   Comparativa.
-   Pricing.
-   Planes.
-   Testimonios.
-   Reseñas.
-   Logos de clientes.
-   Partners.
-   Equipo.
-   Portfolio.
-   Galería.
-   FAQ.
-   Newsletter.
-   CTA.
-   Contacto.
-   Footer.

## 12.3 Secciones editoriales

-   Listado de artículos.
-   Artículo destacado.
-   Categorías.
-   Autor.
-   Fecha y lectura.
-   Índice del artículo.
-   Artículos relacionados.
-   Comentarios.
-   Compartir.
-   Búsqueda editorial.

## 12.4 Secciones de confianza

-   Certificaciones.
-   Seguridad.
-   Garantías.
-   Políticas.
-   Preguntas frecuentes.
-   Reseñas verificadas.
-   Logos de clientes.
-   Métricas verificables.
-   Información de contacto.

------------------------------------------------------------------------

# MÓDULO 13 --- Estilos visuales y lenguajes de diseño

Cada estilo debe tener una ficha con paleta, tipografía, radios,
sombras, iconos, componentes, layouts, ejemplos y reglas de uso.

## 13.1 Estilos de interfaz

-   Minimalismo.
-   Flat Design.
-   Material Design.
-   Material You.
-   Fluent Design.
-   iOS-inspired.
-   Swiss Design.
-   Editorial.
-   Corporate.
-   Luxury.
-   Playful.
-   Industrial.
-   Organic UI.
-   Soft UI.
-   Neumorphism.
-   Glassmorphism.
-   Claymorphism.
-   Skeuomorphism.
-   Brutalism.
-   Neo-brutalism.
-   3D UI.
-   Liquid UI.
-   Futuristic UI.
-   Dashboard Tech.

## 13.2 Estéticas temáticas

-   Cyberpunk.
-   Y2K.
-   Vaporwave.
-   Synthwave.
-   Retro.
-   Vintage.
-   Arcade.
-   Gaming.
-   Sci-fi.
-   Nature.
-   Botanical.
-   Pastel.
-   Monochrome.
-   Dark luxury.
-   Editorial fashion.
-   Industrial tech.
-   Organic shapes.
-   Art deco.
-   Bauhaus.

## 13.3 Ficha de cada estilo

-   Nombre.
-   Descripción.
-   Sensación que transmite.
-   Paleta recomendada.
-   Tipografías.
-   Formas.
-   Radios.
-   Bordes.
-   Sombras.
-   Texturas.
-   Iconografía.
-   Botones.
-   Tarjetas.
-   Inputs.
-   Navegación.
-   Layouts.
-   Animaciones.
-   Ejemplos de uso.
-   Estilos con los que combina.
-   Estilos con los que no conviene mezclarlo.

------------------------------------------------------------------------

# MÓDULO 14 --- Animaciones, transiciones y microinteracciones

## 14.1 Animaciones de entrada y salida

-   Fade in / out.
-   Slide in / out.
-   Scale in / out.
-   Zoom.
-   Reveal.
-   Clip reveal.
-   Blur in / out.
-   Rotate in / out.
-   Flip.
-   Expand.
-   Collapse.

## 14.2 Movimiento

-   Bounce.
-   Elastic.
-   Spring.
-   Pulse.
-   Shake.
-   Wiggle.
-   Rotate.
-   Float.
-   Parallax.
-   Scroll reveal.
-   Stagger.
-   Morph.
-   Follow cursor.
-   Magnetic effect.

## 14.3 Microinteracciones

-   Botón al pulsar.
-   Tarjeta al seleccionar.
-   Icono al activar.
-   Toggle animado.
-   Checkbox animado.
-   Favorito.
-   Añadir al carrito.
-   Copiar al portapapeles.
-   Descargar.
-   Enviar formulario.
-   Validación.
-   Notificación.
-   Cambio de tema.
-   Cambio de pestaña.
-   Menú desplegable.
-   Pull to refresh.
-   Swipe actions.

## 14.4 Animaciones de carga

-   Spinner.
-   Dots.
-   Wave.
-   Skeleton.
-   Shimmer.
-   Progress.
-   Logo loading.
-   Circular loading.
-   Lottie loading.
-   Indicador de escritura.

## 14.5 Transiciones de navegación

-   Page fade.
-   Slide page.
-   Shared element.
-   Modal transition.
-   Drawer transition.
-   Tab transition.
-   Bottom sheet.
-   Hero transition.
-   Crossfade.

## 14.6 Propiedades técnicas

-   Duración.
-   Delay.
-   Easing.
-   Spring stiffness.
-   Damping.
-   Direction.
-   Iterations.
-   Fill mode.
-   Trigger.
-   Reduced motion.
-   Rendimiento.
-   Compatibilidad.

------------------------------------------------------------------------

# MÓDULO 15 --- Efectos visuales y superficies

## 15.1 Estilos de superficie

-   Flat.
-   Elevated.
-   Outlined.
-   Transparent.
-   Frosted glass.
-   Glassmorphism.
-   Neumorphism.
-   Clay.
-   3D.
-   Metallic.
-   Glossy.
-   Matte.
-   Textured.

## 15.2 Efectos

-   Blur.
-   Backdrop blur.
-   Glow.
-   Neon glow.
-   Drop shadow.
-   Inner shadow.
-   Long shadow.
-   Gradient mesh.
-   Noise.
-   Grain.
-   Texture overlay.
-   Reflection.
-   Light sweep.
-   Border glow.
-   Color overlay.
-   Blend modes.
-   Masking.
-   Clipping.
-   Glass refraction simulation.

## 15.3 Fondos

-   Color sólido.
-   Gradiente.
-   Gradiente animado.
-   Imagen.
-   Vídeo.
-   Patrón.
-   Textura.
-   Noise.
-   Mesh.
-   Abstracto.
-   Geométrico.
-   Ilustrado.
-   3D.
-   Parallax.

------------------------------------------------------------------------

# MÓDULO 16 --- Multimedia y contenido visual

## 16.1 Imágenes

-   Image card.
-   Gallery.
-   Masonry gallery.
-   Carousel.
-   Slider.
-   Lightbox.
-   Image zoom.
-   Before / after.
-   Image comparison.
-   Image cropper.
-   Avatar uploader.
-   Image placeholder.
-   Responsive image.
-   Background image.
-   Masked image.

## 16.2 Vídeo

-   Video player.
-   Video thumbnail.
-   Video gallery.
-   Background video.
-   Picture in picture.
-   Captions.
-   Playback controls.
-   Progress timeline.
-   Quality selector.
-   Fullscreen.

## 16.3 Audio

-   Audio player.
-   Waveform.
-   Playlist.
-   Track card.
-   Volume control.
-   Playback speed.
-   Equalizer.
-   Recording control.
-   Audio visualizer.

## 16.4 Archivos

-   File upload.
-   Dropzone.
-   File preview.
-   File list.
-   File grid.
-   Download item.
-   Upload queue.
-   File status.
-   File type icon.
-   Storage usage.

------------------------------------------------------------------------

# MÓDULO 17 --- Gráficos, tablas y visualización de datos

## 17.1 Gráficos

-   Bar chart.
-   Stacked bar chart.
-   Grouped bar chart.
-   Line chart.
-   Area chart.
-   Stacked area.
-   Pie chart.
-   Donut chart.
-   Radar chart.
-   Scatter plot.
-   Bubble chart.
-   Heatmap.
-   Treemap.
-   Funnel chart.
-   Waterfall chart.
-   Candlestick chart.
-   Sparkline.
-   Gauge.
-   Progress chart.

## 17.2 Tablas

-   Tabla simple.
-   Tabla ordenable.
-   Tabla filtrable.
-   Tabla con búsqueda.
-   Tabla seleccionable.
-   Tabla editable.
-   Tabla expandible.
-   Tabla agrupada.
-   Tabla paginada.
-   Tabla responsive.
-   Tabla comparativa.
-   Tabla con acciones.

## 17.3 Indicadores

-   KPI.
-   Variación porcentual.
-   Tendencia.
-   Ranking.
-   Score.
-   Goal progress.
-   Conversion rate.
-   Activity metrics.
-   Revenue metrics.
-   Retention metrics.

## 17.4 Requisitos

-   Leyenda.
-   Ejes.
-   Unidades.
-   Formato numérico.
-   Tooltips.
-   Estados vacíos.
-   Accesibilidad.
-   Adaptación móvil.
-   Fuente de los datos.
-   Fecha de actualización.

------------------------------------------------------------------------

# MÓDULO 18 --- Diseño responsive y adaptabilidad

## 18.1 Dispositivos

-   Móvil pequeño.
-   Móvil estándar.
-   Móvil grande.
-   Móvil plegable.
-   Tablet vertical.
-   Tablet horizontal.
-   Laptop.
-   Desktop.
-   Wide desktop.
-   Ultra-wide.

## 18.2 Estrategias

-   Mobile first.
-   Desktop first.
-   Fluid design.
-   Adaptive layout.
-   Responsive grid.
-   Container queries.
-   Fluid typography.
-   Responsive images.
-   Responsive navigation.
-   Reordering.
-   Progressive disclosure.

## 18.3 Puntos de ruptura

Definir breakpoints según el contenido y no únicamente según modelos
concretos de dispositivos.

-   Small.
-   Medium.
-   Large.
-   Extra large.
-   Custom.

Registrar para cada breakpoint:

-   Ancho mínimo.
-   Columnas.
-   Márgenes.
-   Gutter.
-   Tamaño de texto.
-   Navegación.
-   Visibilidad de elementos.
-   Orden de bloques.
-   Comportamiento de imágenes.

## 18.4 Experiencia táctil

-   Áreas táctiles suficientes.
-   Separación entre acciones.
-   Gestos comprensibles.
-   Scroll natural.
-   Evitar hover como única interacción.
-   Teclado móvil adecuado.
-   Safe areas.
-   Orientación vertical y horizontal.
-   Acciones alcanzables con una mano.

------------------------------------------------------------------------

# MÓDULO 19 --- Accesibilidad y UX

## 19.1 Accesibilidad

-   Contraste de texto.
-   Contraste de componentes.
-   Navegación por teclado.
-   Foco visible.
-   Lectores de pantalla.
-   Etiquetas accesibles.
-   Texto alternativo.
-   Orden de lectura.
-   Jerarquía semántica.
-   Subtítulos.
-   Reducción de movimiento.
-   Escalado de texto.
-   Estados no basados solo en color.
-   Mensajes de error accesibles.

## 19.2 Patrones UX

-   Feedback inmediato.
-   Confirmación de acciones críticas.
-   Prevención de errores.
-   Deshacer.
-   Guardado automático.
-   Autosave indicator.
-   Progressive disclosure.
-   Empty states útiles.
-   Onboarding contextual.
-   Ayuda contextual.
-   Búsqueda y filtros.
-   Estados de carga.
-   Recuperación de errores.
-   Consistencia.
-   Reconocimiento antes que memorización.

## 19.3 Pruebas

-   Usabilidad.
-   Accesibilidad.
-   Responsive.
-   Teclado.
-   Lectores de pantalla.
-   Contraste.
-   Rendimiento.
-   Compatibilidad.
-   Pruebas de formularios.
-   Pruebas de estados.

------------------------------------------------------------------------

# MÓDULO 20 --- Design tokens y fundamentos técnicos

## 20.1 Espaciado

Crear una escala coherente y documentar cada valor:

-   0.  
-   2.  
-   4.  
-   8.  
-   12. 
-   16. 
-   20. 
-   24. 
-   32. 
-   40. 
-   48. 
-   64. 
-   80. 
-   96. 

Los valores anteriores son una escala inicial de referencia, no una
obligación universal.

## 20.2 Radios

-   None.
-   XS.
-   SM.
-   MD. 
-   LG.
-   XL. 
-   2XL.
-   3XL.
-   Full / pill.

## 20.3 Sombras

-   None.
-   XS.
-   SM.
-   MD. 
-   LG.
-   XL. 
-   Inner.
-   Focus.
-   Colored glow.

## 20.4 Bordes

-   Width.
-   Style.
-   Color.
-   Opacity.
-   Radius.
-   Divider.
-   Focus ring.

## 20.5 Capas

-   Base.
-   Content.
-   Sticky.
-   Dropdown.
-   Popover.
-   Modal.
-   Toast.
-   Tooltip.
-   Overlay.

Definir una escala de z-index para evitar conflictos.

## 20.6 Tokens semánticos

Separar los valores visuales de su función. Por ejemplo, no usar
directamente un color hexadecimal en cada componente: utilizar tokens
como `color.primary`, `surface.card` o `text.muted`.

------------------------------------------------------------------------

# MÓDULO 21 --- Código, componentes y documentación

## 21.1 Formatos de código

-   HTML semántico.
-   CSS.
-   CSS variables.
-   SCSS.
-   JavaScript.
-   TypeScript.
-   React.
-   Next.js.
-   Tailwind CSS.
-   SVG.
-   JSON de configuración.
-   Lottie JSON, cuando corresponda.

## 21.2 Paquetes de cada componente

Cada recurso funcional debe incluir, según corresponda:

1.  Código fuente.
2.  Estilos.
3.  Scripts.
4.  Vista previa.
5.  Variantes.
6.  Estados.
7.  Datos de ejemplo.
8.  Instrucciones de instalación.
9.  Dependencias.
10. Compatibilidad.
11. Licencia.
12. Pruebas.

## 21.3 Documentación

-   Qué es.
-   Para qué sirve.
-   Cuándo utilizarlo.
-   Cuándo no utilizarlo.
-   Propiedades.
-   Variantes.
-   Estados.
-   Ejemplos.
-   Código.
-   Accesibilidad.
-   Responsive.
-   Dependencias.
-   Historial de cambios.

## 21.4 Calidad del código

-   Código reutilizable.
-   Nombres coherentes.
-   Componentes pequeños.
-   Separación de estructura y estilos.
-   Sin dependencias innecesarias.
-   Sin errores de consola.
-   Sin recursos rotos.
-   Responsive probado.
-   Accesibilidad revisada.
-   Licencias documentadas.

------------------------------------------------------------------------

# MÓDULO 22 --- Plantillas completas por tipo de producto

Estas plantillas combinan componentes, estilos, layouts y patrones para
casos de uso concretos.

## 22.1 Aplicaciones

-   Fintech.
-   Banca.
-   Wallet cripto.
-   Comercio electrónico.
-   Redes sociales.
-   Mensajería.
-   Productividad.
-   Gestión de tareas.
-   Educación.
-   Salud y bienestar.
-   Viajes.
-   Reservas.
-   Música.
-   Vídeo.
-   Fotografía.
-   Noticias.
-   Clima.
-   Fitness.
-   Gaming.
-   IA y asistentes.
-   Gestión empresarial.
-   Administración.
-   Almacenamiento.
-   Herramientas de desarrollo.

## 22.2 Sitios web

-   Landing page.
-   SaaS.
-   Agencia.
-   Portfolio.
-   Tienda online.
-   Blog.
-   Revista.
-   Noticias.
-   Corporativo.
-   Restaurante.
-   Hotel.
-   Educación.
-   Comunidad.
-   Documentación.
-   Dashboard web.
-   Marketplace.
-   Página de producto.
-   Página de precios.
-   Página de contacto.

## 22.3 Para cada plantilla

-   Objetivo.
-   Público.
-   Arquitectura de información.
-   Mapa de pantallas.
-   Secciones.
-   Componentes utilizados.
-   Sistema visual.
-   Responsive.
-   Interacciones.
-   Estados.
-   Código.
-   Vista previa.
-   Variantes.
-   Requisitos de contenido.

------------------------------------------------------------------------

# MÓDULO 23 --- Herramientas para el creador visual

Este módulo define las funciones de una aplicación que utiliza la
biblioteca para crear interfaces.

## 23.1 Explorador

-   Navegar por módulos.
-   Buscar por nombre.
-   Buscar por etiqueta.
-   Filtrar por estilo.
-   Filtrar por plataforma.
-   Filtrar por color.
-   Filtrar por tecnología.
-   Ordenar por popularidad.
-   Ordenar por fecha.
-   Favoritos.
-   Recientes.
-   Colecciones.

## 23.2 Vista previa

-   Preview en vivo.
-   Vista móvil.
-   Vista tablet.
-   Vista desktop.
-   Cambio de tema.
-   Cambio de variante.
-   Interacción real.
-   Vista de estados.
-   Comparación de variantes.
-   Zoom.

## 23.3 Editor visual

-   Cambiar colores.
-   Cambiar fuentes.
-   Cambiar tamaños.
-   Cambiar radios.
-   Cambiar sombras.
-   Cambiar bordes.
-   Cambiar espaciados.
-   Cambiar iconos.
-   Cambiar imágenes.
-   Cambiar alineación.
-   Cambiar disposición.
-   Ajustar responsive.
-   Ajustar animaciones.

## 23.4 Generador de código

-   Copiar código.
-   Descargar componente.
-   Exportar HTML/CSS.
-   Exportar React.
-   Exportar Tailwind.
-   Exportar SVG.
-   Exportar configuración JSON.
-   Descargar proyecto ZIP.
-   Mostrar dependencias.
-   Mostrar instrucciones.

## 23.5 Constructor de pantallas

-   Añadir componentes.
-   Arrastrar y soltar.
-   Reordenar.
-   Duplicar.
-   Eliminar.
-   Agrupar.
-   Desagrupar.
-   Editar propiedades.
-   Cambiar layout.
-   Aplicar tema.
-   Deshacer.
-   Rehacer.
-   Guardar versiones.
-   Exportar pantalla.

## 23.6 Creador inteligente

-   Recibir una descripción.
-   Identificar el tipo de producto.
-   Proponer arquitectura.
-   Seleccionar estilo visual.
-   Elegir paleta.
-   Elegir tipografía.
-   Seleccionar componentes.
-   Crear pantallas.
-   Crear navegación.
-   Generar contenido de ejemplo.
-   Generar código.
-   Validar responsive.
-   Revisar accesibilidad.
-   Corregir errores.
-   Mostrar preview.
-   Exportar proyecto.

------------------------------------------------------------------------

# MÓDULO 24 --- Organización física de archivos

Una estructura posible para almacenar la biblioteca:

``` text
design-library/
│
├── README.md
├── catalog.json
├── manifest.json
│
├── 01-buttons/
│   ├── primary/
│   ├── secondary/
│   ├── icon-buttons/
│   ├── floating/
│   └── variants/
│
├── 02-cards/
│   ├── product/
│   ├── profile/
│   ├── statistics/
│   ├── pricing/
│   └── variants/
│
├── 03-forms/
│   ├── inputs/
│   ├── selectors/
│   ├── toggles/
│   ├── upload/
│   └── patterns/
│
├── 04-navigation/
│   ├── mobile/
│   ├── desktop/
│   ├── headers/
│   └── footers/
│
├── 05-indicators/
├── 06-avatars-illustrations/
├── 07-typography/
├── 08-colors/
├── 09-icons/
├── 10-layouts/
├── 11-app-screens/
├── 12-web-sections/
├── 13-visual-styles/
├── 14-animations/
├── 15-effects/
├── 16-media/
├── 17-data-visualization/
├── 18-responsive/
├── 19-accessibility-ux/
├── 20-design-tokens/
├── 21-code-components/
├── 22-templates/
└── 23-creator-tools/
```

### Estructura interna recomendada para un componente

``` text
component-name/
├── preview.png
├── demo.html
├── component.css
├── component.js
├── component.tsx
├── tailwind.example.txt
├── config.json
├── metadata.json
├── README.md
└── assets/
```

No todos los componentes necesitan todos los archivos. Guardar
únicamente lo que realmente aplique.

------------------------------------------------------------------------

# MÓDULO 25 --- Metadatos y catálogo central

## 25.1 Campos de catálogo

-   `id`
-   `name`
-   `slug`
-   `module`
-   `subcategory`
-   `type`
-   `description`
-   `preview`
-   `demo`
-   `platforms`
-   `frameworks`
-   `styles`
-   `variants`
-   `states`
-   `responsive`
-   `accessibility`
-   `tags`
-   `dependencies`
-   `license`
-   `author`
-   `version`
-   `created_at`
-   `updated_at`

## 25.2 Ejemplo de registro JSON

``` json
{
  "id": "button-primary-001",
  "name": "Primary Button",
  "module": "buttons",
  "subcategory": "primary",
  "type": "component",
  "description": "Botón principal para acciones importantes",
  "platforms": ["web", "mobile"],
  "frameworks": ["html-css", "react", "tailwind"],
  "styles": ["minimal", "modern"],
  "variants": ["solid", "gradient", "outline"],
  "states": [
    "default",
    "hover",
    "focus",
    "pressed",
    "disabled",
    "loading"
  ],
  "responsive": true,
  "accessibility": {
    "keyboard": true,
    "focus_visible": true,
    "semantic": true
  },
  "tags": ["button", "action", "primary"],
  "version": "1.0.0"
}
```

------------------------------------------------------------------------

# MÓDULO 26 --- Criterios de aceptación de la biblioteca

Un recurso no debe considerarse terminado hasta cumplir los requisitos
aplicables:

-   [ ] Está en el módulo correcto.
-   [ ] Tiene un ID único.
-   [ ] Tiene nombre y descripción.
-   [ ] Tiene vista previa real.
-   [ ] No es un duplicado.
-   [ ] Tiene variantes identificadas.
-   [ ] Tiene estados documentados.
-   [ ] Tiene código funcional, si corresponde.
-   [ ] Tiene comportamiento responsive, si corresponde.
-   [ ] Tiene accesibilidad revisada.
-   [ ] Tiene dependencias documentadas.
-   [ ] Tiene licencia o procedencia registrada.
-   [ ] Se puede encontrar mediante búsqueda.
-   [ ] Se ha probado en la vista previa.
-   [ ] Se ha comprobado que los recursos no están rotos.

------------------------------------------------------------------------

# Orden recomendado de construcción

Para desarrollar la biblioteca sin mezclar tareas, conviene trabajar por
etapas:

1.  **Fundamentos:** colores, tipografía, espaciado, radios, sombras e
    iconos.
2.  **Componentes básicos:** botones, inputs, controles, badges y
    tarjetas.
3.  **Navegación:** headers, barras inferiores, sidebars, tabs y menús.
4.  **Patrones:** formularios, filtros, listas, modales y estados.
5.  **Layouts:** grids, dashboards, galerías y estructuras.
6.  **Pantallas:** acceso, inicio, perfil, detalle, pagos y ajustes.
7.  **Secciones web:** hero, features, pricing, testimonios y footer.
8.  **Estilos:** sistemas visuales completos con reglas coherentes.
9.  **Movimiento:** animaciones y microinteracciones.
10. **Código:** versiones reutilizables y documentadas.
11. **Plantillas:** aplicaciones y webs completas por sector.
12. **Creador:** editor visual, combinador, preview y exportación.
13. **Control de calidad:** duplicados, accesibilidad, responsive y
    pruebas.

## Principio final

La biblioteca debe ser una base de datos de recursos visuales y
funcionales, no una carpeta de capturas repetidas.

Cada recurso debe aportar algo concreto: una estructura, una variante,
una interacción, un estilo o una solución reutilizable. La combinación
de estos recursos debe permitir construir desde un botón individual
hasta una aplicación completa, manteniendo coherencia visual y código
utilizable.
