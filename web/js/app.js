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

/* Atenuar las vistas previas claras de las listas en modo oscuro (el detalle se ve siempre tal cual). */
let dimPreviews = (function () { try { return localStorage.getItem(KEY_DIM) === "1"; } catch (e) { return false; } })();
function applyDim() { document.documentElement.toggleAttribute("data-dim", dimPreviews); }
applyDim();

/* ───────── Estado y navegación ───────── */
let S = { view: "home", tab: "Tarjetas", id: null, q: "", detailTab: "info", stage: "auto", stack: "html" };
let builder = readJSON("estilos-builder-v1", { title: "Mi nueva interfaz", subtitle: "Una experiencia diseñada a tu manera", palette: "#635BFF", bg: "#F5F6FA", font: "Inter", radius: 20, selected: [] });
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
    borderStyle:["solid","dashed","dotted"].includes(l.borderStyle)?l.borderStyle:"solid"};
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
let draft = null;      /* editor en vivo: { id, colors, radius, mode } sin guardar */
let userRefs = [];     /* capturas propias: { id, label, date, blob, url } */
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
function pv(e, extra) { return '<div class="pv" data-pv="' + esc(e.id) + '"' + (extra || "") + '></div>'; }
function stageCls(e, mode) {
  const m = mode || "auto", dark = m === "auto" ? e.mode === "dark" : m === "dark";
  return "stage" + (dark ? " dark" : "") + (m === "white" ? " white" : "");
}
/* Dibuja las vistas previas (Shadow DOM, o iframe aislado si el estilo trae código propio). */
/* Se dibujan al acercarse a la pantalla (IntersectionObserver): con 100+ estilos la
   búsqueda y las listas no tienen que crear todos los Shadow DOM de golpe. */
