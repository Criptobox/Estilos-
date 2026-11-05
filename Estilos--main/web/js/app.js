/* Estilos · lógica de la app.
   - Catálogo inmutable (SEED) + capa del usuario (añadidos, ediciones, borrados).
   - Sin onclick en línea: todos los eventos usan data-act (delegación), así ningún dato
     importado puede inyectar código.
   - Navegación con la API de historial (el botón Atrás del sistema funciona). */

/* ───────── Almacenamiento ───────── */
const KEY_USER = "estilos-user-v2", KEY_OLD = "estilos-db-v1", KEY_BAK = "estilos-db-v1-backup", KEY_FAV = "estilos-favs-v1";
const BASE_TABS = ["Chat", "Tarjetas", "Listas", "Avatares", "Plantillas", "Barras", "Botones", "Formularios", "Entradas", "Hojas", "Avisos", "Datos", "Paletas", "Tipografía", "Encabezados", "Animaciones", "Fondos", "Widgets", "Iconos"];
const TAB_ICON = { Chat: "chat", Tarjetas: "card", Listas: "menu", Avatares: "user", Plantillas: "grid", Barras: "sliders", Botones: "plus", Formularios: "edit", Entradas: "search", Hojas: "arrowUp", Avisos: "bell", Datos: "chart", Paletas: "spark", "Tipografía": "type", Encabezados: "layers", Animaciones: "spark", Fondos: "image", Widgets: "grid", Iconos: "spark", Referencias: "image" };
const TAB_FAMILY = { Chat: "chat", Tarjetas: "card", Listas: "list", Avatares: "avatar", Plantillas: "tpl", Barras: "bar", Botones: "btn", Formularios: "form", Entradas: "input", Hojas: "sheet", Avisos: "notice", Datos: "data", Paletas: "pal", "Tipografía": "type", Encabezados: "head", Animaciones: "motion", Fondos: "background", Widgets: "widget", Iconos: "icon" };

function readJSON(k, fb) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch (e) { return fb; } }
function writeJSON(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); return true; }
  catch (e) { toast("No se pudo guardar: almacenamiento lleno"); return false; }
}

