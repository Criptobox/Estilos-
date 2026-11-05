/* Estilos · lógica de la app.
   - Catálogo inmutable (SEED) + capa del usuario (añadidos, ediciones, borrados).
   - Sin onclick en línea: todos los eventos usan data-act (delegación), así ningún dato
     importado puede inyectar código.
   - Navegación con la API de historial (el botón Atrás del sistema funciona). */

/* ───────── Almacenamiento ───────── */
const KEY_USER = "estilos-user-v2", KEY_OLD = "estilos-db-v1", KEY_BAK = "estilos-db-v1-backup", KEY_FAV = "estilos-favs-v1", KEY_THEME = "estilos-theme";
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

/* ───────── Tema de la app (auto / claro / oscuro) ───────── */
const THEMES = ["auto", "light", "dark"];
const THEME_LABEL = { auto: "Automático", light: "Claro", dark: "Oscuro" };
const THEME_ICON = { auto: "auto", light: "sun", dark: "moon" };
const darkMQ = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
let theme = (function () { try { const t = localStorage.getItem(KEY_THEME); return THEMES.includes(t) ? t : "auto"; } catch (e) { return "auto"; } })();
function isDark() { return theme === "dark" || (theme === "auto" && !!(darkMQ && darkMQ.matches)); }
function applyTheme() {
  const d = isDark();
  document.documentElement.setAttribute("data-theme", d ? "dark" : "light");
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = d ? "#0a141b" : "#c9e0ef";
}
function setTheme(t) {
  theme = THEMES.includes(t) ? t : "auto";
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

/* ───────── Estado y navegación ───────── */
let S = { view: "home", tab: "Tarjetas", id: null, q: "", detailTab: "info", stage: "auto" };
let builder = readJSON("estilos-builder-v1", { title: "Mi nueva interfaz", subtitle: "Una experiencia diseñada a tu manera", palette: "#635BFF", bg: "#F5F6FA", font: "Inter", radius: 20, selected: [] });
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
    builderHistory=[];builderFuture=[];builderHistoryLast=snap;
    toast("Este proyecto es demasiado grande para guardar más pasos en el historial");
    return;
  }
  builderHistory.push(snap);
  builderHistoryLast=snap;
  builderHistoryTrim();
}
function builderHistoryRestore(from,to){
  if(!from.length){toast("No hay más cambios para recuperar");return;}
  syncActiveScreen();
  const current=JSON.stringify(builder);
  if(current.length>BUILDER_HISTORY_MAX_SINGLE){toast("El proyecto actual es demasiado grande para restaurar el historial");return;}
  const target=from.pop();to.push(current);builderHistoryTrim();
  builderHistoryBusy=true;
  try{
    builder=JSON.parse(target);
    loadActiveScreen();
    saveBuilder();
    render(true);
    // Force the next edit after undo/redo to establish a fresh branch checkpoint.
    builderHistoryLast=JSON.stringify(builder);
    builderHistoryNeedsCheckpoint=true;
  }finally{builderHistoryBusy=false;}
  toast(from===builderHistory?"Cambio deshecho":"Cambio recuperado");
}
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
    borderStyle:["solid","dashed","dotted"].includes(l.borderStyle)?l.borderStyle:"solid",hidden:!!l.hidden,locked:!!l.locked,group:String(l.group||"").slice(0,40),textEdits:l.textEdits&&typeof l.textEdits==="object"?Object.fromEntries(Object.entries(l.textEdits).slice(0,40).map(([k,v])=>[String(k).slice(0,300),String(v).slice(0,500)])): {},mediaEdits:l.mediaEdits&&typeof l.mediaEdits==="object"?Object.fromEntries(Object.entries(l.mediaEdits).slice(0,30).map(([k,v])=>[String(k).slice(0,300),String(v).slice(0,2500000)])):{} };
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
builder.screens=Array.isArray(builder.screens)&&builder.screens.length?builder.screens.slice(0,8).map(cleanScreen):[cleanScreen({id:"screen-home",title:builder.title,subtitle:builder.subtitle,selected:builder.selected,layers:builder.layers,activeLayer:builder.activeLayer},0)];
if(!builder.screens.length) builder.screens=[cleanScreen({},0)];
builder.activeScreenIndex=Math.max(0,Math.min(builder.screens.length-1,Number(builder.activeScreenIndex)||0));
function loadActiveScreen(){const sc=builder.screens[builder.activeScreenIndex];builder.title=sc.title;builder.subtitle=sc.subtitle;builder.selected=sc.selected.slice();builder.layers=sc.layers.map(x=>Object.assign({},x));builder.activeLayer=Math.max(0,Math.min(builder.selected.length-1,sc.activeLayer||0));}
function syncActiveScreen(){const sc=builder.screens[builder.activeScreenIndex];if(!sc)return;sc.title=builder.title;sc.subtitle=builder.subtitle;sc.selected=builder.selected.slice();sc.layers=builder.layers.map(x=>Object.assign({},x));sc.activeLayer=builder.activeLayer;}
loadActiveScreen();
let builderThemes=readJSON("estilos-themes-v1",[]);if(!Array.isArray(builderThemes))builderThemes=[];
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
/* Edición de texto inline: rutas estables dentro del DOM del componente. */
let builderTextEditMode=false;
let builderMediaEditMode=false;
let builderPendingMedia=null;
/* En el DOM los elementos SVG devuelven tagName en minúsculas ("svg"). */
function isSvgEl(n){return !!(n&&n.tagName&&String(n.tagName).toLowerCase()==="svg");}
/* Analiza HTML en un documento inerte: los atributos on*, scripts e imágenes no se
   ejecutan ni se cargan (un div creado con document.createElement sí los dispararía). */
