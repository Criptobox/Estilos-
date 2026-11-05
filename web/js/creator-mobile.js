/* Creador móvil (pantallas de hasta 759 px).
   El lienzo siempre queda visible: arriba la barra y los modos, en medio el lienzo, y abajo las
   herramientas. Cada herramienta abre una hoja que empuja el lienzo hacia arriba en vez de taparlo,
   así los cambios se ven en vivo mientras se ajustan.
   Reutiliza el estado y las acciones del constructor (capas, historial, edición directa, exportación):
   solo es otra presentación. En escritorio se mantiene la distribución en columnas. */
const BM_TOOLS = [
  { id: "anadir", label: "Añadir", icon: "plus" },
  { id: "estilos", label: "Estilos", icon: "edit" },
  { id: "colores", label: "Colores", icon: "palette" },
  { id: "texto", label: "Texto", icon: "type" },
  { id: "tamano", label: "Tamaño", icon: "resize" }
];
const BM_TITLES = { anadir: "Añadir componente", estilos: "Estilos", colores: "Colores", texto: "Texto", tamano: "Tamaño y movimiento", capas: "Capas y pantallas", exportar: "Exportar y compartir", proyecto: "Tema del proyecto" };
const BM_SW = { bg: ["#FFFFFF", "#EEF2FF", "#FCE7F3", "#DCFCE7", "#FEF3C7", "#111827"], color: ["#263247", "#111827", "#4F46E5", "#BE185D", "#FFFFFF"], borderColor: ["#E8EAF0", "#C4B5FD", "#93C5FD", "#FBCFE8", "#111827"] };
const BM_FIELD_LABEL = { bg: "Fondo", color: "Texto", borderColor: "Borde" };
const BM_VARIANTS = [["default", "Clásica"], ["glass", "Glass"], ["soft", "Soft UI"], ["outline", "Outline"], ["bold", "Bold"]];
const BM_ANIMS = [["none", "Ninguna"], ["fade", "Fade"], ["rise", "Subir"], ["zoom", "Zoom"], ["float", "Flotar"], ["pulse", "Pulso"]];
const BM_WEIGHTS = ["400", "500", "600", "700", "800"];
const BM_ALIGNS = [["left", "Izquierda", "M4 6h16M4 10h10M4 14h16M4 18h10"], ["center", "Centro", "M4 6h16M7 10h10M4 14h16M7 18h10"], ["right", "Derecha", "M4 6h16M10 10h10M4 14h16M10 18h10"]];
const BM_MODES = [["design", "Diseño"], ["code", "Código"], ["preview", "Vista previa"]];

/* Herramienta abierta: sin elección previa, un proyecto vacío arranca en «Añadir» y uno con componentes, sin hoja. */
function bmTool() {
  if ((S.bmode || "design") !== "design") return null;
  return S.btool === undefined ? (builder.selected.length ? null : "anadir") : S.btool;
}
function bmFocusActive() {
  const b = document.querySelector(".bmCanvas .builder-block.is-active");
  if (b) b.scrollIntoView({ block: "nearest", behavior: "auto" });
}

const bmSet = (idx, field, value) => 'data-act="layerset" data-index="' + idx + '" data-field="' + field + '" data-value="' + esc(String(value)) + '"';
const bmChip = (label, on, attrs) => '<button type="button" class="bmChip' + (on ? " on" : "") + '" role="radio" aria-checked="' + !!on + '" ' + attrs + '>' + label + '</button>';
function bmSlider(label, idx, field, min, max, val, unit, step) {
  return '<label class="bmRow"><span>' + label + '</span><input type="range" min="' + min + '" max="' + max + '"' + (step ? ' step="' + step + '"' : "") + ' value="' + val + '" data-layer-field="' + field + '" data-index="' + idx + '" data-unit="' + unit + '"><output>' + val + unit + '</output></label>';
}
function bmSwatches(idx, field, cur) {
  const c = String(cur || BM_SW[field][0]).toUpperCase();
  return '<div class="bmSws">' + BM_SW[field].map(h => '<button type="button" class="bmSw' + (c === h ? " on" : "") + '" style="background:' + h + '" ' + bmSet(idx, field, h) + ' aria-label="' + BM_FIELD_LABEL[field] + " " + h + '" aria-pressed="' + (c === h) + '"></button>').join("")
    + '<input type="color" class="bmCustom" value="' + esc(hex6(c).toLowerCase()) + '" data-layer-field="' + field + '" data-index="' + idx + '" aria-label="' + BM_FIELD_LABEL[field] + ' personalizado"></div>';
}
const bmH = t => '<div class="bmLbl">' + t + '</div>';