/* Sanea cualquier entrada (formulario, importación o datos antiguos). */
function normalize(raw) {
  if (!raw || typeof raw !== "object") return null;
  const s = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
  const name = s(raw.name, 80), tab = s(raw.tab, 30);
  if (!name || !tab) return null;
  const list = Array.isArray(raw.colors) ? raw.colors : String(raw.colors || "").split(",");
  const colors = list.map(c => String(c).trim()).map(c => (c && c[0] !== "#" ? "#" + c : c)).filter(c => HEX_RE.test(c)).slice(0, 6).map(c => safeColor(c));
  const radius = /^\d{1,2}%?$/.test(String(raw.radius).trim()) ? String(raw.radius).trim() : "16";
  return {
    id: safeId(raw.id) || ("u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)),
    tab, name, ref: s(raw.ref, 80), desc: s(raw.desc, 400), colors: colors.length ? colors : ["#888888"],
    radius, tip: s(raw.tip, 300), mode: raw.mode === "dark" ? "dark" : "light",
    v: raw.v && D[raw.v] ? raw.v : "", code: s(raw.code, 4000)
  };
}

let user = loadUser(), migrated = false;
function loadUser() {
  let u = readJSON(KEY_USER, null);
  if (!u) {
    u = { added: [], edits: {}, deleted: [] };
    const old = readJSON(KEY_OLD, null);
    if (Array.isArray(old) && old.length) {          // migración desde v1.5: se conserva lo creado por el usuario
      try { localStorage.setItem(KEY_BAK, JSON.stringify(old)); } catch (e) { /* sin espacio: se ignora */ }
      u.added = old.filter(x => x && /^u/.test(String(x.id || ""))).map(normalize).filter(Boolean);
      migrated = true;
    }
    try { localStorage.setItem(KEY_USER, JSON.stringify(u)); } catch (e) { /* ok */ }
  }
  u.added = (Array.isArray(u.added) ? u.added : []).map(normalize).filter(Boolean);
  u.edits = u.edits && typeof u.edits === "object" && !Array.isArray(u.edits) ? u.edits : {};
  u.deleted = Array.isArray(u.deleted) ? u.deleted.map(safeId) : [];
  return u;
}
function saveUser() { _db = null; return writeJSON(KEY_USER, user); }

let favs = (readJSON(KEY_FAV, []) || []).map(safeId).filter(Boolean);
function saveFavs() { writeJSON(KEY_FAV, favs); }

const SEED_IDS = new Set(SEED.map(e => e.id));
let _db = null;
function db() {
  if (_db) return _db;
  const del = new Set(user.deleted);
  const seed = SEED.filter(e => !del.has(e.id)).map(e => user.edits[e.id] ? Object.assign({}, e, user.edits[e.id]) : e);
  return (_db = seed.concat(user.added));
}
function getEntry(id) { return db().find(e => e.id === id); }
function allTabs() {
  const t = BASE_TABS.slice();
  db().forEach(e => { if (e.tab && !t.includes(e.tab) && e.tab !== "Referencias") t.push(e.tab); });
  t.push("Referencias");
  return t.filter(x => x === "Referencias" || db().some(e => e.tab === x));
}

/* ───────── Estado y navegación ───────── */
let S = { view: "home", tab: "Tarjetas", id: null, q: "", detailTab: "info", stage: "auto" };
let builder = readJSON("estilos-builder-v1", { title: "Mi nueva interfaz", subtitle: "Una experiencia diseñada a tu manera", palette: "#635BFF", bg: "#F5F6FA", font: "Inter", radius: 20, selected: [] });
const _rawSelected = Array.isArray(builder.selected) ? builder.selected : [];
const _rawLayers = Array.isArray(builder.layers) ? builder.layers : [];
const _validLayers = _rawSelected.map((id,i)=>({id,layer:_rawLayers[i]})).filter(x=>getEntry(x.id)).slice(0,12);
builder.selected = _validLayers.map(x=>x.id);
builder.layers = _validLayers.map(x=>{const l=x.layer&&typeof x.layer==="object"?x.layer:{};return {uid:String(l.uid||("layer-"+Math.random().toString(36).slice(2,9))).slice(0,40),label:String(l.label||"").slice(0,70),bg:safeColor(l.bg||"#FFFFFF"),color:safeColor(l.color||"#263247"),radius:Math.max(6,Math.min(32,Number(l.radius)||16)),padding:Math.max(4,Math.min(32,Number(l.padding)||12))};});
builder.activeLayer = Math.max(0, Math.min(builder.selected.length - 1, Number(builder.activeLayer) || 0));
let pendingConfirm = null;

function go(patch, opt) {
  S = Object.assign({}, S, patch);
  try { (opt && opt.replace) ? history.replaceState(S, "") : history.pushState(S, ""); } catch (e) { /* file:// restringido */ }
  render(opt && opt.keep);
}
function goBack() {
  if (history.state && history.state.view && history.state.view !== "home" && history.length > 1) { history.back(); return; }
  go({ view: "home", q: "" }, { replace: true });
}
window.addEventListener("popstate", ev => {
  if (ev.state && ev.state.view) { S = ev.state; render(); }
});
/* Lo llama MainActivity al pulsar Atrás: devuelve true si la web ha gestionado el gesto. */
window.estilosBack = function () {
  if (document.getElementById("lightbox").style.display !== "none") { closeLB(); return true; }
  if (document.getElementById("sheetWrap").style.display !== "none") { closeSheet(); return true; }
  if (S.view !== "home") { goBack(); return true; }
  return false;
};

/* ───────── Utilidades de interfaz ───────── */
function toast(m) {
  const old = document.getElementById("toast"); if (old) old.remove();
  const d = document.createElement("div"); d.id = "toast"; d.setAttribute("role", "status"); d.textContent = m;
  document.body.appendChild(d); setTimeout(() => d.remove(), 2200);
}
function copyText(text, msg) {
  const done = () => toast(msg || "Copiado");
  const fallback = () => {
    try {
      const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
      const ok = document.execCommand("copy"); ta.remove();
      if (ok) done(); else manualCopy(text);
    } catch (e) { manualCopy(text); }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
  else fallback();
}
function manualCopy(text) {
  openSheet('<div class="handle"></div><h2>Copia manualmente</h2><span class="sub">Tu dispositivo bloqueó el portapapeles. Selecciona y copia:</span><textarea class="fld" id="manual" rows="8" readonly>' + esc(text) + '</textarea><button class="cta ghost" data-act="closesheet">Cerrar</button>');
  const t = document.getElementById("manual"); if (t) { t.focus(); t.select(); }
}
function swatches(e) {
  return e.colors.map(c => '<button class="sw" data-act="color" data-c="' + esc(c) + '" aria-label="Copiar color ' + esc(c) + '"><i style="background:' + esc(c) + '"></i>' + esc(c) + '</button>').join("");
}
function pv(e) { return '<div class="pv" data-pv="' + esc(e.id) + '"></div>'; }
function stageCls(e, mode) {
  const m = mode || "auto", dark = m === "auto" ? e.mode === "dark" : m === "dark";
  return "stage" + (dark ? " dark" : "") + (m === "white" ? " white" : "");
}
/* Dibuja las vistas previas (Shadow DOM, o iframe aislado si el estilo trae código propio). */
function hydrate(root) {
  (root || document).querySelectorAll(".pv:not([data-h])").forEach(el => {
    el.setAttribute("data-h", "1");
    const e = getEntry(el.dataset.pv); if (!e) return;
    try {
      if (e.code && e.code.trim()) {
        const f = document.createElement("iframe");
        f.className = "pvf"; f.setAttribute("sandbox", ""); f.title = e.name;
        f.srcdoc = '<!doctype html><meta charset="utf-8"><body style="margin:14px;font-family:system-ui,sans-serif">' + e.code;
        el.appendChild(f);
      } else {
        el.attachShadow({ mode: "open" }).innerHTML = designShadow(e);
      }
    } catch (err) { el.textContent = "No se pudo mostrar la vista previa"; }
  });
}

/* ───────── Vistas ───────── */
function chipsHTML() {
  return '<div class="chips" role="tablist">' + allTabs().map(t => {
    const n = t === "Referencias" ? REFS.length : db().filter(e => e.tab === t).length;
    return '<button class="chip' + (t === S.tab && !S.q ? " on" : "") + '" role="tab" data-act="tab" data-t="' + esc(t) + '">' + esc(t) + '<small>' + n + '</small></button>';
  }).join("") + '</div>';
}
function cardHTML(e, showTab) {
  const fav = favs.includes(e.id);
  return '<article class="card" data-act="open" data-id="' + esc(e.id) + '" tabindex="0" role="button" aria-label="' + esc(e.name) + '">'
    + '<div class="' + stageCls(e) + '">' + pv(e) + '</div>'
    + '<div class="cardInfo"><div class="cardRow"><div><div class="cardName">' + esc(e.name) + '</div><div class="sub">' + esc(e.ref) + '</div></div>'
    + '<button class="heart' + (fav ? " on" : "") + '" data-act="fav" data-id="' + esc(e.id) + '" aria-label="' + (fav ? "Quitar de guardados" : "Guardar") + '">' + (fav ? icf("heart", 20) : ic("heart", 20)) + '</button></div>'
    + (showTab ? '<div class="tags"><span class="tag">' + esc(e.tab) + '</span></div>' : '')
    + '<div class="swRow">' + swatches(e) + '</div></div></article>';
}
function miniHTML(e) {
  return '<article class="mini" data-act="open" data-id="' + esc(e.id) + '" tabindex="0" role="button" aria-label="' + esc(e.name) + '"><div class="' + stageCls(e) + '">' + pv(e) + '</div><b>' + esc(e.name) + '</b><small>' + esc(e.tab) + '</small></article>';
}

function renderHome() {
  const list = db(), day = Math.floor(Date.now() / 864e5), f = list.length ? list[day % list.length] : null;
  const fresh = SEED.slice(75).filter((x, i) => i % 3 === 0).map(x => getEntry(x.id)).filter(Boolean);
  const cats = allTabs().map(t => {
    const n = t === "Referencias" ? REFS.length : db().filter(e => e.tab === t).length;
    return '<button class="cat" data-act="tab" data-t="' + esc(t) + '"><span>' + ic(TAB_ICON[t] || "grid", 18) + '</span><b>' + esc(t) + '</b><small>' + n + (t === "Referencias" ? " capturas" : " estilos") + '</small></button>';
  }).join("");
  return '<div class="wrap">'
    + '<div class="top"><div class="brand"><span class="logo">' + ic("layers", 22) + '</span><div><b>Estilos</b><div class="sub">Biblioteca de diseño UI</div></div></div><button class="ib" data-act="menu" aria-label="Menú">' + ic("sliders", 20) + '</button></div>'
    + '<div class="hero"><h1 class="big">Diseños listos para copiar</h1><p>' + list.length + ' estilos con vista previa real, paleta de colores y código HTML/CSS. Sin internet.</p></div>'
    + '<button class="search" data-act="gosearch" aria-label="Buscar estilos">' + ic("search", 18) + '<span>Buscar en todos los estilos…</span></button>'
    + (f ? '<div><div class="featTag">' + ic("spark", 14) + 'Destacado de hoy</div></div><article class="feat" data-act="open" data-id="' + esc(f.id) + '" tabindex="0" role="button" aria-label="' + esc(f.name) + '"><div class="' + stageCls(f) + '">' + pv(f) + '</div><div class="cardInfo"><div class="cardName">' + esc(f.name) + '</div><div class="sub">' + esc(f.tab) + ' · ' + esc(f.ref) + '</div></div></article>' : '')
    + '<h2 class="sec">Categorías</h2><div class="cats">' + cats + '</div>'
    + (fresh.length ? '<h2 class="sec">Novedades</h2><div class="rail">' + fresh.map(miniHTML).join("") + '</div>' : '')
    + '<button class="cta" data-act="surprise">' + ic("spark", 18) + ' Sorpréndeme</button></div>';
}

function listFor() {
  const qq = S.q.trim().toLowerCase();
  if (!qq) return db().filter(e => e.tab === S.tab);
  return db().filter(e => (e.name + " " + e.desc + " " + e.ref + " " + e.tab).toLowerCase().includes(qq));
}
function listHTML() {
  if (S.tab === "Referencias" && !S.q) {
    return '<div class="refGrid">' + REFS.map((r, i) => '<button class="refItem" data-act="lb" data-i="' + i + '"><img src="' + esc(r.img) + '" alt="' + esc(r.label) + '" loading="lazy" decoding="async"><div>' + esc(r.label) + '</div></button>').join("") + '</div>';
  }
  const l = listFor();
  if (!l.length) return '<div class="empty"><b>No hay estilos aquí</b><span>' + (S.q ? "Prueba con otra palabra." : "Toca + Añadir para crear uno.") + '</span></div>';
  return '<div class="grid">' + l.map(e => cardHTML(e, !!S.q)).join("") + '</div>';
}
function renderExplore() {
  const isRefs = S.tab === "Referencias" && !S.q;
  const n = isRefs ? REFS.length : listFor().length;
  return '<div class="wrap">'
    + '<div class="top"><div><h1 class="big">' + esc(S.q ? "Búsqueda" : S.tab) + '</h1><div class="sub" id="count">' + (isRefs ? n + " capturas de referencia" : n + (S.q ? " resultados en todas las categorías" : " estilos")) + '</div></div>' + (isRefs ? '' : '<button class="cta" style="width:auto;padding:0 18px;height:44px;background:var(--acc);box-shadow:none" data-act="add">' + ic("plus", 16, 2.6) + ' Añadir</button>') + '</div>'
    + '<label class="search">' + ic("search", 18) + '<input id="q" data-input="q" type="search" placeholder="Buscar estilo…" aria-label="Buscar estilo" value="' + esc(S.q) + '"></label>'
    + chipsHTML() + '<div id="list">' + listHTML() + '</div></div>';
}

function builderOptions(tab, selected) {
  const items = db().filter(e => e.tab === tab);
  return '<option value="">Seleccionar ' + esc(tab.toLowerCase()) + '</option>' + items.map(e => '<option value="' + esc(e.id) + '"' + (selected === e.id ? ' selected' : '') + '>' + esc(e.name) + '</option>').join('');
}
function builderPreview() {
  const picked = builder.selected.map(getEntry).filter(Boolean);
  const accent = safeColor(builder.palette || '#635BFF'), bg = safeColor(builder.bg || '#F5F6FA');
  const r = Math.max(8, Math.min(32, Number(builder.radius) || 20));
  return '<div class="builder-device" style="--b-accent:' + accent + ';--b-bg:' + bg + ';--b-radius:' + r + 'px;font-family:' + (builder.font === 'Georgia' ? 'Georgia,serif' : builder.font === 'Plus Jakarta Sans' ? 'Plus Jakarta Sans,system-ui' : 'Inter,system-ui') + '">' +
    '<div class="builder-screen"><div class="builder-status"><span>9:41</span><span>●●● ▰</span></div><div class="builder-top"><span class="builder-mark">✦</span><span>•••</span></div><small class="builder-eyebrow">TU ESPACIO DIGITAL</small><h3>' + esc(builder.title || 'Mi nueva interfaz') + '</h3><p>' + esc(builder.subtitle || 'Una experiencia diseñada a tu manera') + '</p><button class="builder-primary">Descubrir más <b>↗</b></button>' +
    picked.map((e,i)=>{const l=builder.layers[i]||{};const label=l.label||e.name;return '<section class="builder-block ' + (i===builder.activeLayer?'is-active':'') + '" data-act="builderselect" data-index="' + i + '" data-builder-preview-layer="' + i + '" style="background:' + safeColor(l.bg||'#FFFFFF') + ';color:' + safeColor(l.color||'#263247') + ';border-radius:' + Math.max(6,Math.min(32,Number(l.radius)||16)) + 'px;padding:' + Math.max(4,Math.min(32,Number(l.padding)||12)) + 'px"><div class="builder-block-head"><b>' + esc(label) + '</b><small>' + esc(e.tab) + '</small></div><div class="builder-live-component">' + pv(e) + '</div></section>';}).join('') +
    '<div class="builder-bottom"><span>⌂<small>Inicio</small></span><span>⌕<small>Buscar</small></span><span>♡<small>Guardados</small></span><span>◉<small>Perfil</small></span></div></div></div>';
}
function renderBuilder() {
  const fields = [ ['Tarjetas','card'], ['Avatares','avatar'], ['Botones','button'], ['Widgets','widget'], ['Animaciones','motion'], ['Iconos','icon'] ];
  return '<div class="wrap builder-wrap"><div class="top"><div><h1 class="big">Constructor</h1><div class="sub">Combina recursos y crea una pantalla propia</div></div><button class="ib" data-act="builderreset" aria-label="Restablecer">↺</button></div>' +
  '<div class="builder-layout"><div class="builder-controls"><section class="panel"><h3>Identidad de pantalla</h3><label class="l">Nombre del proyecto</label><input class="fld" data-builder="title" value="' + esc(builder.title) + '" maxlength="60"><label class="l">Descripción</label><input class="fld" data-builder="subtitle" value="' + esc(builder.subtitle) + '" maxlength="100"><div class="two"><div><label class="l">Color principal</label><input class="fld color-field" type="color" data-builder="palette" value="' + esc(builder.palette) + '"></div><div><label class="l">Fondo</label><input class="fld color-field" type="color" data-builder="bg" value="' + esc(builder.bg) + '"></div></div><div class="two"><div><label class="l">Tipografía</label><select class="fld" data-builder="font"><option' + (builder.font==='Inter'?' selected':'') + '>Inter</option><option' + (builder.font==='Plus Jakarta Sans'?' selected':'') + '>Plus Jakarta Sans</option><option' + (builder.font==='Georgia'?' selected':'') + '>Georgia</option></select></div><div><label class="l">Redondeo</label><input class="fld" type="range" min="8" max="32" step="2" data-builder="radius" value="' + Number(builder.radius) + '"></div></div></section>' +
  '<section class="panel"><h3>Componentes de la biblioteca</h3><p class="sub">Añade hasta doce elementos. Reordena las capas para decidir cómo aparece cada bloque.</p>' + fields.map(([tab])=>'<label class="l">' + tab + '</label><select class="fld" data-builder-select="' + tab + '">' + builderOptions(tab, builder.selected.find(id=>{const e=getEntry(id);return e&&e.tab===tab;})) + '</select>').join('') + '<div class="selected-list">' + (pickedBuilder().length ? pickedBuilder().map((e,i)=>'<div class="builder-layer" draggable="true" data-layer-index="' + i + '"><span class="layer-grip" aria-hidden="true">⠿</span><button class="layer-select ' + (i===builder.activeLayer?'active':'') + '" data-act="builderselect" data-index="' + i + '"><b>' + esc((builder.layers[i]&&builder.layers[i].label)||e.name) + '</b><small>' + esc(e.tab) + ' · Capa ' + (i+1) + '</small></button><span class="layer-actions"><button data-act="buildermove" data-index="' + i + '" data-dir="-1" aria-label="Mover arriba" ' + (i===0?'disabled':'') + '>↑</button><button data-act="buildermove" data-index="' + i + '" data-dir="1" aria-label="Mover abajo" ' + (i===pickedBuilder().length-1?'disabled':'') + '>↓</button><button data-act="builderduplicate" data-index="' + i + '" aria-label="Duplicar componente">＋</button><button data-act="builderremove" data-index="' + i + '" aria-label="Eliminar componente">×</button></span></div>').join('') : '<small class="sub">Todavía no has añadido componentes.</small>') + '</div>' + (pickedBuilder().length ? (function(){const i=builder.activeLayer,e=pickedBuilder()[i],l=builder.layers[i]||{};return '<div class="layer-editor"><h4>Editar componente seleccionado</h4><label class="l">Nombre visible</label><input class="fld" maxlength="70" data-layer-field="label" data-index="' + i + '" value="' + esc(l.label||e.name) + '"><div class="two"><div><label class="l">Fondo del bloque</label><input class="fld color-field" type="color" data-layer-field="bg" data-index="' + i + '" value="' + esc(l.bg||'#FFFFFF') + '"></div><div><label class="l">Color del texto</label><input class="fld color-field" type="color" data-layer-field="color" data-index="' + i + '" value="' + esc(l.color||'#263247') + '"></div></div><div class="two"><div><label class="l">Redondeo</label><input class="fld" type="range" min="6" max="32" data-layer-field="radius" data-index="' + i + '" value="' + Math.max(6,Math.min(32,Number(l.radius)||16)) + '"></div><div><label class="l">Espaciado</label><input class="fld" type="range" min="4" max="32" data-layer-field="padding" data-index="' + i + '" value="' + Math.max(4,Math.min(32,Number(l.padding)||12)) + '"></div></div></div>';})() : '') + '</div></section><button class="cta"  data-act="builderexport">' + ic('arrowDown',17) + ' Exportar pantalla HTML</button></div><div class="builder-preview"><div class="preview-heading"><b>Vista previa en vivo</b><span>390 × 844</span></div>' + builderPreview() + '<p class="sub">La vista previa se actualiza al cambiar los controles.</p></div></div></div>';
}
function pickedBuilder(){return builder.selected.map(getEntry).filter(Boolean);}
function saveBuilder(){try{localStorage.setItem('estilos-builder-v1',JSON.stringify(builder));}catch(e){toast('No se pudo guardar el constructor');}}
function exportBuilder(){
 const accent=safeColor(builder.palette),bg=safeColor(builder.bg),r=Math.max(8,Math.min(32,Number(builder.radius)||20));
 const components=pickedBuilder().map((e,i)=>{const l=builder.layers[i]||{};const label=l.label||e.name;return '<section class="component" style="background:'+safeColor(l.bg||'#FFFFFF')+';color:'+safeColor(l.color||'#263247')+';border-radius:'+Math.max(6,Math.min(32,Number(l.radius)||16))+'px;padding:'+Math.max(4,Math.min(32,Number(l.padding)||12))+'px"><div class="component-meta"><span>'+esc(e.tab)+'</span><small>Bloque '+(i+1)+'</small></div><h2>'+esc(label)+'</h2><p>'+esc(e.desc)+'</p><iframe loading="lazy" title="'+esc(label)+'" sandbox="allow-same-origin" srcdoc="'+esc('<!doctype html><meta charset=utf-8><meta name=viewport content=width=device-width,initial-scale=1><style>body{margin:0;padding:8px;font-family:system-ui,sans-serif;overflow:hidden}*{box-sizing:border-box}</style>'+designCode(e))+'"></iframe></section>';}).join('');
 const html='<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(builder.title)+'</title><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:'+bg+';font-family:'+ (builder.font==='Georgia'?'Georgia,serif':'Inter,system-ui,sans-serif') +';color:#182033}.app{max-width:460px;margin:20px auto;background:white;border-radius:'+r+'px;padding:24px;box-shadow:0 20px 60px #1d2b4a18}.mark{width:42px;height:42px;display:grid;place-items:center;border-radius:14px;background:'+accent+';color:white;font-size:22px}small{color:#7c8497;letter-spacing:1px}h1{font-size:32px;line-height:1.05;margin:20px 0 8px}p{color:#737b8d;line-height:1.5}.primary{margin:18px 0;padding:14px 18px;border:0;border-radius:'+r+'px;background:'+accent+';color:white;font-weight:700}.component{margin-top:18px;padding:16px;border:1px solid #e8eaf0;border-radius:'+r+'px;overflow:hidden}.component h2{font-size:16px;margin:8px 0}.component p{font-size:13px}.component-meta{display:flex;justify-content:space-between;font-size:10px;color:#8991a2;text-transform:uppercase;letter-spacing:.08em}.component iframe{display:block;width:100%;height:230px;border:0;border-radius:12px;background:#f7f8fb;margin-top:12px}.sample{margin-top:12px;padding:14px;border-radius:'+r+'px;background:'+bg+';color:'+accent+';font-weight:700}</style><main class="app"><div class="mark">✦</div><small>DISEÑADO CON ESTILOS</small><h1>'+esc(builder.title)+'</h1><p>'+esc(builder.subtitle)+'</p><button class="primary">Descubrir más ↗</button>'+components+'</main></html>';
 const blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mi-pantalla-estilos.html';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('Pantalla HTML preparada');
}

function renderFavs() {
  const l = favs.map(getEntry).filter(Boolean);
  return '<div class="wrap"><div><h1 class="big">Guardados</h1><div class="sub">' + l.length + ' estilos marcados</div></div>'
    + (l.length ? '<div class="grid">' + l.map(e => cardHTML(e, true)).join("") + '</div>' : '<div class="empty"><b>Aún no guardaste estilos</b><span>Toca el corazón en cualquier tarjeta.</span></div>') + '</div>';
}

function palText(e, fmt) {
  const c = e.colors;
  if (fmt === "css") return ":root{\n" + c.map((x, i) => "  --color-" + (i + 1) + ": " + x + ";").join("\n") + "\n}";
  if (fmt === "tailwind") return "// tailwind.config.js → theme.extend\ncolors: {\n" + c.map((x, i) => "  c" + (i + 1) + ": '" + x + "',").join("\n") + "\n}";
  if (fmt === "json") return JSON.stringify(c);
  return c.join("\n");
}
const STAGE_LABEL = { auto: "Automático", light: "Claro", dark: "Oscuro", white: "Blanco" };
const STAGE_NEXT = { auto: "light", light: "dark", dark: "white", white: "auto" };

function renderDetail() {
  const e = getEntry(S.id); if (!e) { S.view = "explore"; return renderExplore(); }
  const t = tokens(e), ratio = contrast(t.a, t.on), w = wcag(ratio);
  const fav = favs.includes(e.id), codeTab = S.detailTab === "code";
  const code = designCode(e);
  const rel = db().filter(x => x.tab === e.tab && x.id !== e.id).slice(0, 8);
  const info = '<div class="panel"><h3>Paleta</h3><div class="swRow" style="margin:0">' + swatches(e) + '</div>'
    + '<div class="fmt"><span class="sub" style="align-self:center">Copiar como</span>' + ["hex", "css", "tailwind", "json"].map(f => '<button data-act="pal" data-f="' + f + '" data-id="' + esc(e.id) + '">' + (f === "hex" ? "HEX" : f === "css" ? "CSS" : f === "tailwind" ? "Tailwind" : "JSON") + '</button>').join("") + '</div></div>'
    + '<div class="panel"><h3>Detalles</h3>'
    + '<div class="row"><span>Categoría</span><b>' + esc(e.tab) + '</b></div>'
    + '<div class="row"><span>Modo</span><b>' + (e.mode === "dark" ? "Oscuro" : "Claro") + '</b></div>'
    + '<div class="row"><span>Radio</span><b>' + esc(e.radius) + (String(e.radius).indexOf("%") < 0 ? " px" : "") + '</b></div>'
    + '<div class="row"><span>Contraste del acento</span><b>' + ratio.toFixed(1) + ':1 <span class="badge ' + (ratio >= 4.5 ? "ok" : ratio >= 3 ? "mid" : "bad") + '">' + esc(w) + '</span></b></div>'
    + '<div class="row"><span>Consejo</span><b style="font-weight:600;max-width:62%">' + esc(e.tip) + '</b></div></div>'
    + (rel.length ? '<h2 class="sec">Más de ' + esc(e.tab) + '</h2><div class="rail">' + rel.map(miniHTML).join("") + '</div>' : '');
  const codePanel = '<div class="codeBox"><div class="codeHead"><span>HTML + CSS · ' + code.split("\n").length + ' líneas</span><button data-act="copycode" data-id="' + esc(e.id) + '">' + ic("copy", 14) + ' Copiar</button></div><pre><code>' + esc(code) + '</code></pre></div>'
    + '<p class="sub">Autocontenido: pégalo en tu proyecto. Los iconos van en SVG inline, sin librerías.</p>';
  return '<div class="wrap detail">'
    + '<div class="dTop"><button class="ib" data-act="back" aria-label="Volver">' + ic("back", 22, 2.4) + '</button><button class="ib" data-act="surprise" aria-label="Otro estilo al azar">' + ic("spark", 20) + '</button></div>'
    + '<div class="' + stageCls(e, S.stage) + ' dStage">' + pv(e) + '</div>'
    + '<div class="dStageBar"><button class="pillbtn" data-act="stage">' + ic(S.stage === "dark" ? "moon" : "sun", 14) + ' Fondo: ' + STAGE_LABEL[S.stage] + '</button></div>'
    + '<div><div class="dName">' + esc(e.name) + '</div><div class="sub" style="margin-top:4px;font-size:13px">' + esc(e.tab) + (e.ref ? " · " + esc(e.ref) : "") + '</div></div>'
    + '<p class="dDesc">' + esc(e.desc) + '</p>'
    + '<div class="seg" role="tablist"><button class="' + (codeTab ? "" : "on") + '" role="tab" data-act="dtab" data-d="info">Detalles</button><button class="' + (codeTab ? "on" : "") + '" role="tab" data-act="dtab" data-d="code">Código</button></div>'
    + (codeTab ? codePanel : info)
    + '<button class="cta danger" data-act="del" data-id="' + esc(e.id) + '">' + ic("trash", 16) + ' Eliminar este estilo</button></div>';
}

function navHTML() {
  const item = (v, icon, label) => '<button class="ni' + (S.view === v ? " nia" : "") + '" data-act="nav" data-v="' + v + '" aria-label="' + label + '"' + (S.view === v ? ' aria-current="page"' : "") + '>' + icon + (S.view === v ? '<span>' + label + '</span>' : "") + '</button>';
  return item("home", ic("home", 22), "Inicio") + item("explore", ic("grid", 22), "Explorar") + item("builder", ic("plus", 22), "Crear") + item("favs", ic("bookmark", 22), "Guardados") + '<button class="ni" data-act="menu" aria-label="Ajustes">' + ic("sliders", 22) + '</button>';
}

function render(keepScroll) {
  const v = document.getElementById("view"), top = v.scrollTop;
  v.innerHTML = S.view === "home" ? renderHome() : S.view === "explore" ? renderExplore() : S.view === "favs" ? renderFavs() : S.view === "builder" ? renderBuilder() : renderDetail();
  hydrate(v);
  const nav = document.getElementById("nav"), act = document.getElementById("actbar");
  if (S.view === "detail") {
    const fav = favs.includes(S.id);
    nav.style.display = "none"; act.style.display = "flex";
    act.innerHTML = '<button class="main" data-act="copycode" data-id="' + esc(S.id) + '">' + ic("copy", 16) + ' Copiar código</button>'
      + '<button class="fav' + (fav ? " on" : "") + '" data-act="fav" data-id="' + esc(S.id) + '" aria-label="' + (fav ? "Quitar de guardados" : "Guardar") + '">' + (fav ? icf("bookmark", 20) : ic("bookmark", 20)) + '</button>'
      + '<button data-act="edit" data-id="' + esc(S.id) + '" aria-label="Editar">' + ic("edit", 20) + '</button>';
  } else {
    nav.style.display = "flex"; act.style.display = "none"; nav.innerHTML = navHTML();
  }
  v.scrollTop = keepScroll ? top : 0;
}
function renderList() {
  const el = document.getElementById("list"); if (!el) return;
  el.innerHTML = listHTML(); hydrate(el);
  const c = document.getElementById("count"); if (c) c.textContent = (S.q ? listFor().length + " resultados en todas las categorías" : listFor().length + " estilos");
  const h = document.querySelector("h1.big"); if (h) h.textContent = S.q ? "Búsqueda" : S.tab;
  document.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", !S.q && x.dataset.t === S.tab));
}

/* ───────── Hojas (formularios, menú, confirmaciones) ───────── */
function openSheet(html) { document.getElementById("sheetCard").innerHTML = html; document.getElementById("sheetWrap").style.display = "flex"; }
function closeSheet() { document.getElementById("sheetWrap").style.display = "none"; pendingConfirm = null; }
function askConfirm(title, text, okLabel, onOk) {
  pendingConfirm = onOk;
  openSheet('<div class="handle"></div><h2>' + esc(title) + '</h2><span class="sub">' + esc(text) + '</span><div class="two"><button class="cta ghost" data-act="closesheet">Cancelar</button><button class="cta danger" data-act="confirm">' + esc(okLabel) + '</button></div>');
}
function variantOptions(tab, current) {
  const fam = TAB_FAMILY[tab], keys = Object.keys(D).filter(k => fam && k.indexOf(fam + ".") === 0);
  if (!keys.length) return '<option value="">Paleta (por defecto)</option>';
  return keys.map(k => '<option value="' + esc(k) + '"' + (k === current ? " selected" : "") + '>' + esc(k.split(".")[1]) + '</option>').join("");
}
function openForm(id) {
  const e = id ? getEntry(id) : null;
  S.editId = id || null;
  const tabs = allTabs().filter(t => t !== "Referencias");
  const tabSel = (e ? e.tab : S.tab) || tabs[0];
  openSheet('<div class="handle"></div><h2>' + (e ? "Editar estilo" : "Añadir estilo") + '</h2>'
    + '<label class="l">Nombre</label><input class="fld" id="f-name" maxlength="80" value="' + esc(e ? e.name : "") + '">'
    + '<label class="l">Categoría</label><select class="fld" id="f-tab" data-input="tabsel">' + tabs.map(t => '<option' + (t === tabSel ? " selected" : "") + '>' + esc(t) + '</option>').join("") + '<option value="__new">+ Nueva categoría…</option></select>'
    + '<input class="fld" id="f-newtab" style="display:none" maxlength="30" placeholder="Nombre de la categoría nueva">'
    + '<label class="l">Diseño base (define la vista previa y el código)</label><select class="fld" id="f-v">' + variantOptions(tabSel, e ? e.v : "") + '</select>'
    + '<label class="l">Referencia</label><input class="fld" id="f-ref" maxlength="80" value="' + esc(e ? e.ref : "") + '">'
    + '<label class="l">Descripción</label><textarea class="fld" id="f-desc" rows="2" maxlength="400">' + esc(e ? e.desc : "") + '</textarea>'
    + '<label class="l">Colores (hex separados por coma, máx. 6)</label><input class="fld" id="f-colors" value="' + esc(e ? e.colors.join(", ") : "#2F6BFF, #FFFFFF, #14161B") + '">'
    + '<label class="l">Radio (px o %)</label><input class="fld" id="f-radius" maxlength="4" value="' + esc(e ? e.radius : "16") + '">'
    + '<label class="l">Consejo</label><textarea class="fld" id="f-tip" rows="2" maxlength="300">' + esc(e ? e.tip : "") + '</textarea>'
    + '<label class="l">Modo</label><select class="fld" id="f-mode"><option value="light"' + (e && e.mode === "dark" ? "" : " selected") + '>Claro</option><option value="dark"' + (e && e.mode === "dark" ? " selected" : "") + '>Oscuro</option></select>'
    + '<label class="l">Código propio (opcional · reemplaza al diseño base)</label><textarea class="fld" id="f-code" rows="3" maxlength="4000">' + esc(e ? e.code || "" : "") + '</textarea>'
    + '<div class="btns"><button class="cta" data-act="saveform">Guardar</button><button class="cta ghost" data-act="closesheet">Cancelar</button></div>');
}
function saveForm() {
  const val = id => document.getElementById(id).value.trim();
  let tab = document.getElementById("f-tab").value;
  if (tab === "__new") { tab = val("f-newtab"); if (!tab) return toast("Escribe la categoría"); }
  if (!val("f-name")) return toast("Ponle un nombre");
  const raw = { id: S.editId, name: val("f-name"), tab, v: document.getElementById("f-v").value, ref: val("f-ref"), desc: val("f-desc"), colors: val("f-colors"), radius: val("f-radius"), tip: val("f-tip"), mode: document.getElementById("f-mode").value, code: val("f-code") };
  const n = normalize(raw); if (!n) return toast("Revisa los datos");
  if (S.editId) {
    if (SEED_IDS.has(S.editId)) { const o = Object.assign({}, n); delete o.id; user.edits[S.editId] = o; }
    else { const i = user.added.findIndex(x => x.id === S.editId); if (i >= 0) { n.id = S.editId; user.added[i] = n; } }
  } else { user.added.push(n); }
  const wasEdit = !!S.editId;
  if (!saveUser()) return;
  closeSheet(); render(true); toast(wasEdit ? "Estilo actualizado" : "Estilo añadido");
}
function deleteEntry(id) {
  if (SEED_IDS.has(id)) { if (!user.deleted.includes(id)) user.deleted.push(id); delete user.edits[id]; }
  else user.added = user.added.filter(x => x.id !== id);
  favs = favs.filter(x => x !== id); saveFavs(); saveUser();
  closeSheet(); toast("Eliminado");
  go({ view: "explore", id: null }, { replace: true });
}
function openMenu() {
  const bak = !!localStorage.getItem(KEY_BAK);
  openSheet('<div class="handle"></div><h2>Estilos</h2><span class="sub">v' + APP_VERSION + ' · ' + db().length + ' estilos · ' + REFS.length + ' referencias · Sin internet · Datos en tu teléfono</span>'
    + '<label class="l">Tus cambios (JSON)</label><textarea class="fld" id="ioText" rows="6" placeholder="Exporta para ver o pega un JSON para importar"></textarea>'
    + '<div class="btns"><button class="cta" data-act="export">Exportar mis cambios</button><div class="two"><button class="cta ghost" data-act="copyio">Copiar</button><button class="cta ghost" data-act="import">Importar</button></div>'
    + (bak ? '<button class="cta ghost" data-act="backup">Ver respaldo de la versión 1.5</button>' : '')
    + '<button class="cta ghost" data-act="restore">Restaurar el catálogo original</button><button class="cta ghost" data-act="closesheet">Cerrar</button></div>');
}
function doExport() {
  document.getElementById("ioText").value = JSON.stringify({ app: "estilos", version: APP_VERSION, added: user.added, edits: user.edits, deleted: user.deleted }, null, 2);
  toast("Listo para copiar");
}
function doImport() {
  try {
    const raw = JSON.parse(document.getElementById("ioText").value);
    let n = 0;
    const src = Array.isArray(raw) ? { added: raw, edits: {}, deleted: [] } : raw;
    if (!src || typeof src !== "object") throw 0;
    (Array.isArray(src.added) ? src.added : []).forEach(x => {
      const e = normalize(x); if (!e) return;
      if (SEED_IDS.has(e.id)) { const o = Object.assign({}, e); delete o.id; user.edits[e.id] = o; }
      else { const i = user.added.findIndex(a => a.id === e.id); if (i >= 0) user.added[i] = e; else user.added.push(e); }
      n++;
    });
    Object.keys(src.edits || {}).forEach(id => { if (SEED_IDS.has(safeId(id))) { const e = normalize(Object.assign({ name: "x", tab: "x" }, src.edits[id])); if (e) { delete e.id; const part = {}; Object.keys(src.edits[id]).forEach(k => { if (k in e && k !== "id") part[k] = e[k]; }); user.edits[safeId(id)] = part; n++; } } });
    (Array.isArray(src.deleted) ? src.deleted : []).forEach(id => { id = safeId(id); if (SEED_IDS.has(id) && !user.deleted.includes(id)) user.deleted.push(id); });
    if (!n && !(src.deleted || []).length) throw 0;
    if (!saveUser()) return;
    closeSheet(); render(true); toast("Importado: " + n + " cambios");
  } catch (e) { toast("JSON no válido"); }
}

/* ───────── Eventos (delegación) ───────── */
function openLB(i) {
  const r = REFS[i]; if (!r) return;
  document.getElementById("lbImg").src = r.img; document.getElementById("lbImg").alt = r.label;
  document.getElementById("lbCap").textContent = r.label; document.getElementById("lightbox").style.display = "flex";
}
function closeLB() { document.getElementById("lightbox").style.display = "none"; }
function toggleFav(id) {
  const i = favs.indexOf(id);
  if (i >= 0) { favs.splice(i, 1); toast("Quitado de guardados"); } else { favs.push(id); toast("Guardado"); }
  saveFavs(); render(true);
}
function surprise() {
  const pool = db().filter(e => e.id !== S.id); if (!pool.length) return;
  go({ view: "detail", id: pool[Math.floor(Math.random() * pool.length)].id, detailTab: "info" });
}

const ACT = {
  open: d => go({ view: "detail", id: d.id, detailTab: "info", stage: "auto" }),
  back: () => goBack(),
  nav: d => go({ view: d.v, q: d.v === "explore" ? S.q : "" }),
  tab: d => go({ view: "explore", tab: d.t, q: "" }),
  gosearch: () => { go({ view: "explore", q: "" }); const q = document.getElementById("q"); if (q) q.focus(); },
  fav: d => toggleFav(d.id),
  color: d => copyText(d.c, "Copiado: " + d.c),
  pal: d => { const e = getEntry(d.id); if (e) copyText(palText(e, d.f), "Paleta copiada (" + d.f.toUpperCase() + ")"); },
  copycode: d => { const e = getEntry(d.id); if (e) copyText(designCode(e), "Código copiado"); },
  dtab: d => go({ detailTab: d.d }, { replace: true, keep: true }),
  stage: () => go({ stage: STAGE_NEXT[S.stage] }, { replace: true, keep: true }),
  surprise: () => surprise(),
  add: () => openForm(),
  edit: d => openForm(d.id),
  saveform: () => saveForm(),
  del: d => askConfirm("¿Eliminar este estilo?", "Dejará de aparecer en la biblioteca. Puedes recuperarlo con «Restaurar el catálogo original».", "Eliminar", () => deleteEntry(d.id)),
  confirm: () => { const f = pendingConfirm; pendingConfirm = null; if (f) f(); },
  menu: () => openMenu(),
  export: () => doExport(),
  copyio: () => copyText(document.getElementById("ioText").value, "Copiado"),
  import: () => doImport(),
  backup: () => { document.getElementById("ioText").value = localStorage.getItem(KEY_BAK) || ""; toast("Respaldo de la v1.5 cargado"); },
  restore: () => askConfirm("¿Restaurar el catálogo?", "Se deshacen tus ediciones y borrados del catálogo. Lo que creaste tú se conserva.", "Restaurar", () => { user.edits = {}; user.deleted = []; saveUser(); closeSheet(); render(true); toast("Catálogo restaurado"); }),
  builderreset: () => askConfirm("Restablecer constructor", "Se borrarán los componentes y ajustes de esta pantalla.", "Restablecer", () => { builder={title:"Mi nueva interfaz",subtitle:"Una experiencia diseñada a tu manera",palette:"#635BFF",bg:"#F5F6FA",font:"Inter",radius:20,selected:[],layers:[],activeLayer:0};saveBuilder();closeSheet();render(); }),
  builderselect: d => { builder.activeLayer=Math.max(0,Math.min(builder.selected.length-1,Number(d.index)||0));saveBuilder();render(true); },
  builderremove: d => { const i=Number(d.index); if(Number.isInteger(i)&&i>=0&&i<builder.selected.length){builder.selected.splice(i,1);builder.layers.splice(i,1);builder.activeLayer=Math.max(0,Math.min(builder.selected.length-1,builder.activeLayer));} else builder.selected=builder.selected.filter(id=>id!==d.id); saveBuilder();render(true); },
  buildermove: d => { const i=Number(d.index),to=i+Number(d.dir); if(Number.isInteger(i)&&to>=0&&to<builder.selected.length){const item=builder.selected.splice(i,1)[0];builder.selected.splice(to,0,item);const layer=builder.layers.splice(i,1)[0];builder.layers.splice(to,0,layer);builder.activeLayer=to;saveBuilder();render(true);} },
  builderduplicate: d => { const i=Number(d.index); if(builder.selected.length>=12){toast('Máximo doce capas');return;} if(Number.isInteger(i)&&i>=0&&i<builder.selected.length){builder.selected.splice(i+1,0,builder.selected[i]);const copy=Object.assign({},builder.layers[i]||{}, {uid:"layer-"+Math.random().toString(36).slice(2,9)});builder.layers.splice(i+1,0,copy);builder.activeLayer=i+1;saveBuilder();render(true);toast('Componente duplicado');} },
  builderexport: () => exportBuilder(),
  closesheet: () => closeSheet(),
  lb: d => openLB(+d.i),
  closelb: () => closeLB()
};
document.addEventListener("click", ev => {
  const el = ev.target.closest("[data-act]");
  if (el && ACT[el.dataset.act]) { ev.stopPropagation(); ACT[el.dataset.act](el.dataset); return; }
  if (ev.target.id === "sheetWrap") closeSheet();
});
document.addEventListener("keydown", ev => {
  if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches && ev.target.matches('article[data-act="open"]')) { ev.preventDefault(); ACT.open(ev.target.dataset); }
  if (ev.key === "Escape") { closeSheet(); closeLB(); }
});
document.addEventListener("input", ev => {
  const t = ev.target;
  if (t.dataset && t.dataset.input === "q") { S.q = t.value; renderList(); }
  if (t.dataset && t.dataset.builder) { builder[t.dataset.builder] = t.type === "range" ? Number(t.value) : t.value; saveBuilder(); const old=document.querySelector(".builder-preview"); if(old){const fresh=renderBuilder();const tmp=document.createElement("div");tmp.innerHTML=fresh;const next=tmp.querySelector(".builder-preview");old.replaceWith(next);hydrate(next);} }
  if (t.dataset && t.dataset.layerField !== undefined) { const i=Number(t.dataset.index); if(!builder.layers[i]) return; const k=t.dataset.layerField; builder.layers[i][k]=(t.type==="range")?Number(t.value):t.value; saveBuilder(); const old=document.querySelector(".builder-preview"); if(old){const fresh=renderBuilder();const tmp=document.createElement("div");tmp.innerHTML=fresh;const next=tmp.querySelector(".builder-preview");old.replaceWith(next);hydrate(next);} const label=document.querySelector('.layer-select[data-index="'+i+'"] b'); if(label&&k==="label") label.textContent=t.value||((getEntry(builder.selected[i])||{}).name||"Componente"); }
});
let builderDragIndex = null;
document.addEventListener("dragstart", ev => {
  const layer = ev.target.closest && ev.target.closest("[data-layer-index]");
  if (!layer) return;
  builderDragIndex = Number(layer.dataset.layerIndex);
  if (ev.dataTransfer) { ev.dataTransfer.effectAllowed = "move"; ev.dataTransfer.setData("text/plain", String(builderDragIndex)); }
  layer.classList.add("dragging");
});
document.addEventListener("dragend", ev => {
  const layer = ev.target.closest && ev.target.closest("[data-layer-index]");
  if (layer) layer.classList.remove("dragging");
  builderDragIndex = null;
});
document.addEventListener("dragover", ev => {
  const layer = ev.target.closest && ev.target.closest("[data-layer-index]");
  if (layer && builderDragIndex !== null) ev.preventDefault();
});
document.addEventListener("drop", ev => {
  const layer = ev.target.closest && ev.target.closest("[data-layer-index]");
  if (!layer || builderDragIndex === null) return;
  ev.preventDefault();
  const target = Number(layer.dataset.layerIndex), from = builderDragIndex;
  if (from !== target && from >= 0 && target >= 0 && from < builder.selected.length && target < builder.selected.length) {
    const moved = builder.selected.splice(from, 1)[0];
    builder.selected.splice(target, 0, moved);
    const movedLayer = builder.layers.splice(from, 1)[0]; builder.layers.splice(target, 0, movedLayer);
    builder.activeLayer = target;
    saveBuilder(); render(true); toast("Orden de capas actualizado");
  }
  builderDragIndex = null;
});

document.addEventListener("change", ev => {
  const t = ev.target;
  if (t.dataset && t.dataset.builderSelect) {
    if (t.value) { if (builder.selected.length < 12) { builder.selected.push(t.value); builder.layers.push({uid:"layer-"+Math.random().toString(36).slice(2,9),label:"",bg:"#FFFFFF",color:"#263247",radius:16,padding:12}); builder.activeLayer=builder.selected.length-1; } else toast("Máximo doce componentes"); saveBuilder(); render(true); }
    return;
  }
  if (t.dataset && t.dataset.builder) { builder[t.dataset.builder] = t.type === "range" ? Number(t.value) : t.value; saveBuilder(); render(true); return; }
  if (t.dataset && t.dataset.input === "tabsel") {
    document.getElementById("f-newtab").style.display = t.value === "__new" ? "block" : "none";
    document.getElementById("f-v").innerHTML = variantOptions(t.value, "");
  }
});

/* ───────── Arranque ───────── */
try { history.replaceState(S, ""); } catch (e) { /* ignorar */ }
render();
if (migrated) setTimeout(() => toast("Actualizado a v" + APP_VERSION + ". Tu copia anterior está en Ajustes."), 600);