function inertHost(html){return new DOMParser().parseFromString("<!doctype html><body>"+html,"text/html").body;}
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
    try{const node=shadow.querySelector(path);if(node)node.textContent=value;}catch(_){}
  });
}
function builderEditedCode(entry,layer){
  const edits=layer&&layer.textEdits||{};if(!Object.keys(edits).length)return designCode(entry);
  const host=inertHost(designCode(entry));
  Object.entries(edits).forEach(([path,value])=>{try{const node=host.querySelector(path);if(node)node.textContent=value;}catch(_){}});
  return host.innerHTML;
}
function applyBuilderMediaEdits(pvEl,shadow){
  const block=pvEl.closest(".builder-block");if(!block)return;
  const layer=builder.layers[Number(block.dataset.builderPreviewLayer)]||{};
  Object.entries(layer.mediaEdits||{}).forEach(([path,src])=>{
    try{
      const node=shadow.querySelector(path);if(!node)return;
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
      const node=host.querySelector(path);if(!node)return;
      if(isSvgEl(node)){const img=document.createElement("img");img.src=src;img.alt="Imagen personalizada";img.style.cssText="width:100%;height:100%;object-fit:cover;display:block";node.replaceWith(img);}
      else if(node.tagName==="IMG"){node.setAttribute("src",src);node.removeAttribute("srcset");}
      else node.style.backgroundImage='url("'+src+'")';
    }catch(_){}
  });
  return host.innerHTML;
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
        const shadow=el.attachShadow({ mode: "open" }); shadow.innerHTML = designShadow(e); applyBuilderTextEdits(el,shadow); applyBuilderMediaEdits(el,shadow);
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
    + '<div class="top"><div class="brand"><span class="logo">' + ic("layers", 22) + '</span><div><b>Estilos</b><div class="sub">Biblioteca de diseño UI</div></div></div><div class="tbtns"><button class="ib" data-act="themecycle" aria-label="Tema: ' + THEME_LABEL[theme] + ' (cambiar)" title="Tema: ' + THEME_LABEL[theme] + '">' + ic(THEME_ICON[theme], 20) + '</button><button class="ib" data-act="menu" aria-label="Menú">' + ic("sliders", 20) + '</button></div></div>'
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
  return '<div class="builder-device" style="--b-accent:' + accent + ';--b-bg:' + bg + ';--b-radius:' + r + 'px;font-family:' + (builder.font === 'Georgia' ? 'Georgia,serif' : builder.font === 'Plus Jakarta Sans' ? 'Plus Jakarta Sans,system-ui' : 'Inter,system-ui') + '">' +
    '<div class="builder-screen"><div class="builder-status"><span>9:41</span><span>●●● ▰</span></div><div class="builder-top"><span class="builder-mark">✦</span><span>•••</span></div><small class="builder-eyebrow">TU ESPACIO DIGITAL</small><h3>' + esc(builder.title || 'Mi nueva interfaz') + '</h3><p>' + esc(builder.subtitle || 'Una experiencia diseñada a tu manera') + '</p><button class="builder-primary">Descubrir más <b>↗</b></button>' +
    picked.map((e,i)=>{const l=builder.layers[i]||{};const label=l.label||e.name;const shadow=builderElevation(l);return '<section class="builder-block ' + (i===builder.activeLayer?'is-active ':'') + (l.hidden?'is-hidden ':'') + (l.locked?'is-locked':'') + '" data-act="builderselect" data-index="' + i + '" data-builder-preview-layer="' + i + '" style="display:' + (l.hidden?'none':'block') + ';background:' + safeColor(l.bg||'#FFFFFF') + ';color:' + safeColor(l.color||'#263247') + ';border-radius:' + Math.max(6,Math.min(32,Number(l.radius)||16)) + 'px;padding:' + Math.max(4,Math.min(32,Number(l.padding)||12)) + 'px;font-size:' + (l.fontSize||14) + 'px;font-weight:' + (l.weight||600) + ';text-align:' + (l.align||'left') + ';border:' + (l.borderWidth||0) + 'px ' + (l.borderStyle||'solid') + ' ' + safeColor(l.borderColor||'#E8EAF0') + ';box-shadow:' + shadow + ';width:' + (l.width||100) + '%;translate:' + (Number(l.offsetX)||0) + 'px ' + (Number(l.offsetY)||0) + 'px;' + builderMotionStyle(l) + '"><div class="builder-block-head"><span class="builder-drag-handle" data-builder-drag="' + i + '" title="Arrastrar">⠿</span><b>' + esc(label) + '</b><small>' + esc(e.tab) + '</small></div><div class="builder-live-component">' + builderVariantHTML(l,pv(e)) + '</div><span class="builder-resize-handle" data-builder-resize="' + i + '" role="slider" aria-label="Cambiar tamaño del componente" title="Arrastra para cambiar tamaño">↘</span></section>';}).join('') +
    '<div class="builder-bottom"><span>⌂<small>Inicio</small></span><span>⌕<small>Buscar</small></span><span>♡<small>Guardados</small></span><span>◉<small>Perfil</small></span></div></div></div>';
}