function bmExportHTML() {
  return builderImagesPanelHTML() + '<section class="panel builder-export-box"><h3>Exportar y compartir</h3><button type="button" class="switchRow" role="switch" aria-checked="' + (!!builder.exportDark) + '" data-act="builderexportdark"><span>Modo oscuro automático<small>El marco de la página se oscurece si quien la abre usa modo oscuro. Los colores de tus bloques no cambian.</small></span><i class="sw2"></i></button>'
    + '<button class="cta" data-act="builderexport">' + ic("arrowDown", 17) + ' Todas las pantallas en HTML</button><button class="cta ghost" data-act="builderexportzip">' + ic("layers", 17) + ' ZIP: HTML + React + Tailwind</button>'
    + '<button class="cta ghost" data-act="builderlink">' + ic("share", 17) + ' Copiar enlace del proyecto</button><p class="sub">El enlace no lleva las imágenes que reemplazaste; para eso usa el ZIP o la copia de seguridad.</p></section>';
}
function bmProjectHTML() {
  return '<div class="bmRow2"><label>' + bmH("Color principal") + '<input class="fld color-field" type="color" data-builder="palette" value="' + esc(hex6(builder.palette).toLowerCase()) + '"></label><label>' + bmH("Fondo") + '<input class="fld color-field" type="color" data-builder="bg" value="' + esc(hex6(builder.bg).toLowerCase()) + '"></label></div>'
    + bmH("Tipografía") + '<select class="fld" data-builder="font" aria-label="Tipografía">' + BUILDER_FONTS.map(f => '<option' + (builder.font === f ? " selected" : "") + '>' + f + '</option>').join("") + '</select>'
    + '<label class="bmRow"><span>Redondeo</span><input type="range" min="8" max="32" value="' + (Number(builder.radius) || 20) + '" data-builder="radius" data-unit=" px" aria-label="Redondeo general"><output>' + (Number(builder.radius) || 20) + ' px</output></label>'
    + bmH("Temas guardados") + '<div class="two"><select class="fld" data-theme-select aria-label="Aplicar tema"><option value="">Seleccionar tema</option><option value="violet">Violeta Studio</option><option value="midnight">Midnight</option><option value="ivory">Ivory</option><option value="mint">Mint</option>' + builderThemes.map(t => '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>').join("") + '</select><button class="cta ghost" data-act="builderthemesave">Guardar tema</button></div>';
}

