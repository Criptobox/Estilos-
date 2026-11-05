/* Estilos · lógica de la app.
   - Catálogo inmutable (SEED) + capa del usuario (añadidos, ediciones, borrados).
   - Sin onclick en línea: todos los eventos usan data-act (delegación), así ningún dato
     importado puede inyectar código.
   - Navegación con la API de historial (el botón Atrás del sistema funciona). */

/* ───────── Almacenamiento ───────── */
const KEY_USER = "estilos-user-v2", KEY_OLD = "estilos-db-v1", KEY_BAK = "estilos-db-v1-backup", KEY_FAV = "estilos-favs-v1", KEY_THEME = "estilos-theme", KEY_DIM = "estilos-dim";
const BASE_TABS = ["Chat", "Tarjetas", "Listas", "Avatares", "Plantillas", "Barras", "Botones", "Formularios", "Entradas", "Hojas", "Avisos", "Datos", "Paletas", "Tipografía", "Encabezados", "Animaciones", "Fondos", "Widgets", "Iconos"];
const TAB_ICON = { Chat: "chat", Tarjetas: "card", Listas: "menu", Avatares: "user", Plantillas: "grid", Barras: "sliders", Botones: "plus", Formularios: "edit", Entradas: "search", Hojas: "arrowUp", Avisos: "bell", Datos: "chart", Paletas: "spark", "Tipografía": "type", Encabezados: "layers", Animaciones: "spark", Fondos: "image", Widgets: "grid", Iconos: "spark", Referencias: "image" };
const TAB_FAMILY = { Chat: "chat", Tarjetas: "card", Listas: "list", Avatares: "avatar", Plantillas: "tpl", Barras: "bar", Botones: "btn", Formularios: "form", Entradas: "input", Hojas: "sheet", Avisos: "notice", Datos: "data", Paletas: "pal", "Tipografía": "type", Encabezados: "head", Animaciones: "motion", Fondos: "background", Widgets: "widget", Iconos: "icon" };

function readJSON(k, fb) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch (e) { return fb; } }
function writeJSON(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); AutoBackup.touch(); return true; }
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

/* ───────── Tema de la app (auto / claro / oscuro) ───────── */
/* Biblioteca: cada categoría con su degradado, y su grupo (Fundamentos o Componentes). */
const TAB_GRAD = { Chat: "#3B82F6,#6366F1", Tarjetas: "#8B5CF6,#EC4899", Listas: "#06B6D4,#3B82F6", Avatares: "#F97316,#F43F5E", Plantillas: "#2563EB,#22D3EE", Barras: "#A855F7,#6366F1", Botones: "#3B82F6,#6366F1", Formularios: "#14B8A6,#38BDF8", Entradas: "#06B6D4,#3B82F6", Hojas: "#8B5CF6,#6366F1", Avisos: "#F59E0B,#F43F5E", Datos: "#10B981,#06B6D4", Paletas: "#F59E0B,#EC4899", "Tipografía": "#6366F1,#38BDF8", Encabezados: "#A855F7,#EC4899", Animaciones: "#D946EF,#8B5CF6", Fondos: "#0EA5E9,#6366F1", Widgets: "#22C55E,#14B8A6", Iconos: "#14B8A6,#38BDF8", Referencias: "#EC4899,#F97316" };
const FUNDAMENTOS = ["Paletas", "Tipografía", "Fondos", "Iconos", "Animaciones", "Referencias"];
const LIB_GROUPS = ["Todo", "Fundamentos", "Componentes"];
const RECENT_KEY = "estilos-recent";
function tabGrad(t, i) { const g = TAB_GRAD[t] || ["#8B5CF6,#4F8DFF", "#6366F1,#38BDF8", "#D946EF,#8B5CF6"][(i || 0) % 3]; return "linear-gradient(135deg," + g + ")"; }
function recentIds() { const r = readJSON(RECENT_KEY, []); return Array.isArray(r) ? r.map(safeId).filter(Boolean) : []; }
function trackRecent(id) { id = safeId(id); if (!id) return; const r = recentIds().filter(x => x !== id); r.unshift(id); try { localStorage.setItem(RECENT_KEY, JSON.stringify(r.slice(0, 8))); } catch (e) { /* ignorar */ } }
const THEMES = ["auto", "light", "dark"];
const THEME_LABEL = { auto: "Automático", light: "Claro", dark: "Oscuro" };
const THEME_ICON = { auto: "auto", light: "sun", dark: "moon" };
const darkMQ = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
let theme = (function () { try { const t = localStorage.getItem(KEY_THEME); return THEMES.includes(t) ? t : "dark"; } catch (e) { return "dark"; } })();
function isDark() { return theme === "dark" || (theme === "auto" && !!(darkMQ && darkMQ.matches)); }
function applyTheme() {
  const d = isDark();
  document.documentElement.setAttribute("data-theme", d ? "dark" : "light");
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = d ? "#0A0B1E" : "#E9E4FF";
}
function setTheme(t) {
  theme = THEMES.includes(t) ? t : "dark";
  try { localStorage.setItem(KEY_THEME, theme); } catch (e) { /* sin almacenamiento: dura la sesión */ }
  applyTheme();
}
function themeSegHTML() {
  return '<div class="seg themeSeg" role="radiogroup" aria-label="Tema">' + THEMES.map(t => '<button role="radio" aria-checked="' + (t === theme) + '" class="' + (t === theme ? "on" : "") + '" data-act="theme" data-t="' + t + '">' + ic(THEME_ICON[t], 14) + THEME_LABEL[t] + '</button>').join("") + '</div>';
}
if (darkMQ) {
  const onSys = () => { if (theme === "auto") applyTheme(); };
  darkMQ.addEventListener ? darkMQ.addEventListener("change", onSys) : darkMQ.addListener(onSys);
}
applyTheme();

/* Atenuar las vistas previas claras de las listas en modo oscuro (el detalle se ve siempre tal cual). */
let dimPreviews = (function () { try { return localStorage.getItem(KEY_DIM) === "1"; } catch (e) { return false; } })();
function applyDim() { document.documentElement.toggleAttribute("data-dim", dimPreviews); }
applyDim();