function renderBuilder() {
  const fields = allTabs().filter(tab=>tab!=="Referencias"&&db().some(e=>e.tab===tab)).map(tab=>[tab,TAB_FAMILY[tab]||"misc"]);
  const screenOptions=builder.screens.map((sc,i)=>'<button class="screen-tab '+(i===builder.activeScreenIndex?'active':'')+'" data-act="builderscreen" data-index="'+i+'"><span>'+(i+1)+'</span>'+esc(sc.title||('Pantalla '+(i+1)))+'</button>').join('');
  const picked=pickedBuilder(),i=builder.activeLayer,e=picked[i],l=builder.layers[i]||{};
  const layerGroups=[...new Set(builder.layers.map(x=>String(x.group||"").trim()).filter(Boolean))];
  const layerRowHtml=(entry,index)=>{
    const layer=builder.layers[index]||{},name=layer.label||entry.name;
    return '<div class="builder-layer-row'+(index===builder.activeLayer?' active':'')+(layer.hidden?' is-hidden':'')+(layer.locked?' is-locked':'')+'" draggable="true" data-layer-index="'+index+'"><button type="button" class="builder-layer-thumb" data-act="builderselect" data-index="'+index+'" aria-label="Seleccionar '+esc(name)+'">'+pv(entry)+'</button><button type="button" class="builder-layer-name" data-act="builderselect" data-index="'+index+'"><b>'+esc(name)+'</b><small>'+esc(entry.tab)+' · Capa '+(index+1)+'</small></button><div class="builder-layer-tools"><button type="button" data-act="builderlayerhide" data-index="'+index+'" aria-label="'+(layer.hidden?'Mostrar':'Ocultar')+'">'+(layer.hidden?'◉':'◌')+'</button><button type="button" data-act="builderlayerlock" data-index="'+index+'" aria-label="'+(layer.locked?'Desbloquear':'Bloquear')+'">'+(layer.locked?'🔒':'🔓')+'</button><button type="button" data-act="buildermove" data-index="'+index+'" data-dir="-1" '+(index===0?'disabled':'')+'>↑</button><button type="button" data-act="buildermove" data-index="'+index+'" data-dir="1" '+(index===picked.length-1?'disabled':'')+'>↓</button><button type="button" data-act="builderduplicate" data-index="'+index+'">＋</button><button type="button" data-act="builderremove" data-index="'+index+'">×</button></div><div class="builder-layer-group-select"><label>Carpeta</label><select data-layer-group="'+index+'" aria-label="Mover a carpeta"><option value="">Sin carpeta</option>'+layerGroups.map(g=>'<option value="'+esc(g)+'"'+(layer.group===g?' selected':'')+'>'+esc(g)+'</option>').join('')+'</select></div></div>';
  };
  const historyControlsHtml='<div class="builder-history-controls"><button type="button" data-act="builderundo">↶ Deshacer</button><button type="button" data-act="builderredo">↷ Rehacer</button><small>Hasta 60 cambios</small></div>';
  const layerPanelHtml='<div class="builder-layers-panel" id="builder-layers-panel"><div class="builder-layers-heading"><div><b>Capas y carpetas</b><small>'+picked.length+' / 12 elementos · '+layerGroups.length+' carpetas</small></div><button type="button" data-act="buildergroupadd" class="builder-folder-add">＋ Nueva carpeta</button></div>'+historyControlsHtml+'<div class="builder-layer-list">'+(picked.length?(()=>{
    const ungrouped=picked.map((entry,index)=>({entry,index})).filter(x=>!String((builder.layers[x.index]||{}).group||"").trim());
    let html=ungrouped.map(x=>layerRowHtml(x.entry,x.index)).join('');
    layerGroups.forEach(group=>{
      const members=picked.map((entry,index)=>({entry,index})).filter(x=>(builder.layers[x.index]||{}).group===group);
      const collapsed=builderCollapsedGroups.has(group);
      html+='<section class="builder-folder'+(collapsed?' collapsed':'')+'"><header><button type="button" class="builder-folder-toggle" data-act="buildergroupcollapse" data-group="'+esc(group)+'">'+(collapsed?'▸':'▾')+' <b>▣ '+esc(group)+'</b><small>'+members.length+'</small></button><span><button type="button" data-act="buildergrouprename" data-group="'+esc(group)+'" aria-label="Renombrar carpeta">✎</button><button type="button" data-act="buildergroupdelete" data-group="'+esc(group)+'" aria-label="Eliminar carpeta">×</button></span></header><div class="builder-folder-content" '+(collapsed?'hidden':'')+'>'+members.map(x=>layerRowHtml(x.entry,x.index)).join('')+'</div></section>';
    });
    return html||'<div class="builder-layers-empty">No hay capas todavía.</div>';
  })():'<div class="builder-layers-empty">Añade componentes desde la biblioteca y organízalos en carpetas.</div>')+'</div></div>';

  const layerEditor=e?'<div class="layer-editor"><h4>Propiedades del componente</h4><label class="l">Nombre visible</label><input class="fld" maxlength="70" data-layer-field="label" data-index="'+i+'" value="'+esc(l.label||e.name)+'"><div class="two"><div><label class="l">Fondo</label><input class="fld color-field" type="color" data-layer-field="bg" data-index="'+i+'" value="'+esc(l.bg||'#FFFFFF')+'"></div><div><label class="l">Texto</label><input class="fld color-field" type="color" data-layer-field="color" data-index="'+i+'" value="'+esc(l.color||'#263247')+'"></div></div><div class="two"><div><label class="l">Tamaño de fuente</label><input class="fld" type="range" min="10" max="30" data-layer-field="fontSize" data-index="'+i+'" value="'+(l.fontSize||14)+'"></div><div><label class="l">Peso</label><select class="fld" data-layer-field="weight" data-index="'+i+'">'+['400','500','600','700','800'].map(v=>'<option value="'+v+'"'+(String(l.weight||'600')===v?' selected':'')+'>'+v+'</option>').join('')+'</select></div></div><div class="two"><div><label class="l">Alineación</label><select class="fld" data-layer-field="align" data-index="'+i+'">'+['left','center','right'].map(v=>'<option value="'+v+'"'+((l.align||'left')===v?' selected':'')+'>'+({left:'Izquierda',center:'Centro',right:'Derecha'}[v])+'</option>').join('')+'</select></div><div><label class="l">Redondeo</label><input class="fld" type="range" min="6" max="32" data-layer-field="radius" data-index="'+i+'" value="'+(l.radius||16)+'"></div></div><div class="two"><div><label class="l">Espaciado</label><input class="fld" type="range" min="4" max="32" data-layer-field="padding" data-index="'+i+'" value="'+(l.padding||12)+'"></div><div><label class="l">Ancho (%)</label><input class="fld" type="range" min="50" max="100" data-layer-field="width" data-index="'+i+'" value="'+(l.width||100)+'"></div></div><div class="two"><div><label class="l">Borde</label><input class="fld color-field" type="color" data-layer-field="borderColor" data-index="'+i+'" value="'+esc(l.borderColor||'#E8EAF0')+'"></div><div><label class="l">Grosor borde</label><input class="fld" type="range" min="0" max="5" data-layer-field="borderWidth" data-index="'+i+'" value="'+(l.borderWidth||0)+'"></div></div><div class="two"><div><label class="l">Desplazamiento X</label><input class="fld" type="range" min="-40" max="40" data-layer-field="offsetX" data-index="'+i+'" value="'+(l.offsetX||0)+'"></div><div><label class="l">Desplazamiento Y</label><input class="fld" type="range" min="-40" max="40" data-layer-field="offsetY" data-index="'+i+'" value="'+(l.offsetY||0)+'"></div></div><label class="l">Variante visual</label><select class="fld" data-layer-field="variant" data-index="'+i+'">'+[['default','Clásica'],['glass','Glass'],['soft','Soft UI'],['outline','Outline'],['bold','Bold']].map(([v,n])=>'<option value="'+v+'"'+((l.variant||'default')===v?' selected':'')+'>'+n+'</option>').join('')+'</select><label class="l">Animación</label><select class="fld" data-layer-field="animation" data-index="'+i+'">'+[['none','Sin animación'],['fade','Fade in'],['rise','Subir'],['zoom','Zoom'],['float','Flotar'],['pulse','Pulso']].map(([v,n])=>'<option value="'+v+'"'+((l.animation||'none')===v?' selected':'')+'>'+n+'</option>').join('')+'</select><div class="two"><div><label class="l">Duración (ms)</label><input class="fld" type="range" min="300" max="3000" step="100" data-layer-field="duration" data-index="'+i+'" value="'+(l.duration||700)+'"></div><div><label class="l">Elevación</label><input class="fld" type="range" min="0" max="5" data-layer-field="elevation" data-index="'+i+'" value="'+(l.elevation??(l.shadow?2:0))+'"></div></div><label class="l">Estilo de borde</label><select class="fld" data-layer-field="borderStyle" data-index="'+i+'">'+['solid','dashed','dotted'].map(v=>'<option value="'+v+'"'+((l.borderStyle||'solid')===v?' selected':'')+'>'+({solid:'Continuo',dashed:'Discontinuo',dotted:'Punteado'}[v])+'</option>').join('')+'</select><div class="preset-row"><button type="button" data-act="builderpreset" data-preset="glass">Glass</button><button type="button" data-act="builderpreset" data-preset="soft">Soft</button><button type="button" data-act="builderpreset" data-preset="outline">Outline</button><button type="button" data-act="builderpreset" data-preset="bold">Bold</button></div></div>':'';
  return '<div class="wrap builder-wrap"><div class="top"><div><h1 class="big">Constructor</h1><div class="sub">Diseña varias pantallas y personaliza cada componente</div></div><button class="ib" data-act="builderreset" aria-label="Restablecer">↺</button></div>' +
  '<div class="screen-manager"><div class="screen-tabs">'+screenOptions+'</div><div class="screen-actions"><button data-act="builderscreenadd">＋ Nueva</button><button data-act="builderscreenduplicate">Duplicar</button><button data-act="builderscreendelete" '+(builder.screens.length<=1?'disabled':'')+'>Eliminar</button></div></div>' +
  '<nav class="builder-mobile-nav" aria-label="Navegación del constructor"><button type="button" data-act="buildermobilejump" data-target="builder-preview-panel">▣<span>Vista</span></button><button type="button" data-act="buildermobilejump" data-target="builder-controls-panel">⚙<span>Editar</span></button><button type="button" data-act="buildermobilejump" data-target="builder-library-panel">✦<span>Biblioteca</span></button><button type="button" data-act="buildermobilejump" data-target="builder-layers-panel">▤<span>Capas</span></button><button type="button" data-act="buildertextmode">Aa<span>Texto</span></button><button type="button" data-act="buildermediamode">▧<span>Imagen</span></button></nav>' +
  '<div class="builder-layout"><div class="builder-controls" id="builder-controls-panel"><section class="panel"><h3>Identidad de pantalla</h3><label class="l">Nombre de esta pantalla</label><input class="fld" data-builder="title" value="' + esc(builder.title) + '" maxlength="60"><label class="l">Descripción</label><input class="fld" data-builder="subtitle" value="' + esc(builder.subtitle) + '" maxlength="100"><div class="two"><div><label class="l">Color principal</label><input class="fld color-field" type="color" data-builder="palette" value="' + esc(builder.palette) + '"></div><div><label class="l">Fondo</label><input class="fld color-field" type="color" data-builder="bg" value="' + esc(builder.bg) + '"></div></div><div class="two"><div><label class="l">Tipografía</label><select class="fld" data-builder="font"><option' + (builder.font==='Inter'?' selected':'') + '>Inter</option><option' + (builder.font==='Plus Jakarta Sans'?' selected':'') + '>Plus Jakarta Sans</option><option' + (builder.font==='Georgia'?' selected':'') + '>Georgia</option></select></div><div><label class="l">Redondeo general</label><input class="fld" type="range" min="8" max="32" step="2" data-builder="radius" value="' + Number(builder.radius) + '"></div></div></section>' +
  '<section class="panel"><h3>Temas reutilizables</h3><div class="two"><select class="fld" data-theme-select><option value="">Seleccionar tema</option><option value="violet">Violeta Studio</option><option value="midnight">Midnight</option><option value="ivory">Ivory</option><option value="mint">Mint</option>' + builderThemes.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name)+'</option>').join('') + '</select><button class="secondary" data-act="builderthemesave">Guardar tema actual</button></div><p class="sub">Guarda combinaciones de color, tipografía y redondeo para reutilizarlas en otros proyectos.</p></section>' +
  '<section class="panel builder-library-panel" id="builder-library-panel"><h3>Biblioteca visual</h3><p class="sub">Elige por apariencia, no por nombre. Abre una categoría para ver las miniaturas reales y toca un diseño para añadirlo a la pantalla.</p><label class="builder-picker-search"><span>⌕</span><input type="search" data-builder-picker-search placeholder="Buscar por nombre o categoría…"></label><div class="builder-picker-groups">' + fields.map(([tab])=>builderVisualPicker(tab)).join('') + '</div>' + layerPanelHtml + layerEditor + '</section><button class="cta" data-act="builderexport">' + ic('arrowDown',17) + ' Exportar todas las pantallas HTML</button></div><div class="builder-preview'+(builderTextEditMode?' text-edit-mode':'')+(builderMediaEditMode?' media-edit-mode':'')+'" id="builder-preview-panel"><div class="preview-heading"><b>Vista previa en vivo</b><button type="button" class="builder-text-toggle" data-act="buildertextmode">'+(builderTextEditMode?'✓ Terminar texto':'Aa Editar texto')+'</button><button type="button" class="builder-text-toggle" data-act="buildermediamode">'+(builderMediaEditMode?'✓ Terminar imagen':'▧ Cambiar imagen')+'</button><span>390 × 844 · Pantalla '+(builder.activeScreenIndex+1)+'</span></div><input type="file" id="builder-media-file" accept="image/png,image/jpeg,image/webp" hidden>' + builderPreview() + '<p class="sub">Selecciona un bloque. Usa ⠿ para moverlo y la esquina ↘ para cambiar su tamaño. Los cambios se guardan automáticamente.</p></div></div></div>';
}
function pickedBuilder(){return builder.selected.map(getEntry).filter(Boolean);}
function saveBuilder(){syncActiveScreen();try{localStorage.setItem('estilos-builder-v1',JSON.stringify(builder));}catch(e){toast('No se pudo guardar el constructor');}}
function exportBuilder(){
 syncActiveScreen();
 const accent=safeColor(builder.palette),bg=safeColor(builder.bg),r=Math.max(8,Math.min(32,Number(builder.radius)||20));
 const pages=builder.screens.map((sc,si)=>{
   const blocks=sc.selected.map((id,i)=>{const e=getEntry(id);if(!e)return '';const l=sc.layers[i]||{};const shadow=builderElevation(l);const label=l.label||e.name;
     return '<section class="component '+(l.variant||"default")+'" style="display:'+(l.hidden?'none':'block')+';background:'+safeColor(l.bg||'#FFFFFF')+';color:'+safeColor(l.color||'#263247')+';border-radius:'+Math.max(6,Math.min(32,Number(l.radius)||16))+'px;padding:'+Math.max(4,Math.min(32,Number(l.padding)||12))+'px;font-size:'+(l.fontSize||14)+'px;font-weight:'+(l.weight||600)+';text-align:'+(l.align||'left')+';border:'+(l.borderWidth||0)+'px '+(l.borderStyle||'solid')+' '+safeColor(l.borderColor||'#E8EAF0')+';box-shadow:'+shadow+';width:'+(l.width||100)+'%;translate:'+(Number(l.offsetX)||0)+'px '+(Number(l.offsetY)||0)+'px;'+builderMotionStyle(l)+'"><div class="component-meta"><span>'+esc(e.tab)+'</span><small>Bloque '+(i+1)+'</small></div><h2>'+esc(label)+'</h2><p>'+esc(e.desc)+'</p><iframe loading="lazy" title="'+esc(label)+'" sandbox="allow-same-origin" srcdoc="'+esc('<!doctype html><meta charset=utf-8><meta name=viewport content=width=device-width,initial-scale=1><style>body{margin:0;padding:8px;font-family:system-ui,sans-serif;overflow:hidden}*{box-sizing:border-box}</style>'+builderEditedMediaCode(e,l))+'"></iframe></section>';
   }).join('');
   return '<main class="app page '+(si===0?'active':'')+'" id="page-'+si+'"><div class="mark">✦</div><small>DISEÑADO CON ESTILOS</small><h1>'+esc(sc.title)+'</h1><p>'+esc(sc.subtitle)+'</p><button class="primary">Descubrir más ↗</button>'+blocks+'</main>';
 }).join('');
 const nav=builder.screens.map((sc,i)=>'<a href="#page-'+i+'">'+esc(sc.title||('Pantalla '+(i+1)))+'</a>').join('');
 const html='<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(builder.title)+'</title><style>*{box-sizing:border-box}body{margin:0;padding:18px;background:'+bg+';font-family:'+(builder.font==='Georgia'?'Georgia,serif':'Inter,system-ui,sans-serif')+';color:#182033}.nav{max-width:460px;margin:0 auto 12px;display:flex;gap:6px;overflow:auto}.nav a{white-space:nowrap;border:1px solid #e4e7ef;background:white;color:#596276;border-radius:999px;padding:9px 13px;text-decoration:none}.app{display:none;max-width:460px;margin:0 auto;background:white;border-radius:'+r+'px;padding:24px;box-shadow:0 20px 60px #1d2b4a18}.app:first-of-type{display:block}.app:target{display:block}body:has(.app:target) .app:first-of-type:not(:target){display:none}.mark{width:42px;height:42px;display:grid;place-items:center;border-radius:14px;background:'+accent+';color:white;font-size:22px}small{color:#7c8497;letter-spacing:1px}h1{font-size:32px;line-height:1.05;margin:20px 0 8px}p{color:#737b8d;line-height:1.5}.primary{margin:18px 0;padding:14px 18px;border:0;border-radius:'+r+'px;background:'+accent+';color:white;font-weight:700}.component{margin-top:18px;border:1px solid #e8eaf0;overflow:hidden}.component h2{font-size:16px;margin:8px 0}.component p{font-size:13px}.component-meta{display:flex;justify-content:space-between;font-size:10px;color:#8991a2;text-transform:uppercase;letter-spacing:.08em}.component iframe{display:block;width:100%;height:230px;border:0;border-radius:12px;background:#f7f8fb;margin-top:12px}.component.glass{background:#ffffff88!important;backdrop-filter:blur(12px);border-color:#ffffffaa!important}.component.soft{background:linear-gradient(145deg,#fff,#f0f1f8)!important;box-shadow:8px 8px 18px #202a4014!important}.component.outline{background:transparent!important;border-width:1px!important;border-color:currentColor!important;box-shadow:none!important}.component.bold{background:linear-gradient(135deg,#635bff18,#26b9d418)!important;border-width:2px!important}@keyframes estilosFade{from{opacity:0}to{opacity:1}}@keyframes estilosRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes estilosZoom{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}@keyframes estilosFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}@keyframes estilosPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}@media (prefers-reduced-motion:reduce){.component{animation:none!important}}</style><nav class="nav">'+nav+'</nav>'+pages+'</html>';
 const blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='proyecto-estilos-multipantalla.html';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('Proyecto multipantalla exportado');
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
function closeSheet() { document.getElementById("sheetWrap").style.display = "none"; pendingConfirm = null; pendingName = null; }
/* Pide un nombre con una hoja propia (prompt() no existe en todos los contenedores). */
let pendingName = null;
function askName(title, text, value, okLabel, onOk) {
  pendingName = onOk;
  openSheet('<div class="handle"></div><h2>' + esc(title) + '</h2>' + (text ? '<span class="sub">' + esc(text) + '</span>' : '')
    + '<input class="fld" id="askNameField" maxlength="40" value="' + esc(value || "") + '"><div class="two"><button class="cta ghost" data-act="closesheet">Cancelar</button><button class="cta" data-act="nameok">' + esc(okLabel) + '</button></div>');
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
    + '<label class="l">Tema</label>' + themeSegHTML()
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
  buildermobilejump: d => { const target=document.getElementById(d.target); if(target) target.scrollIntoView({behavior:"smooth",block:"start"}); },
  buildertextmode: () => { builderTextEditMode=!builderTextEditMode; render(true); toast(builderTextEditMode?"Toca un texto dentro del diseño para editarlo":"Edición de texto finalizada"); },
  buildermediamode: () => { builderMediaEditMode=!builderMediaEditMode; builderTextEditMode=false; render(true); toast(builderMediaEditMode?"Toca una imagen o icono para reemplazarlo":"Edición de imágenes finalizada"); },
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
  builderadd: d => { const id=String(d.id||d.pickerId||""); /* las tarjetas del selector llevan data-picker-id */if(!getEntry(id))return;if(builder.selected.length>=12){toast("Máximo doce componentes por pantalla");return;}builder.selected.push(id);builder.layers.push({uid:"layer-"+Math.random().toString(36).slice(2,9),label:"",bg:"#FFFFFF",color:"#263247",radius:16,padding:12});builder.activeLayer=builder.selected.length-1;saveBuilder();render(true);toast("Diseño añadido a la pantalla"); },
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
  closesheet: () => closeSheet(),
  lb: d => openLB(+d.i),
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
  builderPendingMedia={index,path:builderNodePath(node,pvEl.shadowRoot)};
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
      const scale=Math.min(1,1000/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,canvas.width,canvas.height);
      let data=canvas.toDataURL("image/webp",.78);
      if(data.length>850000)data=canvas.toDataURL("image/jpeg",.68);
      if(data.length>1000000){toast("La imagen sigue siendo demasiado pesada");return;}
      const layer=builder.layers[pending.index];if(!layer)return;
      layer.mediaEdits=layer.mediaEdits||{};layer.mediaEdits[pending.path]=data;
      builder.activeLayer=pending.index;saveBuilder();render(true);toast("Imagen reemplazada");
    }catch(_){toast("No se pudo procesar la imagen");}
    finally{URL.revokeObjectURL(url);builderPendingMedia=null;}
  };
  img.onerror=()=>{URL.revokeObjectURL(url);builderPendingMedia=null;toast("No se pudo abrir esa imagen");};
  img.src=url;
},true);
document.addEventListener("click",ev=>{
  if(!builderTextEditMode)return;
  builderHistorySnapshot();
  const path=ev.composedPath?ev.composedPath():[];
  const block=path.find(n=>n&&n.classList&&n.classList.contains("builder-block"));
  if(!block)return;
  const blockIndex=Number(block.dataset.builderPreviewLayer);if(builder.layers[blockIndex]&&builder.layers[blockIndex].locked){toast("Esta capa está bloqueada");return;}
  const pvEl=block.querySelector(".pv");
  if(!pvEl||!pvEl.shadowRoot){toast("Este diseño usa un código aislado y no permite edición directa");return;}
  if(path.some(n=>n&&n.tagName==="BUTTON"&&n.getRootNode&&n.getRootNode()!==pvEl.shadowRoot))return;
  const node=path.find(n=>n&&n.nodeType===1&&n.getRootNode&&n.getRootNode()===pvEl.shadowRoot&&n.children&&n.children.length===0&&String(n.textContent||"").trim()&&!/^(svg|path|style|script)$/i.test(n.tagName));
  if(!node)return;
  ev.preventDefault();ev.stopPropagation();
  const index=Number(block.dataset.builderPreviewLayer),layer=builder.layers[index];if(!layer)return;
  node.dataset.previousOutline=node.style.outline||"";node.dataset.previousRadius=node.style.borderRadius||"";node.style.outline="2px solid #635bff";node.style.borderRadius="4px";node.setAttribute("contenteditable","true");node.setAttribute("spellcheck","true");
  node.dataset.builderInlineEdit="1";node.dataset.builderInlineIndex=String(index);
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
    layer.textEdits=layer.textEdits||{};layer.textEdits[key]=String(node.textContent||"").slice(0,500);
    node.removeAttribute("contenteditable");node.style.outline=node.dataset.previousOutline||"";node.style.borderRadius=node.dataset.previousRadius||"";delete node.dataset.previousOutline;delete node.dataset.previousRadius;delete node.dataset.builderInlineEdit;delete node.dataset.builderInlineIndex;
    saveBuilder();toast("Texto actualizado");
  }
},true);
document.addEventListener("click", ev => {
  const el = ev.target.closest("[data-act]");
  if (el && ACT[el.dataset.act]) { ev.stopPropagation(); if(/^builder/.test(el.dataset.act)&&!["builderundo","builderredo","buildermobilejump","buildertextmode","buildermediamode","builderscreen","buildergrouprename","buildergroupdelete","buildergrouprenameok","buildergroupdeleteok"].includes(el.dataset.act))builderHistorySnapshot(); ACT[el.dataset.act](el.dataset); return; }
  if (ev.target.id === "sheetWrap") closeSheet();
});
document.addEventListener("keydown", ev => {
  if((ev.ctrlKey||ev.metaKey)&&!ev.altKey&&S.view==="builder"&&document.getElementById("sheetWrap").style.display==="none"){
    const typing=ev.target&&(/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)||ev.target.isContentEditable);
    if(ev.key.toLowerCase()==="z"&&!typing){ev.preventDefault();ev.shiftKey?builderRedo():builderUndo();return;}
    if((ev.key.toLowerCase()==="y"&&!typing)||(ev.key.toLowerCase()==="z"&&ev.shiftKey&&!typing)){ev.preventDefault();builderRedo();return;}
  }

  if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches && ev.target.matches('article[data-act="open"]')) { ev.preventDefault(); ACT.open(ev.target.dataset); }
  if (ev.key === "Enter" && ev.target && ev.target.id === "askNameField") { ev.preventDefault(); ACT.nameok(); return; }
  if (ev.key === "Escape") { closeSheet(); closeLB(); }
});
document.addEventListener("focusin",ev=>{const el=ev.target;if(el&&el.dataset&&(el.dataset.builder!==undefined||el.dataset.layerField!==undefined||el.dataset.layerGroup!==undefined))builderHistorySnapshot();},true);
document.addEventListener("input", ev => {
  const t = ev.target;
  if(t.dataset && t.dataset.builderPickerSearch!==undefined){
    const q=t.value.trim().toLocaleLowerCase();
    document.querySelectorAll(".builder-picker-card").forEach(card=>{card.hidden=!card.textContent.toLocaleLowerCase().includes(q);});
    document.querySelectorAll(".builder-picker-group").forEach(group=>{const visible=Array.from(group.querySelectorAll(".builder-picker-card")).some(card=>!card.hidden);group.hidden=!visible;if(q&&visible)group.open=true;});
    return;
  }
  if (t.dataset && t.dataset.input === "q") { S.q = t.value; renderList(); }
  if (t.dataset && t.dataset.builder) { builder[t.dataset.builder] = t.type === "range" ? Number(t.value) : t.value; saveBuilder(); if(t.dataset.builder==="title"){const tab=document.querySelector('.screen-tab[data-index="'+builder.activeScreenIndex+'"]');if(tab&&tab.lastChild)tab.lastChild.textContent=t.value;} const old=document.querySelector(".builder-preview"); if(old){const fresh=renderBuilder();const tmp=document.createElement("div");tmp.innerHTML=fresh;const next=tmp.querySelector(".builder-preview");old.replaceWith(next);hydrate(next);} }
  if (t.dataset && t.dataset.layerField !== undefined) { const i=Number(t.dataset.index); if(!builder.layers[i]) return; const k=t.dataset.layerField; builder.layers[i][k]=(t.type==="range")?Number(t.value):t.value; saveBuilder(); const old=document.querySelector(".builder-preview"); if(old){const fresh=renderBuilder();const tmp=document.createElement("div");tmp.innerHTML=fresh;const next=tmp.querySelector(".builder-preview");old.replaceWith(next);hydrate(next);} const label=document.querySelector('.layer-select[data-index="'+i+'"] b'); if(label&&k==="label") label.textContent=t.value||((getEntry(builder.selected[i])||{}).name||"Componente"); }
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
    const target=Number(layer.dataset.layerIndex),from=builderDragIndex;
    if((builder.layers[from]&&builder.layers[from].locked)||(builder.layers[target]&&builder.layers[target].locked)){builderDragIndex=null;toast("Desbloquea la capa para cambiar su orden");return;}
    if(from!==target&&from>=0&&target>=0&&from<builder.selected.length&&target<builder.selected.length){
      const moved=builder.selected.splice(from,1)[0];builder.selected.splice(target,0,moved);
      const movedLayer=builder.layers.splice(from,1)[0];builder.layers.splice(target,0,movedLayer);
      builder.activeLayer=target;saveBuilder();render(true);toast("Orden de capas actualizado");
    }
    builderDragIndex=null;return;
  }
  if(canvas&&builderDragIndex!==null){ev.preventDefault();builderDragIndex=null;}
});

document.addEventListener("change", ev => {
  const t = ev.target;
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

/* ───────── Arranque ───────── */
try { history.replaceState(S, ""); } catch (e) { /* ignorar */ }
render();
if (migrated) setTimeout(() => toast("Actualizado a v" + APP_VERSION + ". Tu copia anterior está en Ajustes."), 600);