function bmSheetBody(tool, i, e, l) {
  if (tool === "anadir") {
    const fields = allTabs().filter(t => t !== "Referencias" && db().some(x => x.tab === t));
    return '<label class="builder-picker-search"><span>⌕</span><input type="search" data-builder-picker-search placeholder="Buscar por nombre o categoría…" aria-label="Buscar diseño"></label><div class="builder-picker-groups">' + fields.map(t => builderVisualPicker(t)).join("") + '</div>';
  }
  if (tool === "capas") {
    const parts = builderLayerParts();
    const scr = builder.screens.map((sc, k) => '<button type="button" class="bmChip' + (k === builder.activeScreenIndex ? " on" : "") + '" data-act="builderscreen" data-index="' + k + '"><i>' + (k + 1) + '</i>' + esc(sc.title || "Pantalla " + (k + 1)) + '</button>').join("") + '<button type="button" class="bmChip ghost" data-act="builderscreenadd">＋ Nueva</button>';
    return '<div class="bmScr">' + scr + '</div>' + pageStructureHTML()
      + '<label>' + bmH("Nombre de esta pantalla") + '<input class="fld" data-builder="title" maxlength="60" value="' + esc(builder.title) + '"></label>'
      + '<div class="bmBtns"><button type="button" class="cta ghost" data-act="builderscreenduplicate">Duplicar pantalla</button><button type="button" class="cta ghost" data-act="builderscreendelete"' + (builder.screens.length <= 1 ? " disabled" : "") + '>Eliminar pantalla</button></div>'
      + parts.layerPanelHtml
      + '<div class="bmBtns"><button type="button" class="cta ghost" data-act="bsheet" data-s="proyecto">' + ic("palette", 17) + ' Tema</button><button type="button" class="cta" data-act="bsheet" data-s="exportar">' + ic("arrowDown", 17) + ' Exportar</button></div>';
  }
  if (tool === "exportar") return bmExportHTML();
  if (tool === "proyecto") return bmProjectHTML();
  if (!e) return '<p class="sub">Añade un componente para poder editarlo.</p><button type="button" class="cta" data-act="bsheet" data-s="anadir">' + ic("plus", 17) + ' Añadir componente</button>';
  if (tool === "estilos") {
    return layerPlaceHTML(i, l) + bmH("Variante") + '<div class="bmChips" role="radiogroup" aria-label="Variante visual">' + BM_VARIANTS.map(([v, n]) => bmChip(n, (l.variant || "default") === v, bmSet(i, "variant", v))).join("") + '</div>'
      + (l.bare ? '<p class="sub">Sin tarjeta: el elemento se ve tal cual, sin fondo, borde ni sombra. Elige «Con tarjeta» para ajustarlos.</p>'
        : bmH("Color de fondo") + bmSwatches(i, "bg", l.bg)
        + bmSlider("Redondeo", i, "radius", 6, 32, l.radius || 16, " px")
        + bmSlider("Espaciado", i, "padding", 4, 32, l.padding || 12, " px")
        + bmSlider("Elevación", i, "elevation", 0, 5, l.elevation ?? (l.shadow ? 2 : 0), "")
        + bmSlider("Grosor borde", i, "borderWidth", 0, 5, l.borderWidth || 0, " px"));
  }
  if (tool === "colores") {
    return (l.bare ? "" : bmH("Fondo") + bmSwatches(i, "bg", l.bg)) + bmH("Texto") + bmSwatches(i, "color", l.color) + (l.bare ? "" : bmH("Borde") + bmSwatches(i, "borderColor", l.borderColor));
  }
  if (tool === "texto") {
    return '<label>' + bmH("Nombre visible") + '<input class="fld" maxlength="70" data-layer-field="label" data-index="' + i + '" value="' + esc(l.label || e.name) + '"></label>'
      + bmSlider("Tamaño", i, "fontSize", 10, 30, l.fontSize || 14, " px")
      + bmH("Peso") + '<div class="bmChips" role="radiogroup" aria-label="Peso de la letra">' + BM_WEIGHTS.map(w => bmChip(w, String(l.weight || "600") === w, bmSet(i, "weight", w))).join("") + '</div>'
      + bmH("Alineación") + '<div class="bmChips" role="radiogroup" aria-label="Alineación">' + BM_ALIGNS.map(([v, n, d]) => '<button type="button" class="bmChip sq' + ((l.align || "left") === v ? " on" : "") + '" role="radio" aria-checked="' + ((l.align || "left") === v) + '" aria-label="' + n + '" ' + bmSet(i, "align", v) + '><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="' + d + '"/></svg></button>').join("") + '</div>'
      + '<div class="bmBtns"><button type="button" class="cta ghost" data-act="buildertextmode">Aa ' + (builderTextEditMode ? "Terminar texto" : "Editar sobre el lienzo") + '</button><button type="button" class="cta ghost" data-act="buildermediamode">▧ ' + (builderMediaEditMode ? "Terminar imagen" : "Cambiar imagen") + '</button></div>';
  }
  if (tool === "tamano") {
    return bmSlider("Ancho", i, "width", 50, 100, l.width || 100, " %") + bmSlider("Mover X", i, "offsetX", -40, 40, l.offsetX || 0, " px") + bmSlider("Mover Y", i, "offsetY", -40, 40, l.offsetY || 0, " px")
      + bmH("Animación") + '<div class="bmChips" role="radiogroup" aria-label="Animación">' + BM_ANIMS.map(([v, n]) => bmChip(n, (l.animation || "none") === v, bmSet(i, "animation", v))).join("") + '</div>'
      + bmSlider("Duración", i, "duration", 300, 3000, l.duration || 700, " ms", 100)
      + bmH("Tamaño de la pantalla") + '<div class="bmChips" role="radiogroup" aria-label="Tamaño de la pantalla">' + Object.keys(DEVICES).map(k => bmChip(DEVICES[k].n, deviceOf(builder) === DEVICES[k], 'data-act="devset" data-v="' + k + '"')).join("") + '</div>';
  }
  return "";
}