/* ───────── Estado y navegación ───────── */
let S = { view: "home", tab: "Tarjetas", id: null, q: "", detailTab: "info", stage: "auto", stack: "html", group: "Todo" };
const BUILDER_FONTS = ["Inter", "Plus Jakarta Sans", "Georgia"];
/* Calidad con la que se guardan las imágenes que el usuario reemplaza (px máximos, calidad WebP/JPEG y topes en caracteres de la data URL). */
const IMAGE_QUALITY = {
  high: { n: "Alta", max: 1600, q: .86, jq: .8, soft: 1600000, hard: 2200000 },
  mid: { n: "Media", max: 1000, q: .78, jq: .68, soft: 850000, hard: 1000000 },
  low: { n: "Baja", max: 640, q: .6, jq: .5, soft: 300000, hard: 400000 }
};
let builder = sanitizeBuilder(readJSON("estilos-builder-v1", null));
let builderCollapsedGroups = new Set();
let builderHistory=[],builderFuture=[],builderHistoryBusy=false,builderHistoryLast="",builderHistoryNeedsCheckpoint=false;
const BUILDER_HISTORY_MAX_STEPS=60,BUILDER_HISTORY_MAX_CHARS=12000000,BUILDER_HISTORY_MAX_SINGLE=8000000;
function builderHistoryTrim(){
  let chars=builderHistory.reduce((n,s)=>n+s.length,0)+builderFuture.reduce((n,s)=>n+s.length,0);
  while((builderHistory.length+builderFuture.length)>BUILDER_HISTORY_MAX_STEPS||chars>BUILDER_HISTORY_MAX_CHARS){
    let removed=null;
    if(builderHistory.length>1)removed=builderHistory.shift();
    else if(builderFuture.length)removed=builderFuture.shift();
    else if(builderHistory.length)removed=builderHistory.shift();
    else break;
    chars-=removed.length;
  }
}
function builderHistorySnapshot(){
  if(builderHistoryBusy)return;
  syncActiveScreen();
  const snap=JSON.stringify(builder);
  builderFuture=[];
  if(snap===builderHistoryLast&&!builderHistoryNeedsCheckpoint)return;
  builderHistoryNeedsCheckpoint=false;
  if(snap.length>BUILDER_HISTORY_MAX_SINGLE){
    builderHistory=[];builderFuture=[];builderHistoryLast=snap;builderHistoryPersist();
    toast("Este proyecto es demasiado grande para guardar más pasos en el historial");
    return;
  }
  builderHistory.push(snap);
  builderHistoryLast=snap;
  builderHistoryTrim();
  builderHistoryPersist();
}
function builderHistoryRestore(from,to){
  if(!from.length){toast("No hay más cambios para recuperar");return;}
  syncActiveScreen();
  const current=JSON.stringify(builder);
  if(current.length>BUILDER_HISTORY_MAX_SINGLE){toast("El proyecto actual es demasiado grande para restaurar el historial");return;}
  const target=from.pop();to.push(current);builderHistoryTrim();
  builderHistoryBusy=true;
  try{
    builder=sanitizeBuilder(JSON.parse(mediaInflate(target)));
    loadActiveScreen();
    saveBuilder();
    render(true);
    // Force the next edit after undo/redo to establish a fresh branch checkpoint.
    builderHistoryLast=JSON.stringify(builder);
    builderHistoryNeedsCheckpoint=true;
    builderHistoryPersist();
  }finally{builderHistoryBusy=false;}
  toast(from===builderHistory?"Cambio deshecho":"Cambio recuperado");
}
const HIST_KEY = "estilos-builder-hist-v1", strippedCache = new Map();
let histTimer = 0;
function builderHistoryPersist() { clearTimeout(histTimer); histTimer = setTimeout(builderHistoryPersistNow, 400); }
function builderHistoryPersistNow() {
  clearTimeout(histTimer);
  try {
    const hs = x => { let r = strippedCache.get(x); if (r === undefined) { r = mediaStrip(x); strippedCache.set(x, r); } return r; };
    const d = JSON.stringify({ h: builderHistory.map(hs), f: builderFuture.map(hs) });
    if (strippedCache.size > 200) strippedCache.clear();
    if (d.length > 1800000 || /"data:image\//.test(d)) sessionStorage.removeItem(HIST_KEY); else sessionStorage.setItem(HIST_KEY, d);
  } catch (e) { /* sin sessionStorage o lleno: el historial dura lo que dure la página */ }
}
function builderHistoryLoad() {
  try {
    const o = JSON.parse(sessionStorage.getItem(HIST_KEY) || "null");
    if (!o || !Array.isArray(o.h) || !Array.isArray(o.f) || builderHistory.length || builderFuture.length) return;
    builderHistory = o.h.filter(x => typeof x === "string").slice(-BUILDER_HISTORY_MAX_STEPS);
    builderFuture = o.f.filter(x => typeof x === "string").slice(0, BUILDER_HISTORY_MAX_STEPS);
    builderHistoryLast = mediaInflate(builderHistory[builderHistory.length - 1] || "");
  } catch (e) { /* ignorar */ }
}
addEventListener("pagehide", () => builderHistoryPersistNow());
function builderUndo(){builderHistoryRestore(builderHistory,builderFuture);}
function builderRedo(){builderHistoryRestore(builderFuture,builderHistory);}


function cleanLayer(id, raw) {
  const l=raw&&typeof raw==="object"?raw:{};
  return {uid:String(l.uid||("layer-"+Math.random().toString(36).slice(2,9))).slice(0,40),label:String(l.label||"").slice(0,70),
    bg:safeColor(l.bg||"#FFFFFF"),color:safeColor(l.color||"#263247"),radius:Math.max(6,Math.min(32,Number(l.radius)||16)),
    padding:Math.max(4,Math.min(32,Number(l.padding)||12)),fontSize:Math.max(10,Math.min(30,Number(l.fontSize)||14)),
    weight:["400","500","600","700","800"].includes(String(l.weight))?String(l.weight):"600",
    align:["left","center","right"].includes(l.align)?l.align:"left",borderColor:safeColor(l.borderColor||"#E8EAF0"),
    borderWidth:Math.max(0,Math.min(5,Number(l.borderWidth)||0)),shadow:!!l.shadow,
    offsetX:Math.max(-40,Math.min(40,Number(l.offsetX)||0)),offsetY:Math.max(-40,Math.min(40,Number(l.offsetY)||0)),
    width:Math.max(50,Math.min(100,Number(l.width)||100)),
    variant:["default","glass","soft","outline","bold"].includes(l.variant)?l.variant:"default",
    animation:["none","fade","rise","zoom","float","pulse"].includes(l.animation)?l.animation:"none",
    duration:Math.max(300,Math.min(3000,Number(l.duration)||700)),
    elevation:Math.max(0,Math.min(5,Number(l.elevation??(l.shadow?2:0)))),
    borderStyle:["solid","dashed","dotted"].includes(l.borderStyle)?l.borderStyle:"solid",hidden:!!l.hidden,locked:!!l.locked,group:String(l.group||"").slice(0,40),textEdits:l.textEdits&&typeof l.textEdits==="object"?Object.fromEntries(Object.entries(l.textEdits).slice(0,40).map(([k,v])=>[String(k).slice(0,300),String(v).slice(0,500)])): {},editMeta:l.editMeta&&typeof l.editMeta==="object"?Object.fromEntries(Object.entries(l.editMeta).slice(0,80).filter(([k,v])=>v&&typeof v==="object").map(([k,v])=>[String(k).slice(0,310),{t:String(v.t||"").slice(0,20),b:String(v.b||"").slice(0,500)}])):{},mediaEdits:l.mediaEdits&&typeof l.mediaEdits==="object"?Object.fromEntries(Object.entries(l.mediaEdits).slice(0,30).map(([k,v])=>[String(k).slice(0,300),String(v).slice(0,2500000)])):{} };
}
function cleanScreen(raw,i) {
  const src=raw&&typeof raw==="object"?raw:{};
  const ids=Array.isArray(src.selected)?src.selected.slice(0,12):[];
  const layers=Array.isArray(src.layers)?src.layers:[];
  const pairs=ids.map((id,j)=>({id,layer:layers[j]})).filter(x=>getEntry(x.id));
  return {id:String(src.id||("screen-"+Math.random().toString(36).slice(2,9))).slice(0,48),
    title:String(src.title||("Pantalla "+(i+1))).slice(0,60),subtitle:String(src.subtitle||"Una experiencia diseñada a tu manera").slice(0,100),
    selected:pairs.map(x=>x.id),layers:pairs.map(x=>cleanLayer(x.id,x.layer)),activeLayer:Math.max(0,Math.min(pairs.length-1,Number(src.activeLayer)||0))};
}
/* Valida un proyecto del constructor (al cargarlo, al importar una copia o al restaurar). */
function sanitizeBuilder(raw) {
  const b = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const out = {
    title: String(b.title || "Mi nueva interfaz").slice(0, 60), subtitle: String(b.subtitle || "Una experiencia diseñada a tu manera").slice(0, 100),
    palette: safeColor(b.palette || "#635BFF"), bg: safeColor(b.bg || "#F5F6FA"), font: BUILDER_FONTS.includes(b.font) ? b.font : "Inter",
    radius: Math.max(8, Math.min(32, Number(b.radius) || 20)), device: DEVICES[b.device] ? b.device : "m", exportDark: !!b.exportDark, imageQuality: IMAGE_QUALITY[b.imageQuality] ? b.imageQuality : "mid",
    selected: [], layers: [], activeLayer: 0
  };
  out.screens = Array.isArray(b.screens) && b.screens.length ? b.screens.slice(0, 8).map(cleanScreen)
    : [cleanScreen({ id: "screen-home", title: b.title, subtitle: b.subtitle, selected: b.selected, layers: b.layers, activeLayer: b.activeLayer }, 0)];
  if (!out.screens.length) out.screens = [cleanScreen({}, 0)];
  out.activeScreenIndex = Math.max(0, Math.min(out.screens.length - 1, Number(b.activeScreenIndex) || 0));
  return out;
}
/* Las imágenes del proyecto viven en IndexedDB: al cargarlas se rellenan las referencias «idb:». */
function inflateBuilderMedia() {
  let n = 0;
  const fix = m => { if (!m || typeof m !== "object") return; Object.keys(m).forEach(k => { const v = m[k]; if (typeof v === "string" && v.indexOf("idb:") === 0) { const d = mediaCache.get(v.slice(4)); if (d) { m[k] = d; n++; } } }); };
  builder.screens.forEach(sc => sc.layers.forEach(l => fix(l.mediaEdits)));
  builder.layers.forEach(l => fix(l.mediaEdits));
  return n;
}
function loadActiveScreen(){const sc=builder.screens[builder.activeScreenIndex];builder.title=sc.title;builder.subtitle=sc.subtitle;builder.selected=sc.selected.slice();builder.layers=sc.layers.map(x=>Object.assign({},x));builder.activeLayer=Math.max(0,Math.min(builder.selected.length-1,sc.activeLayer||0));}
function syncActiveScreen(){const sc=builder.screens[builder.activeScreenIndex];if(!sc)return;sc.title=builder.title;sc.subtitle=builder.subtitle;sc.selected=builder.selected.slice();sc.layers=builder.layers.map(x=>Object.assign({},x));sc.activeLayer=builder.activeLayer;}
loadActiveScreen();
let builderThemes=readJSON("estilos-themes-v1",[]);if(!Array.isArray(builderThemes))builderThemes=[];
let draft = null;      /* editor en vivo: { id, colors, radius, mode } sin guardar */
let userRefs = [];     /* capturas propias: { id, label, date, blob, url } */
let pendingConfirm = null;

function go(patch, opt) {
  if (patch && patch.view === "detail" && patch.id) trackRecent(patch.id);
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
function pv(e, extra) { return '<div class="pv" data-pv="' + esc(e.id) + '"' + (extra || "") + '></div>'; }
function stageCls(e, mode) {
  const m = mode || "auto", dark = m === "auto" ? e.mode === "dark" : m === "dark";
  return "stage" + (dark ? " dark" : "") + (m === "white" ? " white" : "");
}
/* Edición de texto inline: rutas estables dentro del DOM del componente. */
let builderTextEditMode=false;
let builderMediaEditMode=false;
let builderPendingMedia=null;
/* En el DOM los elementos SVG devuelven tagName en minúsculas ("svg"). */
function isSvgEl(n){return !!(n&&n.tagName&&String(n.tagName).toLowerCase()==="svg");}
/* Analiza HTML en un documento inerte: los atributos on*, scripts e imágenes no se
   ejecutan ni se cargan (un div creado con document.createElement sí los dispararía). */
function inertHost(html){return new DOMParser().parseFromString("<!doctype html><body>"+html,"text/html").body;}
/* Texto propio de un elemento: solo sus nodos de texto directos (p. ej. «Añadir al carrito»
   dentro de un botón que además lleva un icono SVG). Las claves "ruta::own" lo editan sin
   tocar los elementos hijos. */
function ownText(n){return [...n.childNodes].filter(c=>c.nodeType===3).map(c=>c.nodeValue).join("").trim();}
function setOwnText(n,v){const ts=[...n.childNodes].filter(c=>c.nodeType===3&&c.nodeValue.trim());if(!ts.length){n.appendChild(n.ownerDocument.createTextNode(v));return;}const lead=(ts[0].nodeValue.match(/^\s*/)||[""])[0];ts[0].nodeValue=lead+v;for(let i=1;i<ts.length;i++)ts[i].nodeValue="";}
/* Cada edición se guarda con su ruta y, en layer.editMeta, la etiqueta y el texto original del nodo.
   Al aplicarla se comprueba que el nodo sigue siendo el mismo; si el diseño cambió, se busca por
   etiqueta/texto y, si no hay una coincidencia clara, se omite (antes se editaba el nodo que cayera
   en esa posición). Las ediciones antiguas, sin metadatos, se aplican como siempre. */
function findEditNode(root,path,meta,isOwn,isMedia){
  let node=null;try{node=root.querySelector(path);}catch(_){}
  if(!meta)return node;
  const tag=n=>String(n&&n.tagName||"").toLowerCase();
  if(isMedia){if(tag(node)===meta.t)return node;const all=[...root.querySelectorAll(meta.t)];return all.length===1?all[0]:null;}
  const txt=n=>isOwn?ownText(n):String(n.textContent||"").trim();
  if(node&&tag(node)===meta.t&&txt(node)===meta.b)return node;
  const c=[...root.querySelectorAll(meta.t)].filter(n=>txt(n)===meta.b&&(isOwn||n.children.length===0));
  return c.length===1?c[0]:null;
}
function editMetaOf(layer,key){return layer&&layer.editMeta&&layer.editMeta[key]||null;}
function applyTextEdit(root,key,value,meta){const own=/::own$/.test(key),path=own?key.slice(0,-5):key,node=findEditNode(root,path,meta,own,false);if(!node)return;if(own)setOwnText(node,value);else node.textContent=value;}
function builderNodePath(node,root){
  const parts=[];let el=node;
  while(el&&el!==root){
    const tag=el.tagName.toLowerCase();
    let n=1,prev=el.previousElementSibling;
    while(prev){if(prev.tagName===el.tagName)n++;prev=prev.previousElementSibling;}
    parts.unshift(tag+":nth-of-type("+n+")");el=el.parentElement;
  }
  return parts.join(" > ");
}
function applyBuilderTextEdits(pvEl,shadow){
  const block=pvEl.closest(".builder-block");if(!block)return;
  const layer=builder.layers[Number(block.dataset.builderPreviewLayer)]||{};
  Object.entries(layer.textEdits||{}).forEach(([path,value])=>{
    try{applyTextEdit(shadow,path,value,editMetaOf(layer,path));}catch(_){}
  });
}
function builderEditedCode(entry,layer){
  const edits=layer&&layer.textEdits||{};if(!Object.keys(edits).length)return designCode(entry);
  const host=inertHost(designCode(entry));
  Object.entries(edits).forEach(([path,value])=>{try{applyTextEdit(host,path,value,editMetaOf(layer,path));}catch(_){}});
  return host.innerHTML;
}
function applyBuilderMediaEdits(pvEl,shadow){
  const block=pvEl.closest(".builder-block");if(!block)return;
  const layer=builder.layers[Number(block.dataset.builderPreviewLayer)]||{};
  Object.entries(layer.mediaEdits||{}).forEach(([path,src])=>{
    try{
      if(!isDataImg(src))return;
      const node=findEditNode(shadow,path,editMetaOf(layer,"m:"+path),false,true);if(!node)return;
      if(isSvgEl(node)){const img=document.createElement("img");img.src=src;img.alt="Imagen personalizada";img.style.cssText="width:100%;height:100%;object-fit:cover;display:block";node.replaceWith(img);}
      else if(node.tagName==="IMG"){node.src=src;node.removeAttribute("srcset");node.alt=node.alt||"Imagen personalizada";}
      else node.style.backgroundImage='url("'+src+'")';
    }catch(_){}
  });
}
function builderEditedMediaCode(entry,layer){
  const edits=layer&&layer.mediaEdits||{};if(!Object.keys(edits).length)return builderEditedCode(entry,layer);
  const host=inertHost(builderEditedCode(entry,layer));
  Object.entries(edits).forEach(([path,src])=>{
    try{
      if(!isDataImg(src))return;
      const node=findEditNode(host,path,editMetaOf(layer,"m:"+path),false,true);if(!node)return;
      if(isSvgEl(node)){const img=document.createElement("img");img.src=src;img.alt="Imagen personalizada";img.style.cssText="width:100%;height:100%;object-fit:cover;display:block";node.replaceWith(img);}
      else if(node.tagName==="IMG"){node.setAttribute("src",src);node.removeAttribute("srcset");}
      else node.style.backgroundImage='url("'+src+'")';
    }catch(_){}
  });
  return host.innerHTML;
}

/* Dibuja las vistas previas (Shadow DOM, o iframe aislado si el estilo trae código propio). */
/* Se dibujan al acercarse a la pantalla (IntersectionObserver): con 100+ estilos la
   búsqueda y las listas no tienen que crear todos los Shadow DOM de golpe. */
const pvIO = "IntersectionObserver" in window ? new IntersectionObserver(ents => ents.forEach(en => {
  if (en.isIntersecting) { pvIO.unobserve(en.target); hydrateEl(en.target); }
}), { rootMargin: "400px 0px" }) : null;
function hydrate(root) {
  (root || document).querySelectorAll(".pv:not([data-h])").forEach(el => {
    /* La maqueta del constructor se redibuja con cada cambio: se pinta al momento para que no parpadee. */
    if (pvIO && !el.hasAttribute("data-now") && !el.closest(".builder-preview")) pvIO.observe(el); else hydrateEl(el);
  });
}
function hydrateEl(el) {
  {
    if (el.hasAttribute("data-h")) return;
    el.setAttribute("data-h", "1");
    const base = getEntry(el.dataset.pv); if (!base) return;
    const e = el.hasAttribute("data-live") ? live(base) : base;
    try {
      if (e.code && e.code.trim()) {
        const f = document.createElement("iframe");
        f.className = "pvf"; f.setAttribute("sandbox", ""); f.title = e.name;
        f.srcdoc = '<!doctype html><meta charset="utf-8"><body style="margin:14px;font-family:system-ui,sans-serif">' + e.code;
        el.appendChild(f);
      } else {
        const shadow=el.attachShadow({ mode: "open" }); shadow.innerHTML = designShadow(e); applyBuilderTextEdits(el,shadow); applyBuilderMediaEdits(el,shadow);
      }
    } catch (err) { el.textContent = "No se pudo mostrar la vista previa"; }
  }
}
/* Entrada con los cambios del editor en vivo aplicados (si los hay). */
function live(e) {
  return draft && e && draft.id === e.id ? Object.assign({}, e, { colors: draft.colors.slice(), radius: draft.radius, mode: draft.mode }) : e;
}

/* ───────── Vistas ───────── */
function chipsHTML() {
  const all = '<button class="chip' + ("Todo" === S.tab && !S.q ? " on" : "") + '" role="tab" data-act="tab" data-t="Todo">Todo<small>' + db().length + '</small></button>';
  return '<div class="chips" role="tablist">' + all + allTabs().map(t => {
    const n = t === "Referencias" ? refCount() : db().filter(e => e.tab === t).length;
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
  const list = db(), day = Math.floor(Date.now() / 864e5);
  const tpl = list.filter(e => e.tab === "Plantillas").length;
  const rec = recentIds().map(getEntry).filter(Boolean).slice(0, 6);
  const picks = rec.length ? rec : [0, 7, 15, 23].map(k => list[(day + k) % list.length]).filter(Boolean);
  const tile = (act, extra, icon, grad, title, sub) => '<button class="tile" data-act="' + act + '"' + extra + '><span class="tileIc" style="background:' + grad + '">' + ic(icon, 23) + '</span><span class="tileTx"><b>' + title + '</b><small>' + sub + '</small></span></button>';
  return '<div class="wrap home">'
    + '<div class="top"><div class="brand"><span class="logo">' + ic("layers", 24) + '</span><div><b>Estilos</b><div class="sub">Biblioteca de diseño UI</div></div></div><div class="tbtns"><button class="ib" data-act="themecycle" aria-label="Tema: ' + THEME_LABEL[theme] + ' (cambiar)" title="Tema: ' + THEME_LABEL[theme] + '">' + ic(THEME_ICON[theme], 20) + '</button><button class="ib" data-act="menu" aria-label="Ajustes">' + ic("sliders", 20) + '</button></div></div>'
    + '<div class="hero"><h1 class="big">Diseña, crea y reutiliza sin límites</h1><p>' + list.length + ' estilos con vista previa real, paleta y código listo para copiar. Funciona sin internet.</p></div>'
    + '<button class="search" data-act="gosearch" aria-label="Buscar estilos">' + ic("search", 19) + '<span>Buscar componentes, estilos…</span></button>'
    + '<div class="tiles">'
    + tile("nav", ' data-v="library"', "layers", "linear-gradient(135deg,#6D5CFF,#38BDF8)", "Biblioteca", list.length + " estilos")
    + tile("nav", ' data-v="builder"', "edit", "linear-gradient(135deg,#C026D3,#8B5CF6)", "Creador", "Hasta 8 pantallas")
    + tile("tab", ' data-t="Plantillas"', "grid", "linear-gradient(135deg,#2563EB,#06B6D4)", "Plantillas", tpl + " plantillas")
    + tile("nav", ' data-v="favs"', "heart", "linear-gradient(135deg,#F97316,#EC4899)", "Colecciones", favs.length + (favs.length === 1 ? " guardado" : " guardados"))
    + '</div>'
    + '<div class="secRow"><h2 class="sec">' + (rec.length ? "Recientes" : "Para empezar") + '</h2><button class="link" data-act="nav" data-v="library">Ver todo</button></div>'
    + '<div class="rail">' + picks.map(miniHTML).join("") + '</div>'
    + '<button class="cta ghost" data-act="surprise">' + ic("spark", 18) + ' Sorpréndeme</button></div>';
}
function renderLibrary() {
  const tabs = allTabs().filter(t => S.group === "Todo" || (S.group === "Fundamentos") === FUNDAMENTOS.includes(t));
  const cards = tabs.map((t, i) => {
    const n = t === "Referencias" ? refCount() : db().filter(e => e.tab === t).length;
    return '<button class="catk" data-act="tab" data-t="' + esc(t) + '"><span class="tileIc sm" style="background:' + tabGrad(t, i) + '">' + ic(TAB_ICON[t] || "grid", 21) + '</span><span class="tileTx"><b>' + esc(t) + '</b><small>' + n + (t === "Referencias" ? " capturas" : " estilos") + '</small></span></button>';
  }).join("");
  return '<div class="wrap"><div class="top"><div><h1 class="big">Biblioteca</h1><div class="sub">' + db().length + ' estilos · ' + allTabs().length + ' categorías</div></div><div class="tbtns"><button class="ib" data-act="gosearch" aria-label="Buscar">' + ic("search", 20) + '</button><button class="ib" data-act="menu" aria-label="Ajustes">' + ic("sliders", 20) + '</button></div></div>'
    + '<div class="chips" role="tablist">' + LIB_GROUPS.map(g => '<button class="chip' + (S.group === g ? " on" : "") + '" role="tab" aria-selected="' + (S.group === g) + '" data-act="libgroup" data-g="' + g + '">' + g + '</button>').join("") + '</div>'
    + '<div class="catGrid">' + cards + '</div></div>';
}

/* Sin acentos ni mayúsculas: «tipografia» encuentra «Tipografía». Varias palabras = todas deben aparecer. */
function fold(x) { return String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function listFor() {
  const words = fold(S.q).split(/\s+/).filter(Boolean);
  if (!words.length) return S.tab === "Todo" ? db() : db().filter(e => e.tab === S.tab);
  return db().filter(e => { const h = fold(e.name + " " + e.desc + " " + e.ref + " " + e.tab + " " + e.tip); return words.every(w => h.includes(w)); });
}
function refCount() { return REFS.length + userRefs.length; }
/* Paletas: filas con la barra de colores (cada color se copia con un toque) y filtro claras/oscuras. */
function paletteRowHTML(e) {
  const fav = favs.includes(e.id);
  return '<article class="palRow" data-act="open" data-id="' + esc(e.id) + '" tabindex="0" role="button" aria-label="' + esc(e.name) + '"><div class="palMain"><div class="palHead"><h3>' + esc(e.name) + '</h3><span>' + (e.mode === "dark" ? "Oscuro" : "Claro") + '</span></div>'
    + '<div class="palBar">' + e.colors.map(c => '<button class="palSeg" style="background:' + esc(c) + '" data-act="color" data-c="' + esc(c) + '" aria-label="Copiar ' + esc(c) + '" title="' + esc(c) + '"></button>').join("") + '</div></div>'
    + '<button class="heart' + (fav ? " on" : "") + '" data-act="fav" data-id="' + esc(e.id) + '" aria-label="' + (fav ? "Quitar de guardados" : "Guardar") + '">' + (fav ? icf("heart", 20) : ic("heart", 20)) + '</button></article>';
}
function paletteListHTML() {
  const m = S.pmode || "all", l = db().filter(e => e.tab === "Paletas" && (m === "all" || (m === "dark") === (e.mode === "dark")));
  return '<div class="chips" role="tablist">' + [["all", "Todas"], ["light", "Claras"], ["dark", "Oscuras"]].map(([k, n]) => '<button class="chip' + (m === k ? " on" : "") + '" role="tab" aria-selected="' + (m === k) + '" data-act="pmode" data-m="' + k + '">' + n + '</button>').join("") + '</div>'
    + (l.length ? '<div class="palList">' + l.map(paletteRowHTML).join("") + '</div>' : '<div class="empty"><b>No hay paletas aquí</b></div>');
}
/* Plantillas: cuadrícula de dos columnas con la vista previa reducida a la mitad. */
function tplCardHTML(e) {
  const fav = favs.includes(e.id);
  return '<article class="card tpl" data-act="open" data-id="' + esc(e.id) + '" tabindex="0" role="button" aria-label="' + esc(e.name) + '"><div class="' + stageCls(e) + ' tplStage">' + pv(e) + '</div>'
    + '<div class="cardInfo"><div class="cardRow"><div><div class="cardName">' + esc(e.name) + '</div><div class="sub">' + esc(e.ref) + '</div></div><button class="heart' + (fav ? " on" : "") + '" data-act="fav" data-id="' + esc(e.id) + '" aria-label="' + (fav ? "Quitar de guardados" : "Guardar") + '">' + (fav ? icf("heart", 18) : ic("heart", 18)) + '</button></div></div></article>';
}
function listHTML() {
  if (S.tab === "Referencias" && !S.q) {
    return '<p class="sub">Toca una captura para ampliarla o sacar su paleta. Las tuyas se guardan solo en este dispositivo.</p><div class="refGrid">'
      + userRefs.map(r => '<button class="refItem" data-act="lbu" data-id="' + esc(r.id) + '"><img src="' + esc(r.url) + '" alt="' + esc(r.label) + '" loading="lazy" decoding="async"><div><span class="tag">Tuya</span> ' + esc(r.label) + '</div></button>').join("")
      + REFS.map((r, i) => '<button class="refItem" data-act="lb" data-i="' + i + '"><img src="' + esc(r.img) + '" alt="' + esc(r.label) + '" loading="lazy" decoding="async"><div>' + esc(r.label) + '</div></button>').join("") + '</div>';
  }
  if (S.tab === "Paletas" && !S.q) return paletteListHTML();
  const l = listFor();
  if (S.tab === "Plantillas" && !S.q && l.length) return '<div class="grid cols2">' + l.map(tplCardHTML).join("") + '</div>';
  if (!l.length) return '<div class="empty"><b>No hay estilos aquí</b><span>' + (S.q ? "Prueba con otra palabra." : "Toca + Añadir para crear uno.") + '</span></div>';
  return '<div class="grid">' + l.map(e => cardHTML(e, !!S.q)).join("") + '</div>';
}
function renderExplore() {
  const isRefs = S.tab === "Referencias" && !S.q;
  const n = isRefs ? refCount() : listFor().length;
  return '<div class="wrap">'
    + '<div class="top"><div><h1 class="big">' + esc(S.q ? "Búsqueda" : S.tab === "Todo" ? "Todos los estilos" : S.tab) + '</h1><div class="sub" id="count">' + (isRefs ? n + " capturas de referencia" : n + (S.q ? " resultados en todas las categorías" : " estilos")) + '</div></div>' + (isRefs ? '<button class="cta addBtn" data-act="addref">' + ic("upload", 16, 2.4) + ' Añadir captura</button>' : '<button class="cta addBtn" data-act="add">' + ic("plus", 16, 2.6) + ' Añadir</button>') + '</div>'
    + '<label class="search">' + ic("search", 18) + '<input id="q" data-input="q" type="search" placeholder="Buscar estilo…" aria-label="Buscar estilo" value="' + esc(S.q) + '"></label>'
    + chipsHTML() + '<div id="list">' + listHTML() + '</div></div>';
}

function builderOptions(tab, selected) {
  const items = db().filter(e => e.tab === tab);
  return '<option value="">Seleccionar ' + esc(tab.toLowerCase()) + '</option>' + items.map(e => '<option value="' + esc(e.id) + '"' + (selected === e.id ? ' selected' : '') + '>' + esc(e.name) + '</option>').join('');
}
function builderVisualPicker(tab){
  const items=db().filter(e=>e.tab===tab);
  if(!items.length)return '<div class="builder-picker-empty">Todavía no hay diseños en esta categoría.</div>';
  return '<details class="builder-picker-group" '+(tab==="Tarjetas"?'open':'')+'><summary><span>'+esc(tab)+'</span><small>'+items.length+' diseños</small></summary><div class="builder-picker-grid">'+items.map(e=>'<button type="button" class="builder-picker-card" draggable="true" data-picker-id="'+esc(e.id)+'" data-act="builderadd" title="Añadir '+esc(e.name)+'"><span class="builder-picker-thumb"><span class="builder-picker-zoom">'+pv(e)+'</span></span><span class="builder-picker-info"><b>'+esc(e.name)+'</b><small>'+esc(e.tab)+'</small></span><span class="builder-picker-add">＋</span></button>').join('')+'</div></details>';
}
function builderMotionName(x){return ({fade:"estilosFade",rise:"estilosRise",zoom:"estilosZoom",float:"estilosFloat",pulse:"estilosPulse"})[x.animation]||"";}
function builderMotionStyle(x){const n=builderMotionName(x);if(!n)return "";const ms=Math.max(300,Math.min(3000,Number(x.duration)||700));
  /* Flotar y Pulso se repiten; Fade, Subir y Zoom son de entrada (una vez). */
  return "animation:"+n+" "+ms+"ms "+(x.animation==="float"||x.animation==="pulse"?"ease-in-out infinite":"ease both")+";";}
function builderElevation(x){const e=Math.max(0,Math.min(5,Number(x.elevation??(x.shadow?2:0))));return e?"0 "+(e*3)+"px "+(e*9)+"px rgba(25,35,60,"+(0.06+e*.025)+")":"none";}
function builderVariantHTML(x,content){return '<div class="builder-variant '+(x.variant||"default")+'">'+content+'</div>';}

function builderPreview() {
  const picked = builder.selected.map(getEntry).filter(Boolean);
  const accent = safeColor(builder.palette || '#635BFF'), bg = safeColor(builder.bg || '#F5F6FA');
  const r = Math.max(8, Math.min(32, Number(builder.radius) || 20));
  return '<div class="builder-device" style="--dev-w:' + Math.round(deviceOf(builder).w * .872) + 'px;--dev-h:' + Math.round(deviceOf(builder).h * .735) + 'px;--b-accent:' + accent + ';--b-bg:' + bg + ';--b-radius:' + r + 'px;font-family:' + (builder.font === 'Georgia' ? 'Georgia,serif' : builder.font === 'Plus Jakarta Sans' ? 'Plus Jakarta Sans,system-ui' : 'Inter,system-ui') + '">' +
    '<div class="builder-screen"><div class="builder-status"><span>9:41</span><span>●●● ▰</span></div><div class="builder-top"><span class="builder-mark">✦</span><span>•••</span></div><small class="builder-eyebrow">TU ESPACIO DIGITAL</small><h3>' + esc(builder.title || 'Mi nueva interfaz') + '</h3><p>' + esc(builder.subtitle || 'Una experiencia diseñada a tu manera') + '</p><button class="builder-primary">Descubrir más <b>↗</b></button>' +
    picked.map((e,i)=>{const l=builder.layers[i]||{};const label=l.label||e.name;const shadow=builderElevation(l);return '<section class="builder-block ' + (i===builder.activeLayer?'is-active ':'') + (l.hidden?'is-hidden ':'') + (l.locked?'is-locked':'') + '" data-act="builderselect" data-index="' + i + '" data-builder-preview-layer="' + i + '" style="display:' + (l.hidden?'none':'block') + ';background:' + safeColor(l.bg||'#FFFFFF') + ';color:' + safeColor(l.color||'#263247') + ';border-radius:' + Math.max(6,Math.min(32,Number(l.radius)||16)) + 'px;padding:' + Math.max(4,Math.min(32,Number(l.padding)||12)) + 'px;font-size:' + (l.fontSize||14) + 'px;font-weight:' + (l.weight||600) + ';text-align:' + (l.align||'left') + ';border:' + (l.borderWidth||0) + 'px ' + (l.borderStyle||'solid') + ' ' + safeColor(l.borderColor||'#E8EAF0') + ';box-shadow:' + shadow + ';width:' + (l.width||100) + '%;translate:' + (Number(l.offsetX)||0) + 'px ' + (Number(l.offsetY)||0) + 'px;' + builderMotionStyle(l) + '"><div class="builder-block-head"><span class="builder-drag-handle" data-builder-drag="' + i + '" title="Arrastrar">⠿</span><b>' + esc(label) + '</b><small>' + esc(e.tab) + '</small></div><div class="builder-live-component">' + builderVariantHTML(l,pv(e)) + '</div><span class="builder-resize-handle" data-builder-resize="' + i + '" role="slider" aria-label="Cambiar tamaño del componente" title="Arrastra para cambiar tamaño">↘</span></section>';}).join('') +
    '<div class="builder-bottom"><span>⌂<small>Inicio</small></span><span>⌕<small>Buscar</small></span><span>♡<small>Guardados</small></span><span>◉<small>Perfil</small></span></div></div></div>';
}

function builderLayerParts(){
  const picked=pickedBuilder();
  const layerGroups=[...new Set(builder.layers.map(x=>String(x.group||"").trim()).filter(Boolean))];
  const layerRowHtml=(entry,index)=>{
    const layer=builder.layers[index]||{},name=layer.label||entry.name;
    return '<div class="builder-layer-row'+(index===builder.activeLayer?' active':'')+(layer.hidden?' is-hidden':'')+(layer.locked?' is-locked':'')+'" draggable="true" data-layer-index="'+index+'"><button type="button" class="builder-layer-grip" data-layer-grip="'+index+'" aria-label="Reordenar «'+esc(name)+'»: arrastra el asa o usa las flechas" title="Arrastrar para reordenar">'+ic('grip',16)+'</button><button type="button" class="builder-layer-thumb" data-act="builderselect" data-index="'+index+'" aria-label="Seleccionar '+esc(name)+'">'+pv(entry)+'</button><button type="button" class="builder-layer-name" data-act="builderselect" data-index="'+index+'"><b>'+esc(name)+'</b><small>'+esc(entry.tab)+' · Capa '+(index+1)+'</small></button><div class="builder-layer-tools">'+
      '<button type="button" data-act="builderlayerhide" data-index="'+index+'" aria-label="Ocultar «'+esc(name)+'»" aria-pressed="'+(!!layer.hidden)+'" title="'+(layer.hidden?'Mostrar':'Ocultar')+'">'+ic(layer.hidden?'eyeOff':'eye',16)+'</button>'+
      '<button type="button" data-act="builderlayerlock" data-index="'+index+'" aria-label="Bloquear «'+esc(name)+'»" aria-pressed="'+(!!layer.locked)+'" title="'+(layer.locked?'Desbloquear':'Bloquear')+'">'+ic(layer.locked?'lock':'unlock',16)+'</button>'+
      '<button type="button" data-act="buildermove" data-index="'+index+'" data-dir="-1" aria-label="Subir «'+esc(name)+'»" title="Subir" '+(index===0?'disabled':'')+'>'+ic('arrowUp',16)+'</button>'+
      '<button type="button" data-act="buildermove" data-index="'+index+'" data-dir="1" aria-label="Bajar «'+esc(name)+'»" title="Bajar" '+(index===picked.length-1?'disabled':'')+'>'+ic('arrowDown',16)+'</button>'+
      '<button type="button" data-act="builderduplicate" data-index="'+index+'" aria-label="Duplicar «'+esc(name)+'»" title="Duplicar">'+ic('copy',16)+'</button>'+
      '<button type="button" data-act="builderremove" data-index="'+index+'" aria-label="Eliminar «'+esc(name)+'»" title="Eliminar">'+ic('trash',16)+'</button></div>'
    +'<div class="builder-layer-group-select"><label>Carpeta</label><select data-layer-group="'+index+'" aria-label="Mover a carpeta"><option value="">Sin carpeta</option>'+layerGroups.map(g=>'<option value="'+esc(g)+'"'+(layer.group===g?' selected':'')+'>'+esc(g)+'</option>').join('')+'</select></div></div>';
  };
  const historyControlsHtml='<div class="builder-history-controls"><button type="button" data-act="builderundo">'+ic('undo',15)+' Deshacer</button><button type="button" data-act="builderredo">'+ic('redo',15)+' Rehacer</button><small>Hasta 60 cambios</small></div>';
  const layerPanelHtml='<div class="builder-layers-panel" id="builder-layers-panel"><div class="builder-layers-heading"><div><b>Capas y carpetas</b><small>'+picked.length+' / 12 elementos · '+layerGroups.length+' carpetas</small></div><button type="button" data-act="buildergroupadd" class="builder-folder-add">＋ Nueva carpeta</button></div>'+historyControlsHtml+'<div class="builder-layer-list">'+(picked.length?(()=>{
    const ungrouped=picked.map((entry,index)=>({entry,index})).filter(x=>!String((builder.layers[x.index]||{}).group||"").trim());
    let html=ungrouped.map(x=>layerRowHtml(x.entry,x.index)).join('');
    layerGroups.forEach(group=>{
      const members=picked.map((entry,index)=>({entry,index})).filter(x=>(builder.layers[x.index]||{}).group===group);
      const collapsed=builderCollapsedGroups.has(group);
      html+='<section class="builder-folder'+(collapsed?' collapsed':'')+'"><header><button type="button" class="builder-folder-toggle" data-act="buildergroupcollapse" data-group="'+esc(group)+'" aria-expanded="'+(!collapsed)+'">'+ic(collapsed?'chevR':'chevD',14)+' '+ic('folder',15)+' <b>'+esc(group)+'</b><small>'+members.length+'</small></button><span><button type="button" data-act="buildergrouprename" data-group="'+esc(group)+'" aria-label="Renombrar carpeta «'+esc(group)+'»">'+ic('edit',14)+'</button><button type="button" data-act="buildergroupdelete" data-group="'+esc(group)+'" aria-label="Eliminar carpeta «'+esc(group)+'»">'+ic('close',14)+'</button></span></header><div class="builder-folder-content" '+(collapsed?'hidden':'')+'>'+members.map(x=>layerRowHtml(x.entry,x.index)).join('')+'</div></section>';
    });
    return html||'<div class="builder-layers-empty">No hay capas todavía.</div>';
  })():'<div class="builder-layers-empty">Añade componentes desde la biblioteca y organízalos en carpetas.</div>')+'</div></div>';
  return {layerPanelHtml,layerGroups,picked};
}
function isMobileBuilder() { return !!(window.matchMedia && matchMedia("(max-width:759px)").matches); }
function renderBuilder() {
  if (isMobileBuilder()) return renderBuilderMobile();
  const fields = allTabs().filter(tab=>tab!=="Referencias"&&db().some(e=>e.tab===tab)).map(tab=>[tab,TAB_FAMILY[tab]||"misc"]);
  const screenOptions=builder.screens.map((sc,i)=>'<button class="screen-tab '+(i===builder.activeScreenIndex?'active':'')+'" data-act="builderscreen" data-index="'+i+'"><span>'+(i+1)+'</span>'+esc(sc.title||('Pantalla '+(i+1)))+'</button>').join('');
  const picked=pickedBuilder(),i=builder.activeLayer,e=picked[i],l=builder.layers[i]||{};
  const {layerPanelHtml,layerGroups}=builderLayerParts();
  const layerEditor=e?'<div class="layer-editor"><h4>Propiedades del componente</h4><label class="l">Nombre visible</label><input class="fld" maxlength="70" data-layer-field="label" data-index="'+i+'" value="'+esc(l.label||e.name)+'"><div class="two"><div><label class="l">Fondo</label><input class="fld color-field" type="color" data-layer-field="bg" data-index="'+i+'" value="'+esc(l.bg||'#FFFFFF')+'"></div><div><label class="l">Texto</label><input class="fld color-field" type="color" data-layer-field="color" data-index="'+i+'" value="'+esc(l.color||'#263247')+'"></div></div><div class="two"><div><label class="l">Tamaño de fuente</label><input class="fld" type="range" min="10" max="30" data-layer-field="fontSize" data-index="'+i+'" value="'+(l.fontSize||14)+'"></div><div><label class="l">Peso</label><select class="fld" data-layer-field="weight" data-index="'+i+'">'+['400','500','600','700','800'].map(v=>'<option value="'+v+'"'+(String(l.weight||'600')===v?' selected':'')+'>'+v+'</option>').join('')+'</select></div></div><div class="two"><div><label class="l">Alineación</label><select class="fld" data-layer-field="align" data-index="'+i+'">'+['left','center','right'].map(v=>'<option value="'+v+'"'+((l.align||'left')===v?' selected':'')+'>'+({left:'Izquierda',center:'Centro',right:'Derecha'}[v])+'</option>').join('')+'</select></div><div><label class="l">Redondeo</label><input class="fld" type="range" min="6" max="32" data-layer-field="radius" data-index="'+i+'" value="'+(l.radius||16)+'"></div></div><div class="two"><div><label class="l">Espaciado</label><input class="fld" type="range" min="4" max="32" data-layer-field="padding" data-index="'+i+'" value="'+(l.padding||12)+'"></div><div><label class="l">Ancho (%)</label><input class="fld" type="range" min="50" max="100" data-layer-field="width" data-index="'+i+'" value="'+(l.width||100)+'"></div></div><div class="two"><div><label class="l">Borde</label><input class="fld color-field" type="color" data-layer-field="borderColor" data-index="'+i+'" value="'+esc(l.borderColor||'#E8EAF0')+'"></div><div><label class="l">Grosor borde</label><input class="fld" type="range" min="0" max="5" data-layer-field="borderWidth" data-index="'+i+'" value="'+(l.borderWidth||0)+'"></div></div><div class="two"><div><label class="l">Desplazamiento X</label><input class="fld" type="range" min="-40" max="40" data-layer-field="offsetX" data-index="'+i+'" value="'+(l.offsetX||0)+'"></div><div><label class="l">Desplazamiento Y</label><input class="fld" type="range" min="-40" max="40" data-layer-field="offsetY" data-index="'+i+'" value="'+(l.offsetY||0)+'"></div></div><label class="l">Variante visual</label><select class="fld" data-layer-field="variant" data-index="'+i+'">'+[['default','Clásica'],['glass','Glass'],['soft','Soft UI'],['outline','Outline'],['bold','Bold']].map(([v,n])=>'<option value="'+v+'"'+((l.variant||'default')===v?' selected':'')+'>'+n+'</option>').join('')+'</select><label class="l">Animación</label><select class="fld" data-layer-field="animation" data-index="'+i+'">'+[['none','Sin animación'],['fade','Fade in'],['rise','Subir'],['zoom','Zoom'],['float','Flotar'],['pulse','Pulso']].map(([v,n])=>'<option value="'+v+'"'+((l.animation||'none')===v?' selected':'')+'>'+n+'</option>').join('')+'</select><div class="two"><div><label class="l">Duración (ms)</label><input class="fld" type="range" min="300" max="3000" step="100" data-layer-field="duration" data-index="'+i+'" value="'+(l.duration||700)+'"></div><div><label class="l">Elevación</label><input class="fld" type="range" min="0" max="5" data-layer-field="elevation" data-index="'+i+'" value="'+(l.elevation??(l.shadow?2:0))+'"></div></div><label class="l">Estilo de borde</label><select class="fld" data-layer-field="borderStyle" data-index="'+i+'">'+['solid','dashed','dotted'].map(v=>'<option value="'+v+'"'+((l.borderStyle||'solid')===v?' selected':'')+'>'+({solid:'Continuo',dashed:'Discontinuo',dotted:'Punteado'}[v])+'</option>').join('')+'</select><div class="preset-row"><button type="button" data-act="builderpreset" data-preset="glass">Glass</button><button type="button" data-act="builderpreset" data-preset="soft">Soft</button><button type="button" data-act="builderpreset" data-preset="outline">Outline</button><button type="button" data-act="builderpreset" data-preset="bold">Bold</button></div></div>':'';
  return '<div class="wrap builder-wrap"><div class="top"><div><h1 class="big">Constructor</h1><div class="sub">Diseña varias pantallas y personaliza cada componente</div></div><button class="ib" data-act="builderreset" aria-label="Restablecer">↺</button></div>' +
  '<div class="screen-manager"><div class="screen-tabs">'+screenOptions+'</div><div class="screen-actions"><button data-act="builderscreenadd">＋ Nueva</button><button data-act="builderscreenduplicate">Duplicar</button><button data-act="builderscreendelete" '+(builder.screens.length<=1?'disabled':'')+'>Eliminar</button></div></div>' +
  '<nav class="builder-mobile-nav" aria-label="Navegación del constructor"><button type="button" data-act="buildermobilejump" data-target="builder-preview-panel">▣<span>Vista</span></button><button type="button" data-act="buildermobilejump" data-target="builder-controls-panel">⚙<span>Editar</span></button><button type="button" data-act="buildermobilejump" data-target="builder-library-panel">✦<span>Biblioteca</span></button><button type="button" data-act="buildermobilejump" data-target="builder-layers-panel">▤<span>Capas</span></button><button type="button" data-act="buildertextmode">Aa<span>Texto</span></button><button type="button" data-act="buildermediamode">▧<span>Imagen</span></button></nav>' +
  '<div class="builder-layout"><div class="builder-controls" id="builder-controls-panel"><section class="panel"><h3>Identidad de pantalla</h3><label class="l">Nombre de esta pantalla</label><input class="fld" data-builder="title" value="' + esc(builder.title) + '" maxlength="60"><label class="l">Descripción</label><input class="fld" data-builder="subtitle" value="' + esc(builder.subtitle) + '" maxlength="100"><div class="two"><div><label class="l">Color principal</label><input class="fld color-field" type="color" data-builder="palette" value="' + esc(builder.palette) + '"></div><div><label class="l">Fondo</label><input class="fld color-field" type="color" data-builder="bg" value="' + esc(builder.bg) + '"></div></div><div class="two"><div><label class="l">Tipografía</label><select class="fld" data-builder="font"><option' + (builder.font==='Inter'?' selected':'') + '>Inter</option><option' + (builder.font==='Plus Jakarta Sans'?' selected':'') + '>Plus Jakarta Sans</option><option' + (builder.font==='Georgia'?' selected':'') + '>Georgia</option></select></div><div><label class="l">Redondeo general</label><input class="fld" type="range" min="8" max="32" step="2" data-builder="radius" value="' + Number(builder.radius) + '"></div></div></section>' +
  '<section class="panel"><h3>Temas reutilizables</h3><div class="two"><select class="fld" data-theme-select><option value="">Seleccionar tema</option><option value="violet">Violeta Studio</option><option value="midnight">Midnight</option><option value="ivory">Ivory</option><option value="mint">Mint</option>' + builderThemes.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name)+'</option>').join('') + '</select><button class="secondary" data-act="builderthemesave">Guardar tema actual</button></div><p class="sub">Guarda combinaciones de color, tipografía y redondeo para reutilizarlas en otros proyectos.</p></section>' +
  '<section class="panel builder-library-panel" id="builder-library-panel"><h3>Biblioteca visual</h3><p class="sub">Elige por apariencia, no por nombre. Abre una categoría para ver las miniaturas reales y toca un diseño para añadirlo a la pantalla.</p><label class="builder-picker-search"><span>⌕</span><input type="search" data-builder-picker-search placeholder="Buscar por nombre o categoría…"></label><div class="builder-picker-groups">' + fields.map(([tab])=>builderVisualPicker(tab)).join('') + '</div>' + layerPanelHtml + layerEditor + '</section>' + builderImagesPanelHTML() + '<section class="panel builder-export-box"><h3>Exportar y compartir</h3><button type="button" class="switchRow" role="switch" aria-checked="' + (!!builder.exportDark) + '" data-act="builderexportdark"><span>Modo oscuro automático<small>El marco de la página se oscurece si quien la abre usa modo oscuro. Los colores de tus bloques no cambian.</small></span><i class="sw2"></i></button><button class="cta" data-act="builderexport">' + ic('arrowDown',17) + ' Todas las pantallas en HTML</button><button class="cta ghost" data-act="builderexportzip">' + ic('layers',17) + ' ZIP: HTML + React + Tailwind</button><button class="cta ghost" data-act="builderlink">' + ic('share',17) + ' Copiar enlace del proyecto</button><p class="sub">El enlace no lleva las imágenes que reemplazaste; para eso usa el ZIP o la copia de seguridad.</p></section></div><div class="builder-preview'+(builderTextEditMode?' text-edit-mode':'')+(builderMediaEditMode?' media-edit-mode':'')+'" id="builder-preview-panel"><div class="preview-heading"><b>Vista previa en vivo</b><button type="button" class="builder-text-toggle" data-act="buildertextmode">'+(builderTextEditMode?'✓ Terminar texto':'Aa Editar texto')+'</button><button type="button" class="builder-text-toggle" data-act="buildermediamode">'+(builderMediaEditMode?'✓ Terminar imagen':'▧ Cambiar imagen')+'</button><span class="builder-device-pick"><select data-builder="device" aria-label="Tamaño de pantalla">'+Object.keys(DEVICES).map(k=>'<option value="'+k+'"'+(deviceOf(builder)===DEVICES[k]?' selected':'')+'>'+DEVICES[k].n+' · '+DEVICES[k].w+'×'+DEVICES[k].h+'</option>').join('')+'</select> · Pantalla '+(builder.activeScreenIndex+1)+'</span></div><input type="file" id="builder-media-file" accept="image/png,image/jpeg,image/webp" hidden>' + builderPreview() + '<p class="sub">Selecciona un bloque. Usa ⠿ para moverlo y la esquina ↘ para cambiar su tamaño. Los cambios se guardan automáticamente.</p></div></div></div>';
}
function builderMediaStats(){let n=0,b=0;builder.screens.forEach(sc=>sc.layers.forEach(l=>Object.values(l.mediaEdits||{}).forEach(v=>{if(isDataImg(v)){n++;b+=Math.round(v.length*.75);}})));return {n,b};}
function builderImagesPanelHTML(){
  syncActiveScreen();const st=builderMediaStats();
  const size=st.b>1048576?(st.b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(st.b/1024))+' KB';
  return '<section class="panel"><h3>Imágenes</h3><label class="l" for="imgq">Calidad al reemplazar una imagen</label><select class="fld" id="imgq" data-builder="imageQuality">'
    +Object.keys(IMAGE_QUALITY).map(k=>'<option value="'+k+'"'+((builder.imageQuality||"mid")===k?' selected':'')+'>'+IMAGE_QUALITY[k].n+' · hasta '+IMAGE_QUALITY[k].max+' px</option>').join('')
    +'</select><p class="sub">Se aplica a las imágenes que reemplaces a partir de ahora. '+(st.n?st.n+(st.n>1?' imágenes':' imagen')+' en el proyecto · '+size+'.':'Todavía no has reemplazado ninguna.')+'</p></section>';
}
function pickedBuilder(){return builder.selected.map(getEntry).filter(Boolean);}
function saveBuilder(){syncActiveScreen();try{localStorage.setItem('estilos-builder-v1',mediaStrip(JSON.stringify(builder)));AutoBackup.touch();}catch(e){toast('No se pudo guardar el constructor');}}

function renderFavs() {
  const l = favs.map(getEntry).filter(Boolean);
  return '<div class="wrap"><div><h1 class="big">Colecciones</h1><div class="sub">' + l.length + (l.length === 1 ? ' estilo guardado' : ' estilos guardados') + '</div></div><button class="ib" data-act="menu" aria-label="Ajustes">' + ic("sliders", 20) + '</button></div>'
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

function hex6(c) { const [r, g, b] = rgb(c); return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join(""); }
function editorHTML(e, x) {
  const round = String(x.radius).indexOf("%") >= 0, rv = round ? 32 : Math.min(32, parseInt(x.radius, 10) || 0);
  const dirty = !!(draft && draft.id === e.id);
  return '<div class="panel"><h3>Colores</h3>'
    + x.colors.map((c, i) => '<div class="lrow"><input type="color" class="lcol" data-input="lc" data-i="' + i + '" value="' + hex6(c) + '" aria-label="Color ' + (i + 1) + '">'
      + '<input class="fld lhex" data-input="lhex" data-i="' + i + '" value="' + esc(c) + '" maxlength="9" spellcheck="false" autocapitalize="characters" aria-label="Código hex del color ' + (i + 1) + '">'
      + (x.colors.length > 1 ? '<button class="ib sm" data-act="ldel" data-i="' + i + '" aria-label="Quitar color ' + (i + 1) + '">' + ic("minus", 16) + '</button>' : '') + '</div>').join("")
    + (x.colors.length < 6 ? '<button class="pillbtn" data-act="ladd">' + ic("plus", 14) + ' Añadir color</button>' : '')
    + '<h3>Radio</h3><div class="lrow"><input type="range" class="lrange" min="0" max="32" step="1" data-input="lrad" value="' + rv + '"' + (round ? " disabled" : "") + ' aria-label="Radio en píxeles"><b id="lradv" class="lval">' + (round ? "Redondo" : rv + " px") + '</b></div>'
    + '<button class="switchRow" role="switch" aria-checked="' + round + '" data-act="lround"><span>Forma totalmente redondeada</span><i class="sw2"></i></button>'
    + '<h3>Modo</h3><div class="seg"><button class="' + (x.mode === "dark" ? "" : "on") + '" data-act="lmode" data-m="light">' + ic("sun", 14) + ' Claro</button><button class="' + (x.mode === "dark" ? "on" : "") + '" data-act="lmode" data-m="dark">' + ic("moon", 14) + ' Oscuro</button></div>'
    + (e.code ? '<p class="sub">Este estilo usa código propio: el editor cambia su ficha (paleta, radio, modo), no su HTML.</p>' : '')
    + '</div><div class="btns"><button class="cta" data-act="lapply"' + (dirty ? "" : " disabled") + '>' + ic("check", 16, 2.4) + ' Aplicar a este estilo</button>'
    + '<div class="two"><button class="cta ghost" data-act="lsave">' + ic("layers", 16) + ' Guardar variante</button><button class="cta ghost" data-act="lreset"' + (dirty ? "" : " disabled") + '>Restablecer</button></div></div>';
}
function codeLabel(stack, code) {
  const n = code.split("\n").length + " líneas";
  return stack === "html" ? "HTML + CSS · " + n : (STACKS.find(x => x.id === stack) || {}).label + " · tokens del tema · " + n;
}
function renderDetail() {
  const base = getEntry(S.id); if (!base) { S.view = "explore"; return renderExplore(); }
  if (draft && draft.id !== base.id) draft = null;
  const e = live(base), t = tokens(e), ratio = contrast(t.a, t.on), w = wcag(ratio);
  const dt = ["info", "edit", "code", "rel"].includes(S.detailTab) ? S.detailTab : "info", stack = S.stack || "html";
  const code = stackCode(e, stack);
  const rel = db().filter(x => x.tab === e.tab && x.id !== e.id).slice(0, 12);
  const info = '<div class="panel"><h3>Paleta</h3><div class="swRow" style="margin:0">' + swatches(e) + '</div>'
    + '<div class="fmt"><span class="sub" style="align-self:center">Copiar como</span>' + ["hex", "css", "tailwind", "json"].map(f => '<button data-act="pal" data-f="' + f + '" data-id="' + esc(e.id) + '">' + (f === "hex" ? "HEX" : f === "css" ? "CSS" : f === "tailwind" ? "Tailwind" : "JSON") + '</button>').join("") + '</div></div>'
    + '<div class="panel"><h3>Detalles</h3>'
    + '<div class="row"><span>Categoría</span><b>' + esc(e.tab) + '</b></div>'
    + '<div class="row"><span>Modo</span><b>' + (e.mode === "dark" ? "Oscuro" : "Claro") + '</b></div>'
    + '<div class="row"><span>Radio</span><b>' + esc(e.radius) + (String(e.radius).indexOf("%") < 0 ? " px" : "") + '</b></div>'
    + '<div class="row"><span>Contraste del acento</span><b>' + ratio.toFixed(1) + ':1 <span class="badge ' + (ratio >= 4.5 ? "ok" : ratio >= 3 ? "mid" : "bad") + '">' + esc(w) + '</span></b></div>'
    + '</div>'
    + '<div class="panel"><h3>Uso</h3><p class="dDesc">' + esc(e.tip || "Todavía no hay un consejo para este estilo.") + '</p><div class="row"><span>Pensado para</span><b>' + (e.mode === "dark" ? "Fondos oscuros" : "Fondos claros") + '</b></div></div>';
  const relPanel = rel.length ? '<p class="sub">Más estilos de ' + esc(e.tab) + '</p><div class="grid">' + rel.map(x => cardHTML(x, false)).join("") + '</div>' : '<div class="empty"><b>No hay más estilos en esta categoría</b></div>';
  const codePanel = '<div class="fmt" role="radiogroup" aria-label="Plataforma">' + STACKS.map(x => '<button role="radio" aria-checked="' + (x.id === stack) + '" class="' + (x.id === stack ? "on" : "") + '" data-act="stack" data-s="' + x.id + '">' + x.label + '</button>').join("") + '</div>'
    + '<div class="codeBox"><div class="codeHead"><span>' + esc(codeLabel(stack, code)) + '</span><button data-act="copycode" data-id="' + esc(e.id) + '">' + ic("copy", 14) + ' Copiar</button></div><pre><code>' + esc(code) + '</code></pre></div>'
    + '<p class="sub">' + (stack === "html" ? "Autocontenido: pégalo en tu proyecto. Los iconos van en SVG inline, sin librerías." : "Colores por rol, paleta y radio de este estilo para usarlos en tus componentes. El componente completo está en HTML/CSS.") + '</p>'
    + '<div class="two"><button class="cta ghost" data-act="dlpng" data-id="' + esc(e.id) + '">' + ic("image", 16) + ' Descargar PNG</button><button class="cta ghost" data-act="dlsvg" data-id="' + esc(e.id) + '">' + ic("code", 16) + ' Descargar SVG</button></div>'
    + '<p class="sub">Imagen del componente tal como se ve, con su fondo. Los estilos con código propio pueden variar algo.</p>';
  const tabBtn = (id, label) => '<button class="' + (dt === id ? "on" : "") + '" role="tab" aria-selected="' + (dt === id) + '" data-act="dtab" data-d="' + id + '">' + label + '</button>';
  return '<div class="wrap detail">'
    + '<div class="dTop"><button class="ib" data-act="back" aria-label="Volver">' + ic("back", 22, 2.4) + '</button><div class="tbtns"><button class="ib" data-act="surprise" aria-label="Otro estilo al azar">' + ic("spark", 20) + '</button><button class="ib" data-act="more" data-id="' + esc(e.id) + '" aria-label="Más opciones">' + ic("dots", 20) + '</button></div></div>'
    + '<div class="' + stageCls(e, S.stage) + ' dStage">' + pv(e, ' data-now="1" data-live="1"') + '</div>'
    + '<div class="dStageBar">' + (draft ? '<span class="badge mid">Sin guardar</span>' : '') + '<button class="pillbtn" data-act="stage">' + ic(S.stage === "dark" ? "moon" : "sun", 14) + ' Fondo: ' + STAGE_LABEL[S.stage] + '</button></div>'
    + '<div><div class="dName">' + esc(e.name) + '</div><div class="sub" style="margin-top:4px;font-size:13px">' + esc(e.tab) + (e.ref ? " · " + esc(e.ref) : "") + '</div></div>'
    + '<p class="dDesc">' + esc(e.desc) + '</p>'
    + '<div class="seg" role="tablist">' + tabBtn("info", "Detalles") + tabBtn("code", "Código") + tabBtn("edit", "Editor") + tabBtn("rel", "Relacionados") + '</div>'
    + (dt === "code" ? codePanel : dt === "edit" ? editorHTML(base, e) : dt === "rel" ? relPanel : info)
    + '</div>';
}
/* Refresca solo la vista previa grande (el editor llama a esto en cada cambio). */
function refreshStage() {
  const st = document.querySelector(".dStage"), e = getEntry(S.id); if (!st || !e) return;
  const x = live(e);
  st.className = stageCls(x, S.stage) + " dStage";
  st.innerHTML = pv(x, ' data-now="1" data-live="1"'); hydrate(st);
  const ap = document.querySelector('[data-act="lapply"]'), rs = document.querySelector('[data-act="lreset"]');
  if (ap) ap.disabled = !draft; if (rs) rs.disabled = !draft;
  const bar = document.querySelector(".dStageBar");
  if (bar && draft && !bar.querySelector(".badge")) bar.insertAdjacentHTML("afterbegin", '<span class="badge mid">Sin guardar</span>');
}
function ensureDraft() {
  const e = getEntry(S.id); if (!e) return null;
  if (!draft || draft.id !== e.id) draft = { id: e.id, colors: e.colors.slice(), radius: String(e.radius), mode: e.mode };
  return draft;
}
function saveVariant() {
  const b = getEntry(S.id); if (!b) return;
  const e = live(b), n = normalize(Object.assign({}, e, { id: null, name: (b.name + " (variante)").slice(0, 80), v: variantOf(b) }));
  if (!n) return toast("Revisa los colores");
  user.added.push(n); if (!saveUser()) return;
  draft = null; toast("Variante guardada en " + n.tab);
  go({ view: "detail", id: n.id, detailTab: "info" });
}
function applyDraft() {
  const b = getEntry(S.id); if (!b || !draft) return;
  const patch = { colors: draft.colors.map(c => safeColor(c)), radius: normalize(Object.assign({}, b, { radius: draft.radius })).radius, mode: draft.mode };
  if (SEED_IDS.has(b.id)) user.edits[b.id] = Object.assign({}, user.edits[b.id] || {}, patch);
  else { const i = user.added.findIndex(x => x.id === b.id); if (i >= 0) user.added[i] = Object.assign({}, user.added[i], patch); }
  if (!saveUser()) return;
  draft = null; render(true); toast("Cambios aplicados");
}
function moreSheet(id) {
  const e = getEntry(id); if (!e) return;
  openSheet('<div class="handle"></div><h2>' + esc(e.name) + '</h2><span class="sub">' + esc(e.tab) + '</span><div class="btns">'
    + '<button class="cta ghost" data-act="edit" data-id="' + esc(id) + '">' + ic("edit", 16) + ' Editar ficha</button>'
    + '<button class="cta ghost" data-act="dup" data-id="' + esc(id) + '">' + ic("layers", 16) + ' Duplicar como mío</button>'
    + '<button class="cta ghost" data-act="sharecode" data-id="' + esc(id) + '">' + ic("share", 16) + ' Compartir código</button>'
    + '<button class="cta danger" data-act="del" data-id="' + esc(id) + '">' + ic("trash", 16) + ' Eliminar este estilo</button>'
    + '<button class="cta ghost" data-act="closesheet">Cancelar</button></div>');
}

function navHTML() {
  const inLib = S.view === "library" || (S.view === "explore" && S.tab !== "Plantillas") || S.view === "detail";
  const inTpl = S.view === "explore" && S.tab === "Plantillas" && !S.q;
  const on = { home: S.view === "home", library: inLib && !inTpl, builder: S.view === "builder", tpl: inTpl, favs: S.view === "favs" };
  const item = (key, attrs, icon, label) => '<button class="ni' + (on[key] ? " nia" : "") + '" data-act="' + attrs + '" aria-label="' + label + '"' + (on[key] ? ' aria-current="page"' : "") + '>' + ic(icon, 22) + '<span>' + label + '</span></button>';
  return item("home", 'nav" data-v="home', "home", "Inicio") + item("library", 'nav" data-v="library', "grid", "Biblioteca") + item("builder", 'nav" data-v="builder', "edit", "Creador")
    + item("tpl", 'tab" data-t="Plantillas', "layers", "Plantillas") + item("favs", 'nav" data-v="favs', "heart", "Colecciones");
}

function render(keepScroll) {
  const v = document.getElementById("view"), top = v.scrollTop;
  /* creador móvil: se conserva el desplazamiento del lienzo y (si no cambia de herramienta) el de la hoja */
  const oldCv = v.querySelector(".bmCanvas"), oldSh = v.querySelector(".bmSheet");
  const keepCv = oldCv ? oldCv.scrollTop : 0, keepSh = oldSh && keepScroll ? [oldSh.dataset.tool, oldSh.scrollTop] : null;
  document.body.dataset.view = S.view;
  if (pvIO) pvIO.disconnect();
  v.innerHTML = S.view === "home" ? renderHome() : S.view === "library" ? renderLibrary() : S.view === "explore" ? renderExplore() : S.view === "favs" ? renderFavs() : S.view === "builder" ? renderBuilder() : renderDetail();
  hydrate(v);
  const nav = document.getElementById("nav"), act = document.getElementById("actbar");
  if (S.view === "detail") {
    const fav = favs.includes(S.id);
    nav.style.display = "none"; act.style.display = "flex";
    act.innerHTML = '<button class="main" data-act="copycode" data-id="' + esc(S.id) + '">' + ic("copy", 16) + ' Copiar código</button>'
      + '<button class="fav' + (fav ? " on" : "") + '" data-act="fav" data-id="' + esc(S.id) + '" aria-label="' + (fav ? "Quitar de guardados" : "Guardar") + '">' + (fav ? icf("bookmark", 20) : ic("bookmark", 20)) + '</button>'
      + '<button data-act="dtab" data-d="edit" aria-label="Abrir editor">' + ic("sliders", 20) + '</button>';
  } else {
    nav.style.display = S.view === "builder" && isMobileBuilder() ? "none" : "flex"; act.style.display = "none"; nav.innerHTML = navHTML();
  }
  v.scrollTop = keepScroll ? top : 0;
  const cv = v.querySelector(".bmCanvas"); if (cv && oldCv) cv.scrollTop = keepCv;
  const sh = v.querySelector(".bmSheet"); if (sh && keepSh && sh.dataset.tool === keepSh[0]) sh.scrollTop = keepSh[1];
}
function renderList() {
  const el = document.getElementById("list"); if (!el) return;
  if (pvIO) pvIO.disconnect();
  el.innerHTML = listHTML(); hydrate(el);
  const c = document.getElementById("count"); if (c) c.textContent = (S.q ? listFor().length + " resultados en todas las categorías" : listFor().length + " estilos");
  const h = document.querySelector("h1.big"); if (h) h.textContent = S.q ? "Búsqueda" : S.tab === "Todo" ? "Todos los estilos" : S.tab;
  document.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", !S.q && x.dataset.t === S.tab));
}

/* ───────── Hojas (formularios, menú, confirmaciones) ───────── */
/* Foco: al abrir una hoja o el visor se guarda dónde estaba, Tab no sale del diálogo
   y al cerrar vuelve al botón que lo abrió. */
const focusStack = [];
function focusables(root) {
  return [...root.querySelectorAll('button,[href],input:not([type="hidden"]),select,textarea,[tabindex]:not([tabindex="-1"])')]
    .filter(x => !x.disabled && !x.hidden && x.getClientRects().length);
}
function restoreFocus() {
  const f = focusStack.pop();
  if (f && document.contains(f)) try { f.focus({ preventScroll: true }); } catch (e) { /* ignorar */ }
}
function openSheet(html) {
  const wrap = document.getElementById("sheetWrap"), card = document.getElementById("sheetCard");
  if (wrap.style.display === "none") focusStack.push(document.activeElement);
  card.innerHTML = html; card.setAttribute("tabindex", "-1"); card.scrollTop = 0;
  const h = card.querySelector("h2"); wrap.setAttribute("aria-label", h ? h.textContent : "Diálogo");
  wrap.style.display = "flex";
  try { card.focus({ preventScroll: true }); } catch (e) { /* ignorar */ }
}
function closeSheet() {
  const wrap = document.getElementById("sheetWrap");
  if (wrap.style.display === "none") return;
  wrap.style.display = "none"; pendingConfirm = null; pendingName = null; restoreFocus();
}
/* Pide un nombre con una hoja propia (prompt() no existe en todos los contenedores). */
let pendingName = null;
function askName(title, text, value, okLabel, onOk, max) {
  pendingName = onOk;
  openSheet('<div class="handle"></div><h2>' + esc(title) + '</h2>' + (text ? '<span class="sub">' + esc(text) + '</span>' : '')
    + '<input class="fld" id="askNameField" maxlength="' + (max || 40) + '" value="' + esc(value || "") + '"><div class="two"><button class="cta ghost" data-act="closesheet">Cancelar</button><button class="cta" data-act="nameok">' + esc(okLabel) + '</button></div>');
  const f = document.getElementById("askNameField"); if (f) { f.focus(); f.select(); }
}
function askConfirm(title, text, okLabel, onOk) {
  pendingConfirm = onOk;
  openSheet('<div class="handle"></div><h2>' + esc(title) + '</h2><span class="sub">' + esc(text) + '</span><div class="two"><button class="cta ghost" data-act="closesheet">Cancelar</button><button class="cta danger" data-act="confirm">' + esc(okLabel) + '</button></div>');
}
function variantOptions(tab, current) {
  const fam = TAB_FAMILY[tab], keys = Object.keys(D).filter(k => fam && k.indexOf(fam + ".") === 0);
  if (!keys.length) return '<option value="">Paleta (por defecto)</option>';
  return keys.map(k => '<option value="' + esc(k) + '"' + (k === current ? " selected" : "") + '>' + esc(k.split(".")[1]) + '</option>').join("");
}
function openForm(id, pre) {
  const e = id ? getEntry(id) : (pre || null);
  S.editId = id || null;
  if (!id && pre) S.tab = pre.tab || S.tab;
  const tabs = allTabs().filter(t => t !== "Referencias");
  const tabSel = (e ? e.tab : S.tab) || tabs[0];
  openSheet('<div class="handle"></div><h2>' + (id ? "Editar estilo" : "Añadir estilo") + '</h2>'
    + '<label class="l">Nombre</label><input class="fld" id="f-name" maxlength="80" value="' + esc(e ? e.name : "") + '">'
    + '<label class="l">Categoría</label><select class="fld" id="f-tab" data-input="tabsel">' + tabs.map(t => '<option' + (t === tabSel ? " selected" : "") + '>' + esc(t) + '</option>').join("") + '<option value="__new">+ Nueva categoría…</option></select>'
    + '<input class="fld" id="f-newtab" style="display:none" maxlength="30" placeholder="Nombre de la categoría nueva">'
    + '<label class="l">Diseño base (define la vista previa y el código)</label><select class="fld" id="f-v">' + variantOptions(tabSel, e ? e.v || "" : "") + '</select>'
    + '<label class="l">Referencia</label><input class="fld" id="f-ref" maxlength="80" value="' + esc(e ? e.ref : "") + '">'
    + '<label class="l">Descripción</label><textarea class="fld" id="f-desc" rows="2" maxlength="400">' + esc(e ? e.desc : "") + '</textarea>'
    + '<label class="l">Colores (hex separados por coma, máx. 6)</label><input class="fld" id="f-colors" value="' + esc(e && e.colors ? e.colors.join(", ") : "#2F6BFF, #FFFFFF, #14161B") + '">'
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
function autoBackupHTML() {
  if (!AutoBackup.supported) return '<label class="l">Copia automática</label><p class="sub">Tu navegador no permite guardar automáticamente en un archivo (funciona en Chrome y Edge de escritorio). Usa «Descargar» cuando quieras.</p>';
  const s = AutoBackup.state;
  let body;
  if (!AutoBackup.active) body = '<p class="sub">Elige un archivo una vez y la app lo irá actualizando sola cada vez que cambies algo.</p><button class="cta ghost" data-act="abchoose">' + ic("arrowDown", 16) + ' Elegir archivo…</button>';
  else if (s.perm !== "granted") body = '<p class="sub">En pausa: el navegador pide permiso otra vez para escribir en <b>' + esc(s.name) + '</b>.</p><div class="two"><button class="cta" data-act="abreconnect">Reactivar</button><button class="cta ghost" data-act="abstop">Quitar</button></div>';
  else body = '<p class="sub">Activa en <b>' + esc(s.name) + '</b> · ' + (s.last ? "última copia a las " + new Date(s.last).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "aún sin copiar") + (s.error ? "<br>Error: " + esc(s.error) : "") + '</p><div class="two"><button class="cta ghost" data-act="abnow">Guardar ahora</button><button class="cta ghost" data-act="abstop">Desactivar</button></div>';
  return '<label class="l">Copia automática en un archivo</label>' + body;
}
function openMenu() {
  let bak = false; try { bak = !!localStorage.getItem(KEY_BAK); } catch (e) { /* ignorar */ }
  const canShare = !!navigator.share;
  openSheet('<div class="handle"></div><h2>Ajustes</h2><span class="sub">Estilos v' + APP_VERSION + ' · ' + db().length + ' estilos · ' + refCount() + ' referencias · Sin internet · Datos en tu teléfono</span>'
    + '<label class="l">Tema</label>' + themeSegHTML()
    + '<button class="switchRow" role="switch" aria-checked="' + dimPreviews + '" data-act="dim"><span>Atenuar vistas previas claras en modo oscuro<small>Solo en las listas; el detalle se ve siempre tal cual.</small></span><i class="sw2"></i></button>'
    + '<label class="l">Copia de seguridad</label>'
    + '<div class="btns"><div class="two"><button class="cta ghost" data-act="dlfile">' + ic("arrowDown", 16) + ' Descargar</button>'
    + (canShare ? '<button class="cta ghost" data-act="sharefile">' + ic("share", 16) + ' Compartir</button>' : '<button class="cta ghost" data-act="impfile">' + ic("upload", 16) + ' Importar</button>') + '</div>'
    + (canShare ? '<button class="cta ghost" data-act="impfile">' + ic("upload", 16) + ' Importar desde archivo</button>' : '')
    + '<span class="sub">Incluye tus estilos, ediciones y borrados, el proyecto del constructor con sus imágenes, tus temas y tus capturas propias.</span></div>'
    + autoBackupHTML()
    + '<details class="adv"><summary>Exportar o importar como texto</summary>'
    + '<textarea class="fld" id="ioText" rows="6" placeholder="Exporta para ver o pega un JSON para importar"></textarea>'
    + '<div class="btns"><button class="cta ghost" data-act="export">Mostrar mis cambios</button><div class="two"><button class="cta ghost" data-act="copyio">Copiar</button><button class="cta ghost" data-act="import">Importar</button></div>'
    + (bak ? '<button class="cta ghost" data-act="backup">Ver respaldo de la versión 1.5</button>' : '') + '</div></details>'
    + '<div class="btns"><button class="cta ghost" data-act="restore">Restaurar el catálogo original</button><button class="cta ghost" data-act="closesheet">Cerrar</button></div>');
}
function blobToDataURL(b) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsDataURL(b); }); }
/* Copia completa: estilos del usuario, proyecto del constructor (con sus imágenes), temas y capturas propias.
   Con {media:false} (cuadro de texto) se omiten las imágenes para que el texto sea manejable. */
async function exportJSON(opts) {
  const withMedia = !opts || opts.media !== false;
  syncActiveScreen();
  let bj = mediaInflate(JSON.stringify(Object.assign({}, builder, { layers: undefined, selected: undefined, activeLayer: undefined })));
  if (!withMedia) bj = bj.replace(MEDIA_RE, '""').replace(MEDIA_REF_RE, '""');
  const out = { app: "estilos", format: 2, version: APP_VERSION, added: user.added, edits: user.edits, deleted: user.deleted, builder: JSON.parse(bj), themes: builderThemes };
  if (withMedia && userRefs.length) out.refs = await Promise.all(userRefs.map(async r => ({ id: r.id, label: r.label, date: r.date, data: await blobToDataURL(r.blob) })));
  return JSON.stringify(out, null, withMedia ? 0 : 2);
}
async function exportFile() { return new File([await exportJSON()], "estilos-" + new Date().toISOString().slice(0, 10) + ".json", { type: "application/json" }); }
async function downloadFile() {
  const f = await exportFile();
  downloadBlob(f, f.name); toast("Copia descargada: " + f.name);
}
async function shareFile() {
  try {
    const f = await exportFile();
    if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: "Copia de Estilos" });
    else await navigator.share({ title: "Copia de Estilos", text: await exportJSON({ media: false }) });
  } catch (err) { if (err && err.name !== "AbortError") downloadFile(); }
}
async function doExport() {
  document.getElementById("ioText").value = await exportJSON({ media: false });
  toast("Listo para copiar (sin imágenes)");
}
function doImport() { doImportText(document.getElementById("ioText").value); }
async function doImportText(text) {
  try {
    const raw = JSON.parse(text);
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
    if (src.builder && typeof src.builder === "object" && !Array.isArray(src.builder)) {
      builderHistorySnapshot();    /* se puede deshacer desde el constructor */
      builder = sanitizeBuilder(src.builder); loadActiveScreen(); saveBuilder(); n++;
    }
    if (Array.isArray(src.themes)) {
      src.themes.slice(0, 50).forEach(t => {
        if (!t || typeof t !== "object") return;
        const th = { id: "theme-" + (safeId(t.id).replace(/^theme-/, "") || Date.now().toString(36)), name: String(t.name || "Tema").slice(0, 40), palette: safeColor(t.palette), bg: safeColor(t.bg), font: BUILDER_FONTS.includes(t.font) ? t.font : "Inter", radius: Math.max(8, Math.min(32, Number(t.radius) || 20)) };
        const i = builderThemes.findIndex(x => x.id === th.id); if (i >= 0) builderThemes[i] = th; else builderThemes.push(th);
        n++;
      });
      writeJSON("estilos-themes-v1", builderThemes);
    }
    if (Array.isArray(src.refs)) {
      const ok = src.refs.filter(r => r && typeof r === "object" && isDataImg(r.data)).slice(0, 40);
      for (const r of ok) {
        const p = dataUrlBytes(r.data); if (!p) continue;
        await RefStore.put({ id: "r" + safeId(r.id || Date.now().toString(36)), label: String(r.label || "Captura").slice(0, 60), date: Number(r.date) || Date.now(), blob: new Blob([p.bytes], { type: p.mime }) }); n++;
      }
      if (ok.length) await loadUserRefs();
    }
    if (!n && !(src.deleted || []).length) throw 0;
    if (!saveUser()) return;
    closeSheet(); render(true); toast("Importado: " + n + " cambios");
  } catch (e) { toast("JSON no válido"); }
}

/* ───────── Eventos (delegación) ───────── */
let lbCur = null;
function openLB(r) {
  if (!r) return;
  const lb = document.getElementById("lightbox");
  if (lb.style.display === "none") focusStack.push(document.activeElement);
  lbCur = r;
  document.getElementById("lbImg").src = r.src; document.getElementById("lbImg").alt = r.label;
  document.getElementById("lbCap").textContent = r.label;
  document.getElementById("lbBar").innerHTML = '<button data-act="palette">' + ic("spark", 16) + ' Sacar paleta</button>'
    + (r.uid ? '<button data-act="delref" data-id="' + esc(r.uid) + '" aria-label="Borrar captura">' + ic("trash", 16) + '</button>' : '')
    + '<button data-act="closelb" aria-label="Cerrar">' + ic("close", 16) + ' Cerrar</button>';
  lb.style.display = "flex";
  const b = lb.querySelector('[data-act="closelb"]:not(img)'); if (b) b.focus({ preventScroll: true });
}
function closeLB() {
  const lb = document.getElementById("lightbox"); if (lb.style.display === "none") return;
  lb.style.display = "none"; lbCur = null; restoreFocus();
}
function paletteFromLB() {
  const r = lbCur; if (!r) return;
  loadImage(r.src).then(img => {
    const cols = extractPalette(img, 6); if (!cols.length) return toast("No se encontraron colores");
    openSheet('<div class="handle"></div><h2>Paleta de la captura</h2><span class="sub">' + esc(r.label) + ' · toca un color para copiarlo</span>'
      + '<div class="palBig">' + cols.map(c => '<button data-act="color" data-c="' + c + '" style="background:' + c + ';color:' + inkOn(c) + '" aria-label="Copiar ' + c + '">' + c + '</button>').join("") + '</div>'
      + '<div class="btns"><button class="cta" data-act="mkstyle" data-c="' + cols.join(",") + '" data-l="' + esc(r.label) + '">' + ic("plus", 16, 2.6) + ' Crear estilo con esta paleta</button>'
      + '<button class="cta ghost" data-act="palbuilder" data-c="' + cols.join(",") + '" data-l="' + esc(r.label) + '">' + ic("layers", 16) + ' Aplicar al constructor</button>'
      + '<div class="two"><button class="cta ghost" data-act="palcopy" data-c="' + cols.join(",") + '">Copiar HEX</button><button class="cta ghost" data-act="closesheet">Cerrar</button></div></div>');
  }).catch(() => toast("No se pudo leer la imagen"));
}
/* ───────── Capturas propias ───────── */
let refsLoadedOnce = false;
function loadUserRefs() {
  return RefStore.all().then(list => {
    if (refsLoadedOnce) AutoBackup.touch(); refsLoadedOnce = true;
    userRefs.forEach(r => URL.revokeObjectURL(r.url));
    userRefs = list.map(r => Object.assign({}, r, { url: URL.createObjectURL(r.blob) }));
    if (S.view === "home" || (S.view === "explore" && S.tab === "Referencias")) render(true);
  }).catch(() => { /* sin IndexedDB: solo las capturas incluidas */ });
}
function addRefs(files) {
  files = [...files].filter(f => /^image\//.test(f.type)).slice(0, 20);
  if (!files.length) return toast("Elige una imagen");
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  toast("Guardando " + files.length + (files.length > 1 ? " capturas…" : " captura…"));
  Promise.all(files.map((f, i) => shrinkImage(f, 1400).then(blob => RefStore.put({
    id: "r" + Date.now().toString(36) + i, label: (f.name || "Captura").replace(/\.[^.]+$/, "").slice(0, 60) || "Captura", date: Date.now() + i, blob
  })))).then(() => loadUserRefs()).then(() => toast(files.length > 1 ? "Capturas añadidas" : "Captura añadida"))
    .catch(() => toast("No se pudo guardar (¿almacenamiento lleno?)"));
}
function toggleFav(id) {
  const i = favs.indexOf(id);
  if (i >= 0) { favs.splice(i, 1); toast("Quitado de guardados"); } else { favs.push(id); toast("Guardado"); }
  saveFavs(); render(true);
}
function surprise() {
  const pool = db().filter(e => e.id !== S.id); if (!pool.length) return;
  go({ view: "detail", id: pool[Math.floor(Math.random() * pool.length)].id, detailTab: "info" });
}

function curCode(id) {
  const e = getEntry(id); if (!e) return "";
  return stackCode(live(e), S.view === "detail" && S.detailTab === "code" ? S.stack || "html" : "html");
}
function liveEdit(fn) { const d = ensureDraft(); if (!d) return; fn(d); render(true); }

const ACT = {
  buildermobilejump: d => { const target=document.getElementById(d.target); if(target) target.scrollIntoView({behavior:"smooth",block:"start"}); },
  buildertextmode: () => { builderTextEditMode=!builderTextEditMode; render(true); toast(builderTextEditMode?"Toca un texto dentro del diseño para editarlo":"Edición de texto finalizada"); },
  buildermediamode: () => { builderMediaEditMode=!builderMediaEditMode; builderTextEditMode=false; render(true); toast(builderMediaEditMode?"Toca una imagen o icono para reemplazarlo":"Edición de imágenes finalizada"); },
  open: d => { draft = null; go({ view: "detail", id: d.id, detailTab: "info", stage: "auto" }); },
  back: () => goBack(),
  nav: d => go({ view: d.v, q: d.v === "explore" ? S.q : "" }),
  pmode: d => go({ pmode: d.m }, { replace: true, keep: true }),
  dlpng: d => { const e = getEntry(d.id); if (e) componentImage(live(e), "png"); },
  dlsvg: d => { const e = getEntry(d.id); if (e) componentImage(live(e), "svg"); },
  libgroup: d => go({ group: d.g }, { replace: true, keep: true }),
  tab: d => go({ view: "explore", tab: d.t, q: "" }),
  gosearch: () => { go({ view: "explore", q: "", tab: "Todo" }); const q = document.getElementById("q"); if (q) q.focus(); },
  fav: d => toggleFav(d.id),
  color: d => copyText(d.c, "Copiado: " + d.c),
  pal: d => { const e = getEntry(d.id); if (e) copyText(palText(e, d.f), "Paleta copiada (" + d.f.toUpperCase() + ")"); },
  copycode: d => { const c = curCode(d.id); if (c) copyText(c, "Código copiado"); },
  stack: d => go({ stack: d.s }, { replace: true, keep: true }),
  more: d => moreSheet(d.id),
  dup: d => { closeSheet(); saveVariant(); },
  sharecode: d => {
    const e = getEntry(d.id); if (!e) return; const text = curCode(d.id); closeSheet();
    if (navigator.share) navigator.share({ title: e.name, text }).catch(err => { if (err && err.name !== "AbortError") copyText(text, "Código copiado"); });
    else copyText(text, "Código copiado");
  },
  ladd: () => liveEdit(x => { if (x.colors.length < 6) x.colors.push(mix(x.colors[x.colors.length - 1], x.mode === "dark" ? "#000000" : "#FFFFFF", .4).toUpperCase()); }),
  ldel: d => liveEdit(x => { if (x.colors.length > 1) x.colors.splice(+d.i, 1); }),
  lround: () => liveEdit(x => { x.radius = String(x.radius).indexOf("%") >= 0 ? "16" : "50%"; }),
  lmode: d => liveEdit(x => { x.mode = d.m === "dark" ? "dark" : "light"; }),
  lreset: () => { draft = null; render(true); toast("Cambios descartados"); },
  lsave: () => saveVariant(),
  lapply: () => applyDraft(),
  dim: el => {
    dimPreviews = !dimPreviews; try { localStorage.setItem(KEY_DIM, dimPreviews ? "1" : "0"); } catch (e) { /* ignorar */ }
    applyDim(); const b = document.querySelector('[data-act="dim"]'); if (b) b.setAttribute("aria-checked", dimPreviews);
  },
  dlfile: () => downloadFile(),
  sharefile: () => shareFile(),
  impfile: () => document.getElementById("fileJson").click(),
  addref: () => document.getElementById("fileRef").click(),
  lbu: d => { const r = userRefs.find(x => x.id === d.id); if (r) openLB({ src: r.url, label: r.label, uid: r.id }); },
  palette: () => paletteFromLB(),
  palbuilder: d => {
    const cols = String(d.c || "").split(",").filter(c => HEX_RE.test(c)); if (!cols.length) return;
    builderHistorySnapshot();
    const accent = bestAccent(cols), light = cols.slice().sort((a, b) => lum(b) - lum(a))[0];
    const bg = mix(light, "#FFFFFF", .82).toUpperCase(), name = ("Paleta · " + (d.l || "captura")).slice(0, 40);
    builder.palette = safeColor(accent); builder.bg = safeColor(bg);
    builderThemes.push({ id: "theme-" + Date.now().toString(36), name, palette: builder.palette, bg: builder.bg, font: builder.font, radius: builder.radius });
    writeJSON("estilos-themes-v1", builderThemes); saveBuilder();
    closeSheet(); closeLB(); go({ view: "builder" }); toast("Paleta aplicada al constructor y guardada como tema");
  },
  palcopy: d => copyText(d.c.split(",").join("\n"), "Paleta copiada"),
  mkstyle: d => { closeSheet(); closeLB(); openForm(null, { tab: "Paletas", v: "pal.sample", name: ("Paleta · " + (d.l || "captura")).slice(0, 80), ref: d.l || "", colors: d.c.split(","), radius: "16", mode: "light", desc: "Paleta extraída de una captura.", tip: "" }); },
  delref: d => askConfirm("¿Borrar esta captura?", "Se elimina de este dispositivo.", "Borrar", () => { closeSheet(); closeLB(); RefStore.del(d.id).then(loadUserRefs).then(() => toast("Captura borrada")).catch(() => toast("No se pudo borrar")); }),
  dtab: d => { closeSheet(); go({ detailTab: d.d }, { replace: true, keep: true }); },
  stage: () => go({ stage: STAGE_NEXT[S.stage] }, { replace: true, keep: true }),
  surprise: () => surprise(),
  add: () => openForm(),
  edit: d => { closeSheet(); openForm(d.id); },
  saveform: () => saveForm(),
  del: d => askConfirm("¿Eliminar este estilo?", "Dejará de aparecer en la biblioteca. Puedes recuperarlo con «Restaurar el catálogo original».", "Eliminar", () => deleteEntry(d.id)),
  confirm: () => { const f = pendingConfirm; pendingConfirm = null; if (f) f(); },
  nameok: () => { const f = pendingName, el = document.getElementById("askNameField"), v = el ? el.value.trim() : ""; if (!v) { toast("Escribe un nombre"); return; } pendingName = null; closeSheet(); if (f) f(v); },
  menu: () => openMenu(),
  theme: d => {
    setTheme(d.t);
    document.querySelectorAll(".themeSeg button").forEach(b => { const on = b.dataset.t === theme; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
    render(true);
  },
  themecycle: () => { setTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]); render(true); toast("Tema: " + THEME_LABEL[theme] + (theme === "auto" ? " (sigue al sistema)" : "")); },
  export: () => doExport(),
  copyio: () => copyText(document.getElementById("ioText").value, "Copiado"),
  import: () => doImport(),
  backup: () => { document.getElementById("ioText").value = localStorage.getItem(KEY_BAK) || ""; toast("Respaldo de la v1.5 cargado"); },
  restore: () => askConfirm("¿Restaurar el catálogo?", "Se deshacen tus ediciones y borrados del catálogo. Lo que creaste tú se conserva.", "Restaurar", () => { user.edits = {}; user.deleted = []; saveUser(); closeSheet(); render(true); toast("Catálogo restaurado"); }),
  builderreset: () => askConfirm("Restablecer constructor", "Se borrarán las pantallas y ajustes de este proyecto.", "Restablecer", () => { builder={title:"Mi nueva interfaz",subtitle:"Una experiencia diseñada a tu manera",palette:"#635BFF",bg:"#F5F6FA",font:"Inter",radius:20,selected:[],layers:[],activeLayer:0,screens:[],activeScreenIndex:0};builder.screens=[cleanScreen({id:"screen-home",title:builder.title,subtitle:builder.subtitle,selected:[],layers:[]},0)];loadActiveScreen();saveBuilder();closeSheet();render(); }),
  builderscreen: d => { saveBuilder(); const i=Number(d.index); if(Number.isInteger(i)&&i>=0&&i<builder.screens.length){builder.activeScreenIndex=i;loadActiveScreen();saveBuilder();render(true);} },
  builderscreenadd: () => { if(builder.screens.length>=8){toast("Máximo ocho pantallas");return;} saveBuilder(); const n=builder.screens.length+1; builder.screens.push(cleanScreen({id:"screen-"+Math.random().toString(36).slice(2,9),title:"Pantalla "+n,subtitle:"Nueva sección de tu proyecto",selected:[],layers:[]},n-1)); builder.activeScreenIndex=builder.screens.length-1;loadActiveScreen();saveBuilder();render(true); },
  builderscreenduplicate: () => { if(builder.screens.length>=8){toast("Máximo ocho pantallas");return;} saveBuilder(); const copy=cleanScreen(Object.assign({},builder.screens[builder.activeScreenIndex],{id:"screen-"+Math.random().toString(36).slice(2,9),title:builder.title+" copia",selected:builder.selected.slice(),layers:builder.layers.map(x=>Object.assign({},x))}),builder.screens.length);builder.screens.splice(builder.activeScreenIndex+1,0,copy);builder.activeScreenIndex++;loadActiveScreen();saveBuilder();render(true); },
  builderscreendelete: () => { if(builder.screens.length<=1){toast("Debe quedar al menos una pantalla");return;} askConfirm("Eliminar pantalla","Se eliminará esta pantalla y sus componentes. Las demás pantallas se conservarán.","Eliminar",()=>{builder.screens.splice(builder.activeScreenIndex,1);builder.activeScreenIndex=Math.max(0,builder.activeScreenIndex-1);loadActiveScreen();saveBuilder();closeSheet();render(true);}); },
  buildertheme: d => { const themes={violet:{palette:"#635BFF",bg:"#F5F6FA",font:"Inter",radius:20},midnight:{palette:"#8B7CFF",bg:"#171827",font:"Inter",radius:18},ivory:{palette:"#A36A43",bg:"#F7F1E8",font:"Georgia",radius:22},mint:{palette:"#168C78",bg:"#EFF8F4",font:"Plus Jakarta Sans",radius:16}};const t=themes[d.theme]||builderThemes.find(x=>x.id===d.theme);if(t){builder.palette=t.palette;builder.bg=t.bg;builder.font=t.font;builder.radius=t.radius;saveBuilder();render(true);} },
  builderthemesave: () => { openSheet('<div class="handle"></div><h2>Guardar tema</h2><span class="sub">Guarda los colores, tipografía y redondeo actuales para reutilizarlos.</span><label class="l">Nombre del tema</label><input class="fld" id="builderThemeName" maxlength="40" placeholder="Ej. Mi tema premium"><div class="two"><button class="cta ghost" data-act="closesheet">Cancelar</button><button class="cta" data-act="builderthemesaveconfirm">Guardar</button></div>'); },
  builderthemesaveconfirm: () => { const field=document.getElementById("builderThemeName"),name=field&&field.value.trim();if(!name){toast("Escribe un nombre para el tema");return;}builderThemes.push({id:"theme-"+Date.now(),name:name.slice(0,40),palette:safeColor(builder.palette),bg:safeColor(builder.bg),font:builder.font,radius:builder.radius});writeJSON("estilos-themes-v1",builderThemes);closeSheet();toast("Tema guardado");render(true); },
  builderpreset: d => { const i=builder.activeLayer,l=builder.layers[i];if(!l)return;const v=d.preset;l.variant=v;if(v==="glass"){l.bg="#FFFFFF";l.borderWidth=1;l.borderColor="#FFFFFF";l.elevation=3;}if(v==="soft"){l.bg="#F2F3FA";l.borderWidth=0;l.elevation=3;}if(v==="outline"){l.bg="#FFFFFF";l.borderWidth=1;l.borderColor=l.color||"#635BFF";l.elevation=0;}if(v==="bold"){l.bg="#EEEDFF";l.borderWidth=0;l.elevation=3;l.radius=20;}saveBuilder();render(true);toast("Estilo "+v+" aplicado"); },
  builderadd: d => { const id=String(d.id||d.pickerId||""); /* las tarjetas del selector llevan data-picker-id */if(!getEntry(id))return;if(builder.selected.length>=12){toast("Máximo doce componentes por pantalla");return;}builder.selected.push(id);builder.layers.push({uid:"layer-"+Math.random().toString(36).slice(2,9),label:"",bg:"#FFFFFF",color:"#263247",radius:16,padding:12});builder.activeLayer=builder.selected.length-1;if(isMobileBuilder())S.btool=null;saveBuilder();render(true);toast("Diseño añadido a la pantalla");setTimeout(bmFocusActive,30); },
  builderselect: d => { builder.activeLayer=Math.max(0,Math.min(builder.selected.length-1,Number(d.index)||0));saveBuilder();render(true); },
  builderundo: () => builderUndo(),
  builderredo: () => builderRedo(),
  buildergroupadd: () => { if(!builder.layers[builder.activeLayer]){toast("Añade una capa antes de crear una carpeta");return;} askName("Nueva carpeta","La capa seleccionada se moverá a esta carpeta.","Nueva carpeta","Crear",n=>ACT.buildergroupaddok({name:n})); },
  buildergroupaddok: d => { const name=String(d.name||"").trim().slice(0,40);if(!name)return;if(builder.layers.some(x=>x.group===name)){toast("Ya existe esa carpeta");return;}if(builder.layers[builder.activeLayer])builder.layers[builder.activeLayer].group=name;else{toast("Añade una capa antes de crear una carpeta");return;}builderCollapsedGroups.delete(name);saveBuilder();render(true);toast("Carpeta creada"); },
  buildergroupcollapse: d => { const name=String(d.group||"");if(builderCollapsedGroups.has(name))builderCollapsedGroups.delete(name);else builderCollapsedGroups.add(name);render(true); },
  buildergrouprename: d => { const old=String(d.group||""); askName("Renombrar carpeta","",old,"Guardar",n=>{builderHistorySnapshot();ACT.buildergrouprenameok({group:old,name:n});}); },
  buildergrouprenameok: d => { const old=String(d.group||""),name=String(d.name||"").trim().slice(0,40);if(!name||name===old)return;if(builder.layers.some(x=>x.group===name)){toast("Ya existe una carpeta con ese nombre");return;}builder.layers.forEach(x=>{if(x.group===old)x.group=name;});if(builderCollapsedGroups.has(old)){builderCollapsedGroups.delete(old);builderCollapsedGroups.add(name);}saveBuilder();render(true); },
  buildergroupdelete: d => { const name=String(d.group||""); askConfirm("¿Eliminar la carpeta «"+name+"»?","Las capas se conservan, sin carpeta.","Eliminar",()=>{closeSheet();builderHistorySnapshot();ACT.buildergroupdeleteok({group:name});}); },
  buildergroupdeleteok: d => { const name=String(d.group||"");builder.layers.forEach(x=>{if(x.group===name)x.group="";});builderCollapsedGroups.delete(name);saveBuilder();render(true); },
  builderlayerhide: d => { const i=Number(d.index),layer=builder.layers[i];if(!layer)return;layer.hidden=!layer.hidden;saveBuilder();render(true);toast(layer.hidden?"Capa oculta":"Capa visible"); },
  builderlayerlock: d => { const i=Number(d.index),layer=builder.layers[i];if(!layer)return;layer.locked=!layer.locked;saveBuilder();render(true);toast(layer.locked?"Capa bloqueada":"Capa desbloqueada"); },
  builderremove: d => { const i=Number(d.index); if(Number.isInteger(i)&&i>=0&&i<builder.selected.length){builder.selected.splice(i,1);builder.layers.splice(i,1);builder.activeLayer=Math.max(0,Math.min(builder.selected.length-1,builder.activeLayer));} else builder.selected=builder.selected.filter(id=>id!==d.id); saveBuilder();render(true); },
  buildermove: d => { const i=Number(d.index),to=i+Number(d.dir); if(builder.layers[i]&&builder.layers[i].locked){toast("Desbloquea la capa para cambiar su orden");return;} if(Number.isInteger(i)&&to>=0&&to<builder.selected.length&&!(builder.layers[to]&&builder.layers[to].locked)){const item=builder.selected.splice(i,1)[0];builder.selected.splice(to,0,item);const layer=builder.layers.splice(i,1)[0];builder.layers.splice(to,0,layer);builder.activeLayer=to;saveBuilder();render(true);} },
  builderduplicate: d => { const i=Number(d.index); if(builder.selected.length>=12){toast('Máximo doce capas');return;} if(Number.isInteger(i)&&i>=0&&i<builder.selected.length){builder.selected.splice(i+1,0,builder.selected[i]);const copy=JSON.parse(JSON.stringify(builder.layers[i]||{}));copy.uid="layer-"+Math.random().toString(36).slice(2,9);copy.locked=false;builder.layers.splice(i+1,0,copy);builder.activeLayer=i+1;saveBuilder();render(true);toast('Componente duplicado');} },
  builderexport: () => exportBuilder(),
  builderexportzip: () => exportBuilderZip(),
  bsheet: d => { const cur = bmTool(); go({ btool: cur === d.s ? null : d.s }, { replace: true, keep: true }); setTimeout(bmFocusActive, 30); },
  bmode: d => go({ bmode: d.m }, { replace: true, keep: true }),
  layerset: d => {
    const i = Number(d.index), l = builder.layers[i]; if (!l) return;
    const f = String(d.field), v = String(d.value), hex = /^#[0-9a-f]{3,8}$/i;
    const ok = { bg: hex, color: hex, borderColor: hex, variant: /^(default|glass|soft|outline|bold)$/, weight: /^(400|500|600|700|800)$/, align: /^(left|center|right)$/, animation: /^(none|fade|rise|zoom|float|pulse)$/ };
    if (!ok[f] || !ok[f].test(v)) return;
    builderHistorySnapshot(); l[f] = f === "bg" || f === "color" || f === "borderColor" ? safeColor(v) : v; saveBuilder(); render(true);
  },
  devset: d => { if (!DEVICES[d.v]) return; builderHistorySnapshot(); builder.device = d.v; saveBuilder(); render(true); },
  bcopy: () => { const e = pickedBuilder()[builder.activeLayer]; if (!e) return; const l = builder.layers[builder.activeLayer] || {}, st = S.stack || "html"; copyText(st === "html" ? builderEditedMediaCode(e, l) : stackCode(e, st), "Código copiado"); },
  abchoose: async () => { try { const ok = await AutoBackup.choose(); toast(ok ? "Copia automática activada" : "Activada, pero aún no se pudo escribir"); } catch (e) { if (!(e && e.name === "AbortError")) toast("No se pudo elegir el archivo"); } openMenu(); },
  abreconnect: async () => { const ok = await AutoBackup.reconnect(); toast(ok ? "Copia automática reactivada" : "No se concedió el permiso"); openMenu(); },
  abnow: async () => { const ok = await AutoBackup.write(); toast(ok ? "Copia guardada" : "No se pudo guardar"); openMenu(); },
  abstop: async () => { await AutoBackup.stop(); toast("Copia automática desactivada"); openMenu(); },
  builderlink: async () => {
    try {
      const url = await builderShareLink(), msg = url.length > 8000 ? "Enlace copiado (largo: " + url.length + " caracteres; algunos chats lo cortan, mejor el ZIP)" : "Enlace copiado";
      if (navigator.share) { try { await navigator.share({ title: builder.title || "Proyecto de Estilos", url }); } catch (e) { if (e && e.name === "AbortError") return; copyText(url, msg); } }
      else copyText(url, msg);
    } catch (e) { toast("No se pudo crear el enlace"); }
  },
  builderexportdark: () => { builder.exportDark = !builder.exportDark; saveBuilder(); const b = document.querySelector('[data-act="builderexportdark"]'); if (b) b.setAttribute("aria-checked", !!builder.exportDark); },
  closesheet: () => closeSheet(),
  lb: d => { const r = REFS[+d.i]; if (r) openLB({ src: r.img, label: r.label }); },
  closelb: () => closeLB()
};
document.addEventListener("click",ev=>{
  if(!builderMediaEditMode)return;
  const path=ev.composedPath?ev.composedPath():[];
  const block=path.find(n=>n&&n.classList&&n.classList.contains("builder-block"));
  if(!block)return;
  const pvEl=block.querySelector(".pv");if(!pvEl||!pvEl.shadowRoot)return;
  /* Los botones de la app se respetan; los botones que forman parte del diseño sí se editan. */
  if(path.some(n=>n&&n.tagName==="BUTTON"&&n.getRootNode&&n.getRootNode()!==pvEl.shadowRoot))return;
  const blockIndex=Number(block.dataset.builderPreviewLayer);if(builder.layers[blockIndex]&&builder.layers[blockIndex].locked){toast("Esta capa está bloqueada");return;}
  let node=path.find(n=>n&&n.tagName==="IMG");
  if(!node)node=path.find(isSvgEl);
  if(!node)node=path.find(n=>n&&n.nodeType===1&&n.getRootNode&&n.getRootNode()===pvEl.shadowRoot&&getComputedStyle(n).backgroundImage!=="none");
  if(!node)return;
  builderHistorySnapshot();
  ev.preventDefault();ev.stopPropagation();
  const index=Number(block.dataset.builderPreviewLayer);
  builderPendingMedia={index,path:builderNodePath(node,pvEl.shadowRoot),tag:String(node.tagName||"").toLowerCase()};
  const input=document.getElementById("builder-media-file");
  if(input){input.value="";input.click();}
},true);
document.addEventListener("change",ev=>{
  if(ev.target&&(ev.target.dataset&&ev.target.dataset.layerGroup!==undefined||ev.target.id==="builder-media-file"))builderHistorySnapshot();
  const groupSelect=ev.target.closest&&ev.target.closest("[data-layer-group]");
  if(groupSelect){const i=Number(groupSelect.dataset.layerGroup),layer=builder.layers[i];if(layer){layer.group=String(groupSelect.value||"").slice(0,40);saveBuilder();render(true);}return;}

  const input=ev.target;
  if(!input||input.id!=="builder-media-file"||!input.files||!input.files[0])return;
  const file=input.files[0],pending=builderPendingMedia;
  if(!pending)return;
  if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>6*1024*1024){toast("Usa PNG, JPG o WebP de hasta 6 MB");builderPendingMedia=null;return;}
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{
    try{
      const Q=IMAGE_QUALITY[builder.imageQuality]||IMAGE_QUALITY.mid;
      const scale=Math.min(1,Q.max/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,canvas.width,canvas.height);
      let data=canvas.toDataURL("image/webp",Q.q);
      if(data.length>Q.soft)data=canvas.toDataURL("image/jpeg",Q.jq);
      if(data.length>Q.hard){toast("La imagen sigue siendo demasiado pesada: prueba con calidad Baja");return;}
      const layer=builder.layers[pending.index];if(!layer)return;
      layer.mediaEdits=layer.mediaEdits||{};layer.mediaEdits[pending.path]=data;layer.editMeta=layer.editMeta||{};layer.editMeta["m:"+pending.path]={t:pending.tag,b:""};
      builder.activeLayer=pending.index;saveBuilder();render(true);toast("Imagen reemplazada");
    }catch(_){toast("No se pudo procesar la imagen");}
    finally{URL.revokeObjectURL(url);builderPendingMedia=null;}
  };
  img.onerror=()=>{URL.revokeObjectURL(url);builderPendingMedia=null;toast("No se pudo abrir esa imagen");};
  img.src=url;
},true);
document.addEventListener("click",ev=>{
  if(!builderTextEditMode)return;
  /* El punto de historial se guarda solo al empezar a editar un texto: antes se guardaba
     en cualquier clic, también en «Deshacer», que entonces volvía al mismo estado. */
  const path=ev.composedPath?ev.composedPath():[];
  const block=path.find(n=>n&&n.classList&&n.classList.contains("builder-block"));
  if(!block)return;
  const blockIndex=Number(block.dataset.builderPreviewLayer);if(builder.layers[blockIndex]&&builder.layers[blockIndex].locked){toast("Esta capa está bloqueada");return;}
  const pvEl=block.querySelector(".pv");
  if(!pvEl||!pvEl.shadowRoot){toast("Este diseño usa un código aislado y no permite edición directa");return;}
  if(path.some(n=>n&&n.tagName==="BUTTON"&&n.getRootNode&&n.getRootNode()!==pvEl.shadowRoot))return;
  const node=path.find(n=>n&&n.nodeType===1&&n.getRootNode&&n.getRootNode()===pvEl.shadowRoot&&n.children&&n.children.length===0&&String(n.textContent||"").trim()&&!/^(svg|path|style|script)$/i.test(n.tagName));
  if(!node){
    const own=path.find(n=>n&&n.nodeType===1&&n.getRootNode&&n.getRootNode()===pvEl.shadowRoot&&!/^(svg|path|style|script)$/i.test(n.tagName)&&ownText(n));
    if(!own)return;
    ev.preventDefault();ev.stopPropagation();
    const idx=Number(block.dataset.builderPreviewLayer),lay=builder.layers[idx];if(!lay)return;
    const key=builderNodePath(own,pvEl.shadowRoot)+"::own";
    builderHistorySnapshot();
    const prevMeta=editMetaOf(lay,key),base=prevMeta?prevMeta.b:ownText(own),tagName=String(own.tagName||"").toLowerCase();
    askName("Editar texto","Este texto va junto a un icono; el icono se conserva.",ownText(own),"Guardar",v=>{lay.textEdits=lay.textEdits||{};lay.textEdits[key]=String(v).slice(0,500);lay.editMeta=lay.editMeta||{};lay.editMeta[key]={t:tagName,b:base};setOwnText(own,lay.textEdits[key]);saveBuilder();toast("Texto actualizado");},120);
    return;
  }
  ev.preventDefault();ev.stopPropagation();
  builderHistorySnapshot();
  const index=Number(block.dataset.builderPreviewLayer),layer=builder.layers[index];if(!layer)return;
  node.dataset.previousOutline=node.style.outline||"";node.dataset.previousRadius=node.style.borderRadius||"";node.style.outline="2px solid #635bff";node.style.borderRadius="4px";node.setAttribute("contenteditable","true");node.setAttribute("spellcheck","true");
  node.dataset.builderInlineEdit="1";node.dataset.builderInlineIndex=String(index);
  {const k0=builderNodePath(node,pvEl.shadowRoot),pm=editMetaOf(layer,k0);node.dataset.builderBase=pm?pm.b:String(node.textContent||"").trim();node.dataset.builderTag=String(node.tagName||"").toLowerCase();}
  node.focus();
},true);
document.addEventListener("focusout",ev=>{
  const path=ev.composedPath?ev.composedPath():[];
  const node=path.find(n=>n&&n.dataset&&n.dataset.builderInlineEdit==="1");
  if(!node)return;
  const index=Number(node.dataset.builderInlineIndex),shadow=node.getRootNode();
  const layer=builder.layers[index];
  if(layer&&shadow&&shadow.host){
    const key=builderNodePath(node,shadow);
    layer.textEdits=layer.textEdits||{};layer.textEdits[key]=String(node.textContent||"").slice(0,500);layer.editMeta=layer.editMeta||{};layer.editMeta[key]={t:node.dataset.builderTag||String(node.tagName||"").toLowerCase(),b:node.dataset.builderBase||""};delete node.dataset.builderBase;delete node.dataset.builderTag;
    node.removeAttribute("contenteditable");node.style.outline=node.dataset.previousOutline||"";node.style.borderRadius=node.dataset.previousRadius||"";delete node.dataset.previousOutline;delete node.dataset.previousRadius;delete node.dataset.builderInlineEdit;delete node.dataset.builderInlineIndex;
    saveBuilder();toast("Texto actualizado");
  }
},true);
document.addEventListener("click", ev => {
  const el = ev.target.closest("[data-act]");
  if (el && ACT[el.dataset.act]) { ev.stopPropagation(); if(/^builder/.test(el.dataset.act)&&!["builderundo","builderredo","buildermobilejump","buildertextmode","buildermediamode","builderscreen","buildergrouprename","buildergroupdelete","buildergrouprenameok","buildergroupdeleteok"].includes(el.dataset.act))builderHistorySnapshot(); ACT[el.dataset.act](el.dataset); return; }
  if (ev.target.id === "sheetWrap") closeSheet();
  if (ev.target.id === "lightbox") closeLB();
});
document.addEventListener("keydown", ev => {
  if((ev.ctrlKey||ev.metaKey)&&!ev.altKey&&S.view==="builder"&&document.getElementById("sheetWrap").style.display==="none"){
    const typing=ev.target&&(/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)||ev.target.isContentEditable);
    if(ev.key.toLowerCase()==="z"&&!typing){ev.preventDefault();ev.shiftKey?builderRedo():builderUndo();return;}
    if((ev.key.toLowerCase()==="y"&&!typing)||(ev.key.toLowerCase()==="z"&&ev.shiftKey&&!typing)){ev.preventDefault();builderRedo();return;}
  }

  if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches && ev.target.matches('article[data-act="open"]')) { ev.preventDefault(); ACT.open(ev.target.dataset); }
  if (ev.key === "Enter" && ev.target && ev.target.id === "askNameField") { ev.preventDefault(); ACT.nameok(); return; }
  if (ev.key === "Escape") { if (document.getElementById("sheetWrap").style.display !== "none") closeSheet(); else closeLB(); }
  if (ev.key === "Tab") {
    const sw = document.getElementById("sheetWrap"), lb = document.getElementById("lightbox");
    const box = sw.style.display !== "none" ? document.getElementById("sheetCard") : lb.style.display !== "none" ? lb : null;
    if (!box) return;
    const f = focusables(box); if (!f.length) { ev.preventDefault(); return; }
    const first = f[0], last = f[f.length - 1], a = document.activeElement;
    if (ev.shiftKey && (a === first || !box.contains(a))) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && (a === last || !box.contains(a))) { ev.preventDefault(); first.focus(); }
  }
});
document.addEventListener("focusin",ev=>{const el=ev.target;if(el&&el.dataset&&(el.dataset.builder!==undefined||el.dataset.layerField!==undefined||el.dataset.layerGroup!==undefined))builderHistorySnapshot();},true);
/* el número que acompaña a cada deslizador del creador móvil se actualiza mientras se arrastra */
document.addEventListener("input", ev => {
  const t = ev.target;
  if (t && t.matches && t.matches("input[type=range][data-unit]")) { const o = t.parentElement && t.parentElement.querySelector("output"); if (o) o.textContent = t.value + t.dataset.unit; }
});
if (window.matchMedia) { const mq = matchMedia("(max-width:759px)"); (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(() => { if (S.view === "builder") render(true); }); }
let qTimer = 0;
document.addEventListener("input", ev => {
  const t = ev.target;
  if (!t.dataset) return;
  if(t.dataset && t.dataset.builderPickerSearch!==undefined){
    const q=t.value.trim().toLocaleLowerCase();
    document.querySelectorAll(".builder-picker-card").forEach(card=>{card.hidden=!card.textContent.toLocaleLowerCase().includes(q);});
    document.querySelectorAll(".builder-picker-group").forEach(group=>{const visible=Array.from(group.querySelectorAll(".builder-picker-card")).some(card=>!card.hidden);group.hidden=!visible;if(q&&visible)group.open=true;});
    return;
  }
  if (t.dataset.input === "q") { S.q = t.value; clearTimeout(qTimer); qTimer = setTimeout(renderList, 150); return; }
  if (t.dataset && t.dataset.builder) { builder[t.dataset.builder] = t.type === "range" ? Number(t.value) : t.value; saveBuilder(); if(t.dataset.builder==="title"){const tab=document.querySelector('.screen-tab[data-index="'+builder.activeScreenIndex+'"]');if(tab&&tab.lastChild)tab.lastChild.textContent=t.value;} const old=document.querySelector(".builder-preview"); if(old){const fresh=renderBuilder();const tmp=document.createElement("div");tmp.innerHTML=fresh;const next=tmp.querySelector(".builder-preview");old.replaceWith(next);hydrate(next);} }
  if (t.dataset && t.dataset.layerField !== undefined) { const i=Number(t.dataset.index); if(!builder.layers[i]) return; const k=t.dataset.layerField; builder.layers[i][k]=(t.type==="range")?Number(t.value):t.value; saveBuilder(); const old=document.querySelector(".builder-preview"); if(old){const fresh=renderBuilder();const tmp=document.createElement("div");tmp.innerHTML=fresh;const next=tmp.querySelector(".builder-preview");old.replaceWith(next);hydrate(next);} const label=document.querySelector('.layer-select[data-index="'+i+'"] b'); if(label&&k==="label") label.textContent=t.value||((getEntry(builder.selected[i])||{}).name||"Componente"); }
  const d = t.dataset.input === "lc" || t.dataset.input === "lhex" || t.dataset.input === "lrad" ? ensureDraft() : null;
  if (!d) return;
  if (t.dataset.input === "lc") {
    const c = t.value.toUpperCase(); d.colors[+t.dataset.i] = c;
    const h = document.querySelector('.lhex[data-i="' + t.dataset.i + '"]'); if (h) h.value = c;
  } else if (t.dataset.input === "lhex") {
    let v = t.value.trim(); if (v && v[0] !== "#") v = "#" + v;
    if (!HEX_RE.test(v)) { t.setAttribute("aria-invalid", "true"); return; }
    t.removeAttribute("aria-invalid"); d.colors[+t.dataset.i] = v.toUpperCase();
    const c = document.querySelector('.lcol[data-i="' + t.dataset.i + '"]'); if (c) c.value = hex6(v);
  } else {
    d.radius = String(t.value); const o = document.getElementById("lradv"); if (o) o.textContent = t.value + " px";
  }
  refreshStage();
});
let builderDragIndex = null;
let builderPointerDrag = null;
document.addEventListener("pointerdown", ev => {
  const resize=ev.target.closest&&ev.target.closest("[data-builder-resize]");
  const handle=ev.target.closest&&ev.target.closest("[data-builder-drag]");
  if(!resize&&!handle)return;
  builderHistorySnapshot();
  const i=Number((resize||handle).dataset[resize?"builderResize":"builderDrag"]),layer=builder.layers[i];
  if(!layer||layer.locked)return;
  builder.activeLayer=i;
  const block=document.querySelector('[data-builder-preview-layer="'+i+'"]');
  builderPointerDrag={
    mode:resize?"resize":"move",i,x:ev.clientX,y:ev.clientY,
    ox:Number(layer.offsetX)||0,oy:Number(layer.offsetY)||0,
    width:Number(layer.width)||100,padding:Number(layer.padding)||12,
    fontSize:Number(layer.fontSize)||14,
    parentWidth:block&&block.parentElement?block.parentElement.clientWidth:390,
    pointerId:ev.pointerId
  };
  try{(resize||handle).setPointerCapture(ev.pointerId);}catch(_){}
  ev.preventDefault();
});
document.addEventListener("pointermove", ev => {
  if(!builderPointerDrag||ev.pointerId!==builderPointerDrag.pointerId)return;
  const d=builderPointerDrag,l=builder.layers[d.i];if(!l)return;
  const dx=ev.clientX-d.x,dy=ev.clientY-d.y;
  const block=document.querySelector('[data-builder-preview-layer="'+d.i+'"]');
  if(d.mode==="resize"){
    l.width=Math.max(50,Math.min(100,d.width+(dx/Math.max(160,d.parentWidth))*100));
    l.padding=Math.max(4,Math.min(32,d.padding+dy*.22));
    l.fontSize=Math.max(10,Math.min(30,d.fontSize+dy*.08));
    if(block){block.style.width=l.width+"%";block.style.padding=l.padding+"px";block.style.fontSize=l.fontSize+"px";}
  }else{
    l.offsetX=Math.max(-120,Math.min(120,d.ox+dx));
    l.offsetY=Math.max(-160,Math.min(160,d.oy+dy));
    if(block)block.style.translate=l.offsetX+'px '+l.offsetY+'px';
  }
});
function finishBuilderPointerDrag(ev){
  if(!builderPointerDrag)return;
  if(ev&&ev.pointerId!==builderPointerDrag.pointerId)return;
  builderPointerDrag=null;saveBuilder();render(true);
}
document.addEventListener("pointerup",finishBuilderPointerDrag);
document.addEventListener("pointercancel",finishBuilderPointerDrag);
/* Mueve una capa a la posición de otra y adopta su carpeta (así se puede arrastrar a una carpeta). */
function moveLayerTo(from,target){
  if(from===target||from<0||target<0||from>=builder.selected.length||target>=builder.selected.length)return false;
  if((builder.layers[from]&&builder.layers[from].locked)||(builder.layers[target]&&builder.layers[target].locked)){toast("Desbloquea la capa para cambiar su orden");return false;}
  const grp=String((builder.layers[target]||{}).group||"");
  const moved=builder.selected.splice(from,1)[0];builder.selected.splice(target,0,moved);
  const ml=builder.layers.splice(from,1)[0];builder.layers.splice(target,0,ml);ml.group=grp;
  builder.activeLayer=target;saveBuilder();render(true);return true;
}
/* Reordenar arrastrando el asa con el dedo o el ratón: el arrastre HTML5 de las filas no funciona con el tacto. */
let layerDrag=null;
function layerDragCleanup(){
  const d=layerDrag;if(!d)return;layerDrag=null;
  clearInterval(d.scroll);d.row.classList.remove("moving");d.row.style.transform="";d.row.draggable=true;
  document.querySelectorAll(".builder-drop-active").forEach(x=>x.classList.remove("builder-drop-active"));
}
document.addEventListener("pointerdown",ev=>{
  const g=ev.target.closest&&ev.target.closest("[data-layer-grip]");if(!g||(ev.pointerType==="mouse"&&ev.button!==0))return;
  const row=g.closest("[data-layer-index]");if(!row)return;
  const from=Number(row.dataset.layerIndex);
  if(builder.layers[from]&&builder.layers[from].locked){toast("Desbloquea la capa para cambiar su orden");return;}
  ev.preventDefault();row.draggable=false;
  try{g.setPointerCapture(ev.pointerId);}catch(_){}
  layerDrag={from,target:from,row,id:ev.pointerId,y:ev.clientY,moved:false,vy:0,scroll:0};
  row.classList.add("moving");
});
document.addEventListener("pointermove",ev=>{
  const d=layerDrag;if(!d||ev.pointerId!==d.id)return;
  const dy=ev.clientY-d.y;if(Math.abs(dy)>4)d.moved=true;if(!d.moved)return;
  d.row.style.transform="translateY("+dy+"px)";
  const hit=document.elementsFromPoint(ev.clientX,ev.clientY).map(e=>e.closest&&e.closest("[data-layer-index]")).find(r=>r&&r!==d.row);
  document.querySelectorAll(".builder-drop-active").forEach(x=>x.classList.remove("builder-drop-active"));
  if(hit){hit.classList.add("builder-drop-active");d.target=Number(hit.dataset.layerIndex);}else d.target=d.from;
  /* desplazamiento automático al acercarse al borde de la pantalla */
  d.vy=ev.clientY<70?-12:(ev.clientY>innerHeight-140?12:0);
  if(d.vy&&!d.scroll)d.scroll=setInterval(()=>{const v=document.getElementById("view");if(layerDrag&&layerDrag.vy&&v)v.scrollTop+=layerDrag.vy;},16);
  if(!d.vy&&d.scroll){clearInterval(d.scroll);d.scroll=0;}
});
function layerDragEnd(ev,cancel){
  const d=layerDrag;if(!d||ev.pointerId!==d.id)return;
  const from=d.from,target=d.target,moved=d.moved;layerDragCleanup();
  if(cancel||!moved||target===from)return;
  builderHistorySnapshot();
  if(moveLayerTo(from,target))toast("Capa movida");
}
document.addEventListener("pointerup",ev=>layerDragEnd(ev,false));
document.addEventListener("pointercancel",ev=>layerDragEnd(ev,true));
document.addEventListener("dragstart", ev => {
  const draggingLayer=ev.target.closest&&ev.target.closest("[data-layer-index]");if(draggingLayer)builderHistorySnapshot();
  const card=ev.target.closest&&ev.target.closest("[data-picker-id]");
  if(card){
    if(ev.dataTransfer){ev.dataTransfer.effectAllowed="copy";ev.dataTransfer.setData("application/x-estilos-design",card.dataset.pickerId);ev.dataTransfer.setData("text/plain","design:"+card.dataset.pickerId);}
    card.classList.add("dragging");return;
  }
  const layer=ev.target.closest&&ev.target.closest("[data-layer-index]");
  if(!layer)return;
  if(builder.layers[Number(layer.dataset.layerIndex)]&&builder.layers[Number(layer.dataset.layerIndex)].locked){ev.preventDefault();return;}
  builderDragIndex=Number(layer.dataset.layerIndex);
  if(ev.dataTransfer){ev.dataTransfer.effectAllowed="move";ev.dataTransfer.setData("text/plain","layer:"+builderDragIndex);}
  layer.classList.add("dragging");
});
document.addEventListener("dragend",ev=>{
  const source=ev.target.closest&&(ev.target.closest("[data-layer-index]")||ev.target.closest("[data-picker-id]"));
  if(source)source.classList.remove("dragging");
  document.querySelectorAll(".builder-drop-active").forEach(x=>x.classList.remove("builder-drop-active"));
  builderDragIndex=null;
});
document.addEventListener("dragover",ev=>{
  const target=ev.target.closest&&(ev.target.closest("[data-layer-index]")||ev.target.closest(".builder-device"));
  if(!target)return;
  if(ev.dataTransfer)ev.dataTransfer.dropEffect=ev.dataTransfer.types.includes("application/x-estilos-design")?"copy":"move";
  ev.preventDefault();target.classList.add("builder-drop-active");
});
document.addEventListener("dragleave",ev=>{
  const target=ev.target.closest&&(ev.target.closest("[data-layer-index]")||ev.target.closest(".builder-device"));
  if(target&&!target.contains(ev.relatedTarget))target.classList.remove("builder-drop-active");
});
document.addEventListener("drop",ev=>{
  builderHistorySnapshot();
  const id=ev.dataTransfer&&(ev.dataTransfer.getData("application/x-estilos-design")||"").trim();
  const layer=ev.target.closest&&ev.target.closest("[data-layer-index]");
  const canvas=ev.target.closest&&ev.target.closest(".builder-device");
  document.querySelectorAll(".builder-drop-active").forEach(x=>x.classList.remove("builder-drop-active"));
  if(id){
    if(!getEntry(id))return;
    ev.preventDefault();
    if(builder.selected.length>=12){toast("Máximo doce componentes por pantalla");return;}
    const at=layer?Number(layer.dataset.layerIndex):builder.selected.length;
    builder.selected.splice(at,0,id);
    builder.layers.splice(at,0,{uid:"layer-"+Math.random().toString(36).slice(2,9),label:"",bg:"#FFFFFF",color:"#263247",radius:16,padding:12});
    builder.activeLayer=at;saveBuilder();render(true);toast("Diseño colocado en el lienzo");return;
  }
  if(layer&&builderDragIndex!==null){
    ev.preventDefault();
    const target=Number(layer.dataset.layerIndex),from=builderDragIndex;builderDragIndex=null;
    if(moveLayerTo(from,target))toast("Orden de capas actualizado");
    return;
  }
  if(canvas&&builderDragIndex!==null){ev.preventDefault();builderDragIndex=null;}
});

document.addEventListener("change", ev => {
  const t = ev.target;
  if (t.id === "fileRef") { if (t.files && t.files.length) addRefs(t.files); t.value = ""; return; }
  if (t.id === "fileJson") {
    const f = t.files && t.files[0]; t.value = ""; if (!f) return;
    if (f.size > 60e6) return toast("Archivo demasiado grande");
    f.text().then(doImportText).catch(() => toast("No se pudo leer el archivo"));
    return;
  }
  if(t.dataset && t.dataset.themeSelect!==undefined){if(t.value)ACT.buildertheme({theme:t.value});return;}
  /* Texto y deslizadores ya se aplican en vivo con «input». Volver a dibujar aquí (el
     «change» llega al perder el foco) se comía el toque en la barra inferior. */
  const liveField = t.tagName === "TEXTAREA" || /^(text|search|range|number)$/.test(t.type);
  if(t.dataset && t.dataset.layerField!==undefined){const i=Number(t.dataset.index);if(builder.layers[i]){const k=t.dataset.layerField;builder.layers[i][k]=t.type==="checkbox"?t.checked:(t.type==="range"?Number(t.value):t.value);saveBuilder();if(!liveField)render(true);}return;}
  if (t.dataset && t.dataset.builderSelect) {
    if (t.value) { if (builder.selected.length < 12) { builder.selected.push(t.value); builder.layers.push({uid:"layer-"+Math.random().toString(36).slice(2,9),label:"",bg:"#FFFFFF",color:"#263247",radius:16,padding:12}); builder.activeLayer=builder.selected.length-1; } else toast("Máximo doce componentes"); saveBuilder(); render(true); }
    return;
  }
  if (t.dataset && t.dataset.builder) { builder[t.dataset.builder] = t.type === "range" ? Number(t.value) : t.value; saveBuilder(); if (!liveField) render(true); return; }
  if (t.dataset && t.dataset.input === "tabsel") {
    document.getElementById("f-newtab").style.display = t.value === "__new" ? "block" : "none";
    document.getElementById("f-v").innerHTML = variantOptions(t.value, "");
  }
});

/* Abrir un proyecto compartido por enlace (#p1=…): se pide confirmación y se puede deshacer. */
async function handleSharedHash() {
  const h = location.hash; if (!/^#p[01]=/.test(h)) return;
  let r = null; try { r = await builderFromShareHash(h); } catch (e) { r = null; }
  try { history.replaceState(S, "", location.pathname + location.search); } catch (e) { /* ignorar */ }
  if (!r) { toast("El enlace del proyecto no es válido"); return; }
  const n = r.project.screens.length;
  askConfirm("Abrir proyecto compartido", n + (n > 1 ? " pantallas" : " pantalla") + " · " + r.blocks + (r.blocks === 1 ? " componente" : " componentes") + ". Sustituye tu proyecto actual del constructor (podrás deshacerlo allí). Las imágenes no viajan en el enlace." + (r.dropped ? " " + r.dropped + (r.dropped === 1 ? " componente no existe" : " componentes no existen") + " en este dispositivo y se omite." : ""), "Abrir proyecto",
    () => { closeSheet(); builderHistorySnapshot(); builder = r.project; loadActiveScreen(); saveBuilder(); go({ view: "builder" }); toast("Proyecto abierto"); });
}

/* ───────── Arranque ───────── */
try { history.replaceState(S, ""); } catch (e) { /* ignorar */ }
render();
loadUserRefs();
AutoBackup.load().then(() => { if (AutoBackup.active && AutoBackup.state.perm !== "granted") setTimeout(() => toast("Copia automática en pausa: reactívala en Ajustes"), 900); });
handleSharedHash();
addEventListener("hashchange", handleSharedHash);
mediaLoadAll().then(() => {
  const raw = (() => { try { return localStorage.getItem("estilos-builder-v1") || ""; } catch (e) { return ""; } })();
  /* Migración: los proyectos antiguos llevaban las imágenes dentro de localStorage. */
  if (raw.indexOf('"data:image/') >= 0) saveBuilder();
  builderHistoryLoad();
  if (inflateBuilderMedia() && (S.view === "builder" || S.view === "home")) render(true);
  let hist = ""; try { hist = sessionStorage.getItem(HIST_KEY) || ""; } catch (e) { /* ignorar */ }
  mediaCollect(new Set([...mediaRefsIn(raw), ...mediaRefsIn(hist), ...mediaRefsIn(mediaStrip(JSON.stringify(builder)))]));
});
if (migrated) setTimeout(() => toast("Actualizado a v" + APP_VERSION + ". Tu copia anterior está en Ajustes."), 600);