const pvIO = "IntersectionObserver" in window ? new IntersectionObserver(ents => ents.forEach(en => {
  if (en.isIntersecting) { pvIO.unobserve(en.target); hydrateEl(en.target); }
}), { root: document.getElementById("view"), rootMargin: "400px 0px" }) : null;
function hydrate(root) {
  (root || document).querySelectorAll(".pv:not([data-h])").forEach(el => {
    if (pvIO && !el.hasAttribute("data-now")) pvIO.observe(el); else hydrateEl(el);
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
        el.attachShadow({ mode: "open" }).innerHTML = designShadow(e);
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
  return '<div class="chips" role="tablist">' + allTabs().map(t => {
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
  const list = db(), day = Math.floor(Date.now() / 864e5), f = list.length ? list[day % list.length] : null;
  const fresh = SEED.slice(75).filter((x, i) => i % 3 === 0).map(x => getEntry(x.id)).filter(Boolean);
  const cats = allTabs().map(t => {
    const n = t === "Referencias" ? refCount() : db().filter(e => e.tab === t).length;
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

/* Sin acentos ni mayúsculas: «tipografia» encuentra «Tipografía». Varias palabras = todas deben aparecer. */
function fold(x) { return String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function listFor() {
  const words = fold(S.q).split(/\s+/).filter(Boolean);
  if (!words.length) return db().filter(e => e.tab === S.tab);
  return db().filter(e => { const h = fold(e.name + " " + e.desc + " " + e.ref + " " + e.tab + " " + e.tip); return words.every(w => h.includes(w)); });
}
function refCount() { return REFS.length + userRefs.length; }
function listHTML() {
  if (S.tab === "Referencias" && !S.q) {
    return '<p class="sub">Toca una captura para ampliarla o sacar su paleta. Las tuyas se guardan solo en este dispositivo.</p><div class="refGrid">'
      + userRefs.map(r => '<button class="refItem" data-act="lbu" data-id="' + esc(r.id) + '"><img src="' + esc(r.url) + '" alt="' + esc(r.label) + '" loading="lazy" decoding="async"><div><span class="tag">Tuya</span> ' + esc(r.label) + '</div></button>').join("")
      + REFS.map((r, i) => '<button class="refItem" data-act="lb" data-i="' + i + '"><img src="' + esc(r.img) + '" alt="' + esc(r.label) + '" loading="lazy" decoding="async"><div>' + esc(r.label) + '</div></button>').join("") + '</div>';
  }
  const l = listFor();
  if (!l.length) return '<div class="empty"><b>No hay estilos aquí</b><span>' + (S.q ? "Prueba con otra palabra." : "Toca + Añadir para crear uno.") + '</span></div>';
  return '<div class="grid">' + l.map(e => cardHTML(e, !!S.q)).join("") + '</div>';
}
function renderExplore() {
  const isRefs = S.tab === "Referencias" && !S.q;
  const n = isRefs ? refCount() : listFor().length;
  return '<div class="wrap">'
    + '<div class="top"><div><h1 class="big">' + esc(S.q ? "Búsqueda" : S.tab) + '</h1><div class="sub" id="count">' + (isRefs ? n + " capturas de referencia" : n + (S.q ? " resultados en todas las categorías" : " estilos")) + '</div></div>' + (isRefs ? '<button class="cta addBtn" data-act="addref">' + ic("upload", 16, 2.4) + ' Añadir captura</button>' : '<button class="cta addBtn" data-act="add">' + ic("plus", 16, 2.6) + ' Añadir</button>') + '</div>'
    + '<label class="search">' + ic("search", 18) + '<input id="q" data-input="q" type="search" placeholder="Buscar estilo…" aria-label="Buscar estilo" value="' + esc(S.q) + '"></label>'
    + chipsHTML() + '<div id="list">' + listHTML() + '</div></div>';
}

function builderOptions(tab, selected) {
  const items = db().filter(e => e.tab === tab);
  return '<option value="">Seleccionar ' + esc(tab.toLowerCase()) + '</option>' + items.map(e => '<option value="' + esc(e.id) + '"' + (selected === e.id ? ' selected' : '') + '>' + esc(e.name) + '</option>').join('');
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
    picked.map((e,i)=>{const l=builder.layers[i]||{};const label=l.label||e.name;const shadow=builderElevation(l);return '<section class="builder-block ' + (i===builder.activeLayer?'is-active':'') + '" data-act="builderselect" data-index="' + i + '" data-builder-preview-layer="' + i + '" style="background:' + safeColor(l.bg||'#FFFFFF') + ';color:' + safeColor(l.color||'#263247') + ';border-radius:' + Math.max(6,Math.min(32,Number(l.radius)||16)) + 'px;padding:' + Math.max(4,Math.min(32,Number(l.padding)||12)) + 'px;font-size:' + (l.fontSize||14) + 'px;font-weight:' + (l.weight||600) + ';text-align:' + (l.align||'left') + ';border:' + (l.borderWidth||0) + 'px ' + (l.borderStyle||'solid') + ' ' + safeColor(l.borderColor||'#E8EAF0') + ';box-shadow:' + shadow + ';width:' + (l.width||100) + '%;translate:' + (Number(l.offsetX)||0) + 'px ' + (Number(l.offsetY)||0) + 'px;' + builderMotionStyle(l) + '"><div class="builder-block-head"><span class="builder-drag-handle" data-builder-drag="' + i + '" title="Arrastrar">⠿</span><b>' + esc(label) + '</b><small>' + esc(e.tab) + '</small></div><div class="builder-live-component">' + builderVariantHTML(l,pv(e)) + '</div></section>';}).join('') +
    '<div class="builder-bottom"><span>⌂<small>Inicio</small></span><span>⌕<small>Buscar</small></span><span>♡<small>Guardados</small></span><span>◉<small>Perfil</small></span></div></div></div>';
}

function renderBuilder() {
  const fields = [ ['Tarjetas','card'], ['Avatares','avatar'], ['Botones','button'], ['Widgets','widget'], ['Animaciones','motion'], ['Iconos','icon'] ];
  const screenOptions=builder.screens.map((sc,i)=>'<button class="screen-tab '+(i===builder.activeScreenIndex?'active':'')+'" data-act="builderscreen" data-index="'+i+'"><span>'+(i+1)+'</span>'+esc(sc.title||('Pantalla '+(i+1)))+'</button>').join('');
  const picked=pickedBuilder(),i=builder.activeLayer,e=picked[i],l=builder.layers[i]||{};
  const layerEditor=e?'<div class="layer-editor"><h4>Propiedades del componente</h4><label class="l">Nombre visible</label><input class="fld" maxlength="70" data-layer-field="label" data-index="'+i+'" value="'+esc(l.label||e.name)+'"><div class="two"><div><label class="l">Fondo</label><input class="fld color-field" type="color" data-layer-field="bg" data-index="'+i+'" value="'+esc(l.bg||'#FFFFFF')+'"></div><div><label class="l">Texto</label><input class="fld color-field" type="color" data-layer-field="color" data-index="'+i+'" value="'+esc(l.color||'#263247')+'"></div></div><div class="two"><div><label class="l">Tamaño de fuente</label><input class="fld" type="range" min="10" max="30" data-layer-field="fontSize" data-index="'+i+'" value="'+(l.fontSize||14)+'"></div><div><label class="l">Peso</label><select class="fld" data-layer-field="weight" data-index="'+i+'">'+['400','500','600','700','800'].map(v=>'<option value="'+v+'"'+(String(l.weight||'600')===v?' selected':'')+'>'+v+'</option>').join('')+'</select></div></div><div class="two"><div><label class="l">Alineación</label><select class="fld" data-layer-field="align" data-index="'+i+'">'+['left','center','right'].map(v=>'<option value="'+v+'"'+((l.align||'left')===v?' selected':'')+'>'+({left:'Izquierda',center:'Centro',right:'Derecha'}[v])+'</option>').join('')+'</select></div><div><label class="l">Redondeo</label><input class="fld" type="range" min="6" max="32" data-layer-field="radius" data-index="'+i+'" value="'+(l.radius||16)+'"></div></div><div class="two"><div><label class="l">Espaciado</label><input class="fld" type="range" min="4" max="32" data-layer-field="padding" data-index="'+i+'" value="'+(l.padding||12)+'"></div><div><label class="l">Ancho (%)</label><input class="fld" type="range" min="50" max="100" data-layer-field="width" data-index="'+i+'" value="'+(l.width||100)+'"></div></div><div class="two"><div><label class="l">Borde</label><input class="fld color-field" type="color" data-layer-field="borderColor" data-index="'+i+'" value="'+esc(l.borderColor||'#E8EAF0')+'"></div><div><label class="l">Grosor borde</label><input class="fld" type="range" min="0" max="5" data-layer-field="borderWidth" data-index="'+i+'" value="'+(l.borderWidth||0)+'"></div></div><div class="two"><div><label class="l">Desplazamiento X</label><input class="fld" type="range" min="-40" max="40" data-layer-field="offsetX" data-index="'+i+'" value="'+(l.offsetX||0)+'"></div><div><label class="l">Desplazamiento Y</label><input class="fld" type="range" min="-40" max="40" data-layer-field="offsetY" data-index="'+i+'" value="'+(l.offsetY||0)+'"></div></div><label class="l">Variante visual</label><select class="fld" data-layer-field="variant" data-index="'+i+'">'+[['default','Clásica'],['glass','Glass'],['soft','Soft UI'],['outline','Outline'],['bold','Bold']].map(([v,n])=>'<option value="'+v+'"'+((l.variant||'default')===v?' selected':'')+'>'+n+'</option>').join('')+'</select><label class="l">Animación</label><select class="fld" data-layer-field="animation" data-index="'+i+'">'+[['none','Sin animación'],['fade','Fade in'],['rise','Subir'],['zoom','Zoom'],['float','Flotar'],['pulse','Pulso']].map(([v,n])=>'<option value="'+v+'"'+((l.animation||'none')===v?' selected':'')+'>'+n+'</option>').join('')+'</select><div class="two"><div><label class="l">Duración (ms)</label><input class="fld" type="range" min="300" max="3000" step="100" data-layer-field="duration" data-index="'+i+'" value="'+(l.duration||700)+'"></div><div><label class="l">Elevación</label><input class="fld" type="range" min="0" max="5" data-layer-field="elevation" data-index="'+i+'" value="'+(l.elevation??(l.shadow?2:0))+'"></div></div><label class="l">Estilo de borde</label><select class="fld" data-layer-field="borderStyle" data-index="'+i+'">'+['solid','dashed','dotted'].map(v=>'<option value="'+v+'"'+((l.borderStyle||'solid')===v?' selected':'')+'>'+({solid:'Continuo',dashed:'Discontinuo',dotted:'Punteado'}[v])+'</option>').join('')+'</select><div class="preset-row"><button type="button" data-act="builderpreset" data-preset="glass">Glass</button><button type="button" data-act="builderpreset" data-preset="soft">Soft</button><button type="button" data-act="builderpreset" data-preset="outline">Outline</button><button type="button" data-act="builderpreset" data-preset="bold">Bold</button></div></div>':'';
  return '<div class="wrap builder-wrap"><div class="top"><div><h1 class="big">Constructor 4.0</h1><div class="sub">Diseña varias pantallas y personaliza cada componente</div></div><button class="ib" data-act="builderreset" aria-label="Restablecer">↺</button></div>' +
  '<div class="screen-manager"><div class="screen-tabs">'+screenOptions+'</div><div class="screen-actions"><button data-act="builderscreenadd">＋ Nueva</button><button data-act="builderscreenduplicate">Duplicar</button><button data-act="builderscreendelete" '+(builder.screens.length<=1?'disabled':'')+'>Eliminar</button></div></div>' +
  '<div class="builder-layout"><div class="builder-controls"><section class="panel"><h3>Identidad de pantalla</h3><label class="l">Nombre de esta pantalla</label><input class="fld" data-builder="title" value="' + esc(builder.title) + '" maxlength="60"><label class="l">Descripción</label><input class="fld" data-builder="subtitle" value="' + esc(builder.subtitle) + '" maxlength="100"><div class="two"><div><label class="l">Color principal</label><input class="fld color-field" type="color" data-builder="palette" value="' + esc(builder.palette) + '"></div><div><label class="l">Fondo</label><input class="fld color-field" type="color" data-builder="bg" value="' + esc(builder.bg) + '"></div></div><div class="two"><div><label class="l">Tipografía</label><select class="fld" data-builder="font"><option' + (builder.font==='Inter'?' selected':'') + '>Inter</option><option' + (builder.font==='Plus Jakarta Sans'?' selected':'') + '>Plus Jakarta Sans</option><option' + (builder.font==='Georgia'?' selected':'') + '>Georgia</option></select></div><div><label class="l">Redondeo general</label><input class="fld" type="range" min="8" max="32" step="2" data-builder="radius" value="' + Number(builder.radius) + '"></div></div></section>' +
  '<section class="panel"><h3>Temas reutilizables</h3><div class="two"><select class="fld" data-theme-select><option value="">Seleccionar tema</option><option value="violet">Violeta Studio</option><option value="midnight">Midnight</option><option value="ivory">Ivory</option><option value="mint">Mint</option>' + builderThemes.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name)+'</option>').join('') + '</select><button class="secondary" data-act="builderthemesave">Guardar tema actual</button></div><p class="sub">Guarda combinaciones de color, tipografía y redondeo para reutilizarlas en otros proyectos.</p></section>' +
  '<section class="panel"><h3>Biblioteca de componentes</h3><p class="sub">Hasta doce capas en cada pantalla. Puedes moverlas desde el asa de la vista previa.</p>' + fields.map(([tab])=>'<label class="l">' + tab + '</label><select class="fld" data-builder-select="' + tab + '">' + builderOptions(tab, '') + '</select>').join('') + '<div class="selected-list">' + (picked.length ? picked.map((e,i)=>'<div class="builder-layer" draggable="true" data-layer-index="' + i + '"><span class="layer-grip" aria-hidden="true">⠿</span><button class="layer-select ' + (i===builder.activeLayer?'active':'') + '" data-act="builderselect" data-index="' + i + '"><b>' + esc((builder.layers[i]&&builder.layers[i].label)||e.name) + '</b><small>' + esc(e.tab) + ' · Capa ' + (i+1) + '</small></button><span class="layer-actions"><button data-act="buildermove" data-index="' + i + '" data-dir="-1" aria-label="Mover arriba" ' + (i===0?'disabled':'') + '>↑</button><button data-act="buildermove" data-index="' + i + '" data-dir="1" aria-label="Mover abajo" ' + (i===picked.length-1?'disabled':'') + '>↓</button><button data-act="builderduplicate" data-index="' + i + '" aria-label="Duplicar componente">＋</button><button data-act="builderremove" data-index="' + i + '" aria-label="Eliminar componente">×</button></span></div>').join('') : '<small class="sub">Todavía no has añadido componentes.</small>') + '</div>' + layerEditor + '</section><button class="cta" data-act="builderexport">' + ic('arrowDown',17) + ' Exportar todas las pantallas HTML</button></div><div class="builder-preview"><div class="preview-heading"><b>Vista previa en vivo</b><span>390 × 844 · Pantalla '+(builder.activeScreenIndex+1)+'</span></div>' + builderPreview() + '<p class="sub">Arrastra el asa ⠿ de un bloque para ajustar su posición. Los cambios se guardan automáticamente.</p></div></div></div>';
}
function pickedBuilder(){return builder.selected.map(getEntry).filter(Boolean);}
function saveBuilder(){syncActiveScreen();try{localStorage.setItem('estilos-builder-v1',JSON.stringify(builder));}catch(e){toast('No se pudo guardar el constructor');}}
function exportBuilder(){
 syncActiveScreen();
 const accent=safeColor(builder.palette),bg=safeColor(builder.bg),r=Math.max(8,Math.min(32,Number(builder.radius)||20));
 const pages=builder.screens.map((sc,si)=>{
   const blocks=sc.selected.map((id,i)=>{const e=getEntry(id);if(!e)return '';const l=sc.layers[i]||{};const shadow=builderElevation(l);const label=l.label||e.name;
     return '<section class="component '+(l.variant||"default")+'" style="background:'+safeColor(l.bg||'#FFFFFF')+';color:'+safeColor(l.color||'#263247')+';border-radius:'+Math.max(6,Math.min(32,Number(l.radius)||16))+'px;padding:'+Math.max(4,Math.min(32,Number(l.padding)||12))+'px;font-size:'+(l.fontSize||14)+'px;font-weight:'+(l.weight||600)+';text-align:'+(l.align||'left')+';border:'+(l.borderWidth||0)+'px '+(l.borderStyle||'solid')+' '+safeColor(l.borderColor||'#E8EAF0')+';box-shadow:'+shadow+';width:'+(l.width||100)+'%;translate:'+(Number(l.offsetX)||0)+'px '+(Number(l.offsetY)||0)+'px;'+builderMotionStyle(l)+'"><div class="component-meta"><span>'+esc(e.tab)+'</span><small>Bloque '+(i+1)+'</small></div><h2>'+esc(label)+'</h2><p>'+esc(e.desc)+'</p><iframe loading="lazy" title="'+esc(label)+'" sandbox="allow-same-origin" srcdoc="'+esc('<!doctype html><meta charset=utf-8><meta name=viewport content=width=device-width,initial-scale=1><style>body{margin:0;padding:8px;font-family:system-ui,sans-serif;overflow:hidden}*{box-sizing:border-box}</style>'+designCode(e))+'"></iframe></section>';
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
  const dt = ["info", "edit", "code"].includes(S.detailTab) ? S.detailTab : "info", stack = S.stack || "html";
  const code = stackCode(e, stack);
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
  const codePanel = '<div class="fmt" role="radiogroup" aria-label="Plataforma">' + STACKS.map(x => '<button role="radio" aria-checked="' + (x.id === stack) + '" class="' + (x.id === stack ? "on" : "") + '" data-act="stack" data-s="' + x.id + '">' + x.label + '</button>').join("") + '</div>'
    + '<div class="codeBox"><div class="codeHead"><span>' + esc(codeLabel(stack, code)) + '</span><button data-act="copycode" data-id="' + esc(e.id) + '">' + ic("copy", 14) + ' Copiar</button></div><pre><code>' + esc(code) + '</code></pre></div>'
    + '<p class="sub">' + (stack === "html" ? "Autocontenido: pégalo en tu proyecto. Los iconos van en SVG inline, sin librerías." : "Colores por rol, paleta y radio de este estilo para usarlos en tus componentes. El componente completo está en HTML/CSS.") + '</p>';
  const tabBtn = (id, label) => '<button class="' + (dt === id ? "on" : "") + '" role="tab" aria-selected="' + (dt === id) + '" data-act="dtab" data-d="' + id + '">' + label + '</button>';
  return '<div class="wrap detail">'
    + '<div class="dTop"><button class="ib" data-act="back" aria-label="Volver">' + ic("back", 22, 2.4) + '</button><div class="tbtns"><button class="ib" data-act="surprise" aria-label="Otro estilo al azar">' + ic("spark", 20) + '</button><button class="ib" data-act="more" data-id="' + esc(e.id) + '" aria-label="Más opciones">' + ic("dots", 20) + '</button></div></div>'
    + '<div class="' + stageCls(e, S.stage) + ' dStage">' + pv(e, ' data-now="1" data-live="1"') + '</div>'
    + '<div class="dStageBar">' + (draft ? '<span class="badge mid">Sin guardar</span>' : '') + '<button class="pillbtn" data-act="stage">' + ic(S.stage === "dark" ? "moon" : "sun", 14) + ' Fondo: ' + STAGE_LABEL[S.stage] + '</button></div>'
    + '<div><div class="dName">' + esc(e.name) + '</div><div class="sub" style="margin-top:4px;font-size:13px">' + esc(e.tab) + (e.ref ? " · " + esc(e.ref) : "") + '</div></div>'
    + '<p class="dDesc">' + esc(e.desc) + '</p>'
    + '<div class="seg" role="tablist">' + tabBtn("info", "Detalles") + tabBtn("edit", "Editor") + tabBtn("code", "Código") + '</div>'
    + (dt === "code" ? codePanel : dt === "edit" ? editorHTML(base, e) : info)
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
  const item = (v, icon, label) => '<button class="ni' + (S.view === v ? " nia" : "") + '" data-act="nav" data-v="' + v + '" aria-label="' + label + '"' + (S.view === v ? ' aria-current="page"' : "") + '>' + icon + (S.view === v ? '<span>' + label + '</span>' : "") + '</button>';
  return item("home", ic("home", 22), "Inicio") + item("explore", ic("grid", 22), "Explorar") + item("builder", ic("plus", 22), "Crear") + item("favs", ic("bookmark", 22), "Guardados") + '<button class="ni" data-act="menu" aria-label="Ajustes">' + ic("sliders", 22) + '</button>';
}

function render(keepScroll) {
  const v = document.getElementById("view"), top = v.scrollTop;
  if (pvIO) pvIO.disconnect();
  v.innerHTML = S.view === "home" ? renderHome() : S.view === "explore" ? renderExplore() : S.view === "favs" ? renderFavs() : S.view === "builder" ? renderBuilder() : renderDetail();
  hydrate(v);
  const nav = document.getElementById("nav"), act = document.getElementById("actbar");
  if (S.view === "detail") {
    const fav = favs.includes(S.id);
    nav.style.display = "none"; act.style.display = "flex";
    act.innerHTML = '<button class="main" data-act="copycode" data-id="' + esc(S.id) + '">' + ic("copy", 16) + ' Copiar código</button>'
      + '<button class="fav' + (fav ? " on" : "") + '" data-act="fav" data-id="' + esc(S.id) + '" aria-label="' + (fav ? "Quitar de guardados" : "Guardar") + '">' + (fav ? icf("bookmark", 20) : ic("bookmark", 20)) + '</button>'
      + '<button data-act="dtab" data-d="edit" aria-label="Abrir editor">' + ic("sliders", 20) + '</button>';
  } else {
    nav.style.display = "flex"; act.style.display = "none"; nav.innerHTML = navHTML();
  }
  v.scrollTop = keepScroll ? top : 0;
}
function renderList() {
  const el = document.getElementById("list"); if (!el) return;
  if (pvIO) pvIO.disconnect();
  el.innerHTML = listHTML(); hydrate(el);
  const c = document.getElementById("count"); if (c) c.textContent = (S.q ? listFor().length + " resultados en todas las categorías" : listFor().length + " estilos");
  const h = document.querySelector("h1.big"); if (h) h.textContent = S.q ? "Búsqueda" : S.tab;
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
  wrap.style.display = "none"; pendingConfirm = null; restoreFocus();
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
    + '<span class="sub">Incluye tus estilos, ediciones y borrados. Las capturas propias no viajan en la copia.</span></div>'
    + '<details class="adv"><summary>Exportar o importar como texto</summary>'
    + '<textarea class="fld" id="ioText" rows="6" placeholder="Exporta para ver o pega un JSON para importar"></textarea>'
    + '<div class="btns"><button class="cta ghost" data-act="export">Mostrar mis cambios</button><div class="two"><button class="cta ghost" data-act="copyio">Copiar</button><button class="cta ghost" data-act="import">Importar</button></div>'
    + (bak ? '<button class="cta ghost" data-act="backup">Ver respaldo de la versión 1.5</button>' : '') + '</div></details>'
    + '<div class="btns"><button class="cta ghost" data-act="restore">Restaurar el catálogo original</button><button class="cta ghost" data-act="closesheet">Cerrar</button></div>');
}
function exportJSON() { return JSON.stringify({ app: "estilos", version: APP_VERSION, added: user.added, edits: user.edits, deleted: user.deleted }, null, 2); }
function exportFile() { return new File([exportJSON()], "estilos-" + new Date().toISOString().slice(0, 10) + ".json", { type: "application/json" }); }
function downloadFile() {
  const f = exportFile(), url = URL.createObjectURL(f), a = document.createElement("a");
  a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000); toast("Copia descargada: " + f.name);
}
function shareFile() {
  const f = exportFile();
  const p = navigator.canShare && navigator.canShare({ files: [f] }) ? navigator.share({ files: [f], title: "Copia de Estilos" }) : navigator.share({ title: "Copia de Estilos", text: exportJSON() });
  p.catch(err => { if (err && err.name !== "AbortError") downloadFile(); });
}
function doExport() {
  document.getElementById("ioText").value = exportJSON();
  toast("Listo para copiar");
}
function doImport() { doImportText(document.getElementById("ioText").value); }
function doImportText(text) {
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
      + '<div class="two"><button class="cta ghost" data-act="palcopy" data-c="' + cols.join(",") + '">Copiar HEX</button><button class="cta ghost" data-act="closesheet">Cerrar</button></div></div>');
  }).catch(() => toast("No se pudo leer la imagen"));
}
/* ───────── Capturas propias ───────── */
function loadUserRefs() {
  return RefStore.all().then(list => {
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
  open: d => { draft = null; go({ view: "detail", id: d.id, detailTab: "info", stage: "auto" }); },
  back: () => goBack(),
  nav: d => go({ view: d.v, q: d.v === "explore" ? S.q : "" }),
  tab: d => go({ view: "explore", tab: d.t, q: "" }),
  gosearch: () => { go({ view: "explore", q: "" }); const q = document.getElementById("q"); if (q) q.focus(); },
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
  builderselect: d => { builder.activeLayer=Math.max(0,Math.min(builder.selected.length-1,Number(d.index)||0));saveBuilder();render(true); },
  builderremove: d => { const i=Number(d.index); if(Number.isInteger(i)&&i>=0&&i<builder.selected.length){builder.selected.splice(i,1);builder.layers.splice(i,1);builder.activeLayer=Math.max(0,Math.min(builder.selected.length-1,builder.activeLayer));} else builder.selected=builder.selected.filter(id=>id!==d.id); saveBuilder();render(true); },
  buildermove: d => { const i=Number(d.index),to=i+Number(d.dir); if(Number.isInteger(i)&&to>=0&&to<builder.selected.length){const item=builder.selected.splice(i,1)[0];builder.selected.splice(to,0,item);const layer=builder.layers.splice(i,1)[0];builder.layers.splice(to,0,layer);builder.activeLayer=to;saveBuilder();render(true);} },
  builderduplicate: d => { const i=Number(d.index); if(builder.selected.length>=12){toast('Máximo doce capas');return;} if(Number.isInteger(i)&&i>=0&&i<builder.selected.length){builder.selected.splice(i+1,0,builder.selected[i]);const copy=Object.assign({},builder.layers[i]||{}, {uid:"layer-"+Math.random().toString(36).slice(2,9)});builder.layers.splice(i+1,0,copy);builder.activeLayer=i+1;saveBuilder();render(true);toast('Componente duplicado');} },
  builderexport: () => exportBuilder(),
  closesheet: () => closeSheet(),
  lb: d => { const r = REFS[+d.i]; if (r) openLB({ src: r.img, label: r.label }); },
  closelb: () => closeLB()
};
document.addEventListener("click", ev => {
  const el = ev.target.closest("[data-act]");
  if (el && ACT[el.dataset.act]) { ev.stopPropagation(); ACT[el.dataset.act](el.dataset); return; }
  if (ev.target.id === "sheetWrap") closeSheet();
  if (ev.target.id === "lightbox") closeLB();
});
document.addEventListener("keydown", ev => {
  if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches && ev.target.matches('article[data-act="open"]')) { ev.preventDefault(); ACT.open(ev.target.dataset); }
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
let qTimer = 0;
document.addEventListener("input", ev => {
  const t = ev.target;
  if (!t.dataset) return;
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
  const handle=ev.target.closest && ev.target.closest("[data-builder-drag]");
  if(!handle)return;
  const i=Number(handle.dataset.builderDrag),layer=builder.layers[i];
  if(!layer)return;
  builder.activeLayer=i;
  builderPointerDrag={i,x:ev.clientX,y:ev.clientY,ox:Number(layer.offsetX)||0,oy:Number(layer.offsetY)||0,pointerId:ev.pointerId};
  try{handle.setPointerCapture(ev.pointerId);}catch(_){}
  ev.preventDefault();
});
document.addEventListener("pointermove", ev => {
  if(!builderPointerDrag||ev.pointerId!==builderPointerDrag.pointerId)return;
  const d=builderPointerDrag,l=builder.layers[d.i];if(!l)return;
  l.offsetX=Math.max(-40,Math.min(40,d.ox+ev.clientX-d.x));
  l.offsetY=Math.max(-40,Math.min(40,d.oy+ev.clientY-d.y));
  const block=document.querySelector('[data-builder-preview-layer="'+d.i+'"]');
  if(block)block.style.translate=l.offsetX+'px '+l.offsetY+'px';
});
function finishBuilderPointerDrag(ev){
  if(!builderPointerDrag)return;
  if(ev&&ev.pointerId!==builderPointerDrag.pointerId)return;
  builderPointerDrag=null;saveBuilder();render(true);
}
document.addEventListener("pointerup",finishBuilderPointerDrag);
document.addEventListener("pointercancel",finishBuilderPointerDrag);
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
  if (t.id === "fileRef") { if (t.files && t.files.length) addRefs(t.files); t.value = ""; return; }
  if (t.id === "fileJson") {
    const f = t.files && t.files[0]; t.value = ""; if (!f) return;
    if (f.size > 2e6) return toast("Archivo demasiado grande");
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

/* ───────── Arranque ───────── */
try { history.replaceState(S, ""); } catch (e) { /* ignorar */ }
render();
loadUserRefs();
if (migrated) setTimeout(() => toast("Actualizado a v" + APP_VERSION + ". Tu copia anterior está en Ajustes."), 600);