function renderBuilderMobile() {
  const picked = pickedBuilder(), i = builder.activeLayer, e = picked[i], l = builder.layers[i] || {};
  const mode = S.bmode || "design", tool = bmTool(), design = mode === "design";
  const name = e ? (l.label || e.name) : "";
  const ib = (act, attrs, icon, label, extra) => '<button type="button" class="bmIb' + (extra || "") + '" data-act="' + act + '" ' + attrs + ' aria-label="' + label + '">' + ic(icon, 19) + '</button>';
  const top = '<header class="bmTop">' + ib("back", "", "back", "Salir del creador", "")
    + '<div class="bmTitle"><h1>Creador visual</h1><button type="button" class="bmScrBtn" data-act="bsheet" data-s="capas">Pantalla ' + (builder.activeScreenIndex + 1) + ' de ' + builder.screens.length + ic("chevD", 12, 2.6) + '</button></div>'
    + ib("builderundo", "", "undo", "Deshacer", "") + ib("builderredo", "", "redo", "Rehacer", "") + ib("bsheet", 'data-s="capas"', "layers", "Capas y pantallas", tool === "capas" ? " on" : "") + '</header>'
    + '<div class="bmModes" role="tablist">' + BM_MODES.map(([m, n]) => '<button type="button" role="tab" aria-selected="' + (mode === m) + '" class="' + (mode === m ? "on" : "") + '" data-act="bmode" data-m="' + m + '">' + n + '</button>').join("") + '</div>';

  let body;
  if (mode === "code") {
    const st = S.stack || "html";
    const code = e ? (st === "html" ? builderEditedMediaCode(e, l) : stackCode(e, st)) : "";
    body = '<div class="bmCode">' + (e ? '<div class="fmt" role="radiogroup" aria-label="Plataforma">' + STACKS.map(x => '<button type="button" role="radio" aria-checked="' + (x.id === st) + '" class="' + (x.id === st ? "on" : "") + '" data-act="stack" data-s="' + x.id + '">' + x.label + '</button>').join("") + '</div>'
      + '<div class="codeBox"><div class="codeHead"><span>' + esc(name) + ' · ' + esc(codeLabel(st, code)) + '</span><button data-act="bcopy">' + ic("copy", 14) + ' Copiar</button></div><pre><code>' + esc(code) + '</code></pre></div>'
      + '<p class="sub">Código del componente seleccionado, con tus textos e imágenes. Para todo el proyecto usa Exportar.</p>'
      : '<div class="empty"><b>Todavía no hay componentes</b><span>Añade uno en la pestaña Diseño.</span></div>') + '</div>';
  } else {
    body = '<div class="bmCanvas"><div class="builder-preview' + (builderTextEditMode ? " text-edit-mode" : "") + (builderMediaEditMode ? " media-edit-mode" : "") + (mode === "preview" ? " bm-clean" : "") + '" id="builder-preview-panel"><input type="file" id="builder-media-file" accept="image/png,image/jpeg,image/webp" hidden>' + builderPreview() + '</div></div>';
  }
  const pill = design && (builderTextEditMode || builderMediaEditMode)
    ? '<div class="bmPill" role="status">' + (builderTextEditMode ? "Modo texto · toca una frase" : "Modo imagen · toca una foto o icono") + '<button type="button" data-act="' + (builderTextEditMode ? "buildertextmode" : "buildermediamode") + '">Terminar</button></div>' : "";
  const ctx = design && !tool && e ? '<div class="bmCtx" role="toolbar" aria-label="Acciones de «' + esc(name) + '»">'
    + [["builderduplicate", "", "copy", "Duplicar"], ["builderremove", "", "trash", "Eliminar"], ["buildermove", 'data-dir="-1"' + (i === 0 ? " disabled" : ""), "arrowUp", "Subir"], ["buildermove", 'data-dir="1"' + (i === picked.length - 1 ? " disabled" : ""), "arrowDown", "Bajar"],
       ["builderlayerlock", "", l.locked ? "lock" : "unlock", l.locked ? "Desbloquear" : "Bloquear"], ["builderlayerhide", "", l.hidden ? "eyeOff" : "eye", l.hidden ? "Mostrar" : "Ocultar"]]
      .map(([act, at, icon, lab]) => '<button type="button" data-act="' + act + '" data-index="' + i + '" ' + at + ' aria-label="' + lab + ' «' + esc(name) + '»" title="' + lab + '">' + ic(icon, 20) + '</button>').join("") + '</div>' : "";
  const sheet = design && tool ? '<section class="bmSheet" data-tool="' + tool + '" aria-label="' + BM_TITLES[tool] + '"><div class="bmHandle"></div><div class="bmSheetHead"><h2>' + BM_TITLES[tool] + '</h2><button type="button" class="bmDone" data-act="bsheet" data-s="' + tool + '">Hecho</button></div>' + bmSheetBody(tool, i, e, l) + '</section>' : "";
  const tools = design ? '<nav class="bmTools" role="toolbar" aria-label="Herramientas del creador">' + BM_TOOLS.map(t => '<button type="button" class="ni' + (tool === t.id ? " nia" : "") + '" data-act="bsheet" data-s="' + t.id + '" aria-pressed="' + (tool === t.id) + '">' + ic(t.icon, 21) + '<span>' + t.label + '</span></button>').join("") + '</nav>' : "";
  return '<div class="bm" data-mode="' + mode + '">' + top + body + pill + ctx + sheet + tools + '</div>';
}
