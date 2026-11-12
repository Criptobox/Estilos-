/* Estilos Studio · el Agente.
   Flujo tipo Stitch: escribes un brief, el agente propone una pantalla completa
   eligiendo UN diseño por bloque (encabezado, tarjetas, botón, barra…), y luego
   tú cambias solo lo que no te gusta. Todo se reutiliza de la biblioteca
   (`data.js` + `designs-*.js`), así que lo que ves se copia tal cual.

   No hay servidor ni modelo de lenguaje: el "agente" es un motor de reglas
   local (palabras clave → sector → receta de bloques). Es honesto y funciona
   sin conexión. La capa de IA se puede enchufar después sin tocar la interfaz. */

/* ───────── Biblioteca ───────── */
const ENTRY = {};
SEED.forEach(e => { ENTRY[e.id] = e; });

/* ───────── Sectores (paleta + receta) ───────── */
const VERTICALS = [
  { id: "tienda", label: "Tienda", icon: "bag", acc: "#2F6BFF", acc2: "#7C5CFF", page: "#FAF7F1", theme: "light",
    words: ["tienda", "shop", "ecommerce", "producto", "mueble", "ropa", "zapato", "catálogo", "catalogo", "compra"] },
  { id: "comida", label: "Comida", icon: "flame", acc: "#FF7A1A", acc2: "#F43F5E", page: "#FFF7F0", theme: "light",
    words: ["comida", "café", "cafe", "delivery", "restaurante", "pizza", "pedido", "menú", "menu", "reparto", "sushi", "bar"] },
  { id: "fintech", label: "Fintech", icon: "wallet", acc: "#10B981", acc2: "#3B82F6", page: "#F2F8F5", theme: "light",
    words: ["fintech", "banco", "dinero", "pago", "crypto", "billetera", "inversión", "inversion", "tarjeta", "finanzas", "ahorro"] },
  { id: "fitness", label: "Fitness", icon: "flame", acc: "#F97316", acc2: "#22C55E", page: "#12151A", theme: "dark",
    words: ["fitness", "gym", "entrenar", "ejercicio", "deporte", "correr", "rutina", "pesas", "yoga"] },
  { id: "viajes", label: "Viajes", icon: "pin", acc: "#0EA5E9", acc2: "#1E40AF", page: "#EEF7FC", theme: "light",
    words: ["viaje", "vuelo", "hotel", "destino", "turismo", "reserva", "playa", "trip", "mochilero"] },
  { id: "salud", label: "Salud / IA", icon: "spark", acc: "#7C5CFF", acc2: "#22C55E", page: "#F7F4FF", theme: "light",
    words: ["ia", "asistente", "chat", "salud", "médico", "medico", "terapia", "bienestar", "mental", "chatbot", "agente"] },
  { id: "musica", label: "Música", icon: "music", acc: "#A855F7", acc2: "#EC4899", page: "#12101A", theme: "dark",
    words: ["música", "musica", "podcast", "audio", "playlist", "canción", "cancion", "radio", "spotify"] },
  { id: "saas", label: "SaaS", icon: "grid", acc: "#6E7BFF", acc2: "#22D3EE", page: "#0E1116", theme: "dark",
    words: ["saas", "dashboard", "panel", "b2b", "analítica", "analitica", "proyecto", "tareas", "crm", "métricas", "metricas", "admin"] }
];

/* Receta por sector: candidatos por bloque. El agente rota entre ellos. */
const RECIPES = {
  tienda: { header: ["enc-5", "enc-4"], search: ["ent-1"], metrics: ["dat-1"], cards: ["tar-1", "tar-6", "tar-4", "tar-18"], list: ["lis-1"], cta: ["bot-1", "bot-2"], nav: ["bar-10", "bar-5", "bar-2"] },
  comida: { header: ["enc-3", "enc-1"], search: ["ent-1", "ent-4"], metrics: ["dat-1"], cards: ["tar-6", "tar-1", "tar-18"], list: ["lis-1"], cta: ["bot-2", "bot-7"], nav: ["bar-5", "bar-10", "bar-1"] },
  fintech: { header: ["enc-1", "enc-5"], search: [], metrics: ["dat-4", "dat-1", "dat-3"], cards: ["tar-5", "tar-11"], list: ["lis-2"], cta: ["bot-1", "bot-9"], nav: ["bar-12", "bar-10", "bar-2"] },
  fitness: { header: ["enc-5", "enc-1"], search: [], metrics: ["dat-5", "dat-2", "dat-3"], cards: ["tar-4", "tar-18", "tar-17"], list: ["lis-1"], cta: ["bot-2", "bot-3"], nav: ["bar-6", "bar-9", "bar-8"] },
  viajes: { header: ["enc-3", "enc-5"], search: ["ent-1"], metrics: ["dat-1"], cards: ["tar-2", "tar-16", "tar-4"], list: ["lis-1"], cta: ["bot-1", "bot-8"], nav: ["bar-2", "bar-10", "bar-4"] },
  salud: { header: ["enc-1", "enc-5"], search: ["ent-1"], metrics: ["dat-2", "dat-5"], cards: ["tar-4", "tar-7", "tar-19"], list: ["lis-4"], cta: ["bot-2", "bot-1"], nav: ["bar-3", "bar-10", "bar-5"] },
  musica: { header: ["enc-5", "enc-4"], search: ["ent-1"], metrics: ["dat-1"], cards: ["tar-21", "tar-2"], list: ["lis-3"], cta: ["bot-3"], nav: ["bar-9", "bar-8", "bar-6"] },
  saas: { header: ["enc-1", "enc-2"], search: ["ent-1"], metrics: ["dat-1", "dat-3"], cards: ["tar-13", "tar-11", "tar-8"], list: ["lis-1"], cta: ["bot-3", "bot-1"], nav: ["bar-11", "bar-12", "bar-10"] }
};

/* Bloques de la pantalla. `pinned` se ancla abajo; `optional` se puede apagar. */
const SLOTS = [
  { key: "header", label: "Encabezado", tab: "Encabezados" },
  { key: "search", label: "Buscador", tab: "Entradas", optional: true },
  { key: "metrics", label: "Métricas", tab: "Datos", optional: true },
  { key: "cards", label: "Tarjetas", tab: "Tarjetas", type: "grid2" },
  { key: "list", label: "Lista", tab: "Listas", optional: true },
  { key: "cta", label: "Botón", tab: "Botones" },
  { key: "nav", label: "Barra inferior", tab: "Barras", pinned: true }
];

/* Tarjetas altas (medido a 170 px de ancho): no caben en una rejilla de dos
   columnas sin recortarse, así que esas van a ancho completo. */
const TALL_CARD = new Set(["tar-1", "tar-3", "tar-5", "tar-7", "tar-8", "tar-9", "tar-21"]);

/* ───────── Estado ───────── */
const $ = id => document.getElementById(id);
const KEY = "estilos-studio-v1";
const S = {
  brief: "",
  vertical: "tienda",
  theme: "light",
  density: "comoda",
  radius: 18,
  palette: { acc: "#FF704B", acc2: "#FFB08F", page: "#F3F1ED" },
  blocks: {},
  hidden: {},
  content: {},
  assets: {},
  order: [],
  locked: {}
};

const INITIAL_STATE = JSON.stringify(S);
const INITIAL_ORDER = SLOTS.map(s => s.key);

function defaultBlocks() {
  const b = {};
  SLOTS.forEach(s => { const r = RECIPES[S.vertical][s.key]; b[s.key] = r && r.length ? r[0] : null; S.hidden[s.key] = !r || !r.length; });
  return b;
}

/* Historial de sesión: 50 cambios, sin guardar copias en localStorage. */
const HISTORY_LIMIT = 51;
let historyStates = [], historyIndex = -1, historyReady = false, historyRestoring = false;
let historyGroup = null, historyTime = 0;
let studioStorageOK = true;
function historyButtons() {
  document.querySelectorAll('[data-act="undo"]').forEach(b => b.disabled = historyIndex <= 0);
  document.querySelectorAll('[data-act="redo"]').forEach(b => b.disabled = historyIndex >= historyStates.length - 1);
}
function save(group) {
  S.order = SLOTS.map(s => s.key);
  const snapshot = JSON.stringify(S);
  studioStorageOK = true;
  try { localStorage.setItem(KEY, snapshot); } catch (e) { studioStorageOK = false; toast("No se pudo guardar: almacenamiento lleno o bloqueado. Exporta el HTML antes de salir."); }
  if (historyReady && !historyRestoring && historyStates[historyIndex] !== snapshot) {
    const now = Date.now();
    const merge = group && historyGroup === group && now - historyTime < 900 && historyIndex > 0 && historyIndex === historyStates.length - 1;
    historyStates.splice(historyIndex + 1);
    if (merge) historyStates[historyIndex] = snapshot;
    else {
      historyStates.push(snapshot);
      if (historyStates.length > HISTORY_LIMIT) historyStates.shift();
      historyIndex = historyStates.length - 1;
    }
    historyGroup = group || null; historyTime = now;
  }
  historyButtons();
}
function restoreOrder(order) {
  if (!Array.isArray(order)) return;
  const keys = SLOTS.map(s => s.key);
  if (order.length !== keys.length || new Set(order).size !== keys.length || !order.every(k => keys.includes(k))) return;
  SLOTS.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}
function historyStep(delta) {
  const next = historyIndex + delta;
  if (next < 0 || next >= historyStates.length) return;
  historyIndex = next; historyGroup = null;
  Object.assign(S, JSON.parse(historyStates[next]));
  restoreOrder(S.order);
  historyRestoring = true;
  try {
    briefEl.value = S.brief; $("briefCount").textContent = S.brief.length + "/240";
    readout.textContent = delta < 0 ? "Cambio deshecho." : "Cambio rehecho.";
    renderAll();
    if (!$("mContent").hidden) renderContent();
    if (!$("mCode").hidden) $("codeOut").textContent = codeFor(codeTab);
  } finally { historyRestoring = false; }
  toast(delta < 0 ? "Cambio deshecho" : "Cambio rehecho");
}
document.addEventListener("click", ev => {
  const b = ev.target.closest('[data-act="undo"],[data-act="redo"]');
  if (b && !b.disabled) historyStep(b.dataset.act === "undo" ? -1 : 1);
});
document.addEventListener("keydown", ev => {
  if (!(ev.ctrlKey || ev.metaKey) || ev.altKey) return;
  if (ev.target.closest('input,textarea,[contenteditable="true"]')) return; // respetar el historial nativo del campo
  if ([...document.querySelectorAll(".modal")].some(m => !m.hidden && !(m.id === "mContent" && innerWidth >= 1200))) return;
  const key = ev.key.toLowerCase();
  if (key === "z" || (key === "y" && !ev.shiftKey)) {
    ev.preventDefault(); historyStep(key === "y" || ev.shiftKey ? 1 : -1);
  }
});
document.addEventListener("change", () => { historyGroup = null; });
document.addEventListener("focusout", () => { historyGroup = null; });
function load(input) {
  try {
    const raw = input || JSON.parse(localStorage.getItem(KEY) || "null");
    if (!raw || typeof raw !== "object") return false;
    Object.assign(S, JSON.parse(INITIAL_STATE)); restoreOrder(INITIAL_ORDER);
    if (typeof raw.brief === "string") S.brief = raw.brief.slice(0, 240);
    if (RECIPES[raw.vertical]) S.vertical = raw.vertical;
    if (raw.theme === "light" || raw.theme === "dark") S.theme = raw.theme;
    if (raw.density === "compacta") S.density = "compacta";
    if (typeof raw.radius === "number") S.radius = Math.max(0, Math.min(32, raw.radius));
    if (raw.palette && typeof raw.palette === "object") {
      S.palette = { acc: safeColor(raw.palette.acc, "#2F6BFF"), acc2: safeColor(raw.palette.acc2, "#7C5CFF"), page: safeColor(raw.palette.page, "#FEFDFB") };
    }
    restoreOrder(raw.order);
    S.content = {};
    if (raw.content && typeof raw.content === "object") Object.keys(ENTRY).forEach(id => {
      const values = raw.content[id];
      if (Array.isArray(values)) S.content[id] = values.slice(0, 200).map(v => typeof v === "string" ? v.slice(0, 500) : null);
    });
    S.assets = studioAssets(raw.assets, false);
    S.blocks = {};
    SLOTS.forEach(s => { const id = safeId(raw.blocks && raw.blocks[s.key]); S.blocks[s.key] = ENTRY[id] ? id : null; });
    S.hidden = {};
    SLOTS.forEach(s => { S.hidden[s.key] = !!(raw.hidden && raw.hidden[s.key]); });
    S.locked = {};
    SLOTS.forEach(s => { S.locked[s.key] = !!(raw.locked && raw.locked[s.key]); });
    // si todo quedó vacío, se vuelve a la receta
    if (!Object.values(S.blocks).some(Boolean)) applyRecipe(true);
    return true;
  } catch (e) { return false; }
}

/* Proyectos locales: copias explícitas independientes del borrador automático. */
const PROJECTS_KEY = "estilos-studio-projects-v1";
const PROJECT_LIMIT = 30;
let projects = [], projectPending = null;
function readProjects() {
  try {
    const list = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
    if (!Array.isArray(list)) throw new Error("Formato inválido");
    projects = list.filter(p => p && typeof p.id === "string" && /^[a-zA-Z0-9-]+$/.test(p.id) && typeof p.name === "string" && p.state && typeof p.state === "object").slice(0, PROJECT_LIMIT);
    return true;
  } catch (e) { projectMessage("No se pudieron leer los proyectos. No se ha reemplazado el almacenamiento."); return false; }
}
function writeProjects(list) {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(list)); projects = list;
    return true;
  } catch (e) { projectMessage("No se pudo guardar. Revisa el espacio o los permisos del navegador. Tu pantalla sigue intacta."); return false; }
}
function projectMessage(text) { $("projectStatus").textContent = text; }
function projectId() { return "p-" + (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)); }
function projectState() { return JSON.parse(JSON.stringify(S)); }
function projectNavigation(active) {
  const projectsButton = document.querySelector('.studio-nav [data-studio-nav="projects"]'), editorLink = document.querySelector('.studio-nav a[href="agente.html"]');
  projectsButton.classList.toggle("active",active); editorLink.classList.toggle("active",!active);
  if (active) { projectsButton.setAttribute("aria-current","page"); editorLink.removeAttribute("aria-current"); }
  else { projectsButton.removeAttribute("aria-current"); editorLink.setAttribute("aria-current","page"); }
  document.querySelector(".workspace-title>span").textContent = active ? "MIS PROYECTOS" : "EDITOR";
  document.querySelector(".workspace-title>b").textContent = active ? "Tu espacio creativo" : "Diseña con Luma";
}
function closeProjects() { $("mProjects").hidden = true; projectNavigation(false); $("btnProjects").focus(); requestAnimationFrame(fitPhone); }
function openProjects() {
  $("mProjects").hidden = false; projectNavigation(true); syncInspectorMode(); projectPending = null; projectMessage("");
  $("projectName").value = "";
  if (readProjects()) renderProjects();
  $("projectName").focus();
}
function projectThumbnail(project) {
  const frame = document.createElement("div"); frame.className = "project-thumbnail"; frame.setAttribute("aria-hidden","true");
  try {
    const defaults = JSON.parse(INITIAL_STATE), raw = project.state;
    const state = {...defaults,...raw,palette:{...defaults.palette,...raw.palette},assets:studioAssets(raw.assets,false)};
    ["acc","acc2","page"].forEach(k => state.palette[k] = safeColor(state.palette[k],defaults.palette[k]));
    const ids = ["header","cards","cta"].map(k => raw.blocks && raw.blocks[k]).filter(id => Object.hasOwn(ENTRY,id));
    const iframe = document.createElement("iframe"); iframe.setAttribute("sandbox",""); iframe.tabIndex = -1; iframe.title = "Miniatura de " + project.name; iframe.loading = "lazy";
    iframe.srcdoc = '<!doctype html><html lang="es"><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:12px;background:' + brand(state).page + ';font-family:system-ui,sans-serif;display:grid;gap:12px}estilos-block{display:block}</style></head><body>' + ids.map(id => blockMarkup(partsFor(styled(id,state),state),"")).join("") + '</body></html>';
    frame.appendChild(iframe);
  } catch(e) { frame.textContent = "Vista previa no disponible"; }
  return frame;
}
function renderProjects() {
  $("projectCount").textContent = projects.length + "/" + PROJECT_LIMIT + " proyectos";
  const host = $("projectList"); host.replaceChildren();
  if (!projects.length) { const p = document.createElement("p"); p.className = "empty-note"; p.textContent = "Aún no hay proyectos. Ponle nombre a tu pantalla y guarda una copia."; host.appendChild(p); }
  projects.forEach(p => {
    const row = document.createElement("article"); row.className = "project-row"; row.dataset.project = p.id;
    const input = document.createElement("input"); input.value = p.name.slice(0,80); input.maxLength = 80; input.setAttribute("aria-label", "Nombre del proyecto " + p.name.slice(0,80));
    const info = document.createElement("small");
    const date = new Date(p.updated); info.textContent = (RECIPES[p.state.vertical] ? p.state.vertical : "pantalla") + " · " + (Number.isNaN(+date) ? "Sin fecha" : date.toLocaleString("es"));
    const acts = document.createElement("div"); acts.className = "project-actions";
    [["openproject","Abrir"],["renameproject","Renombrar"],["duplicateproject","Duplicar"],["exportproject","Exportar JSON"],["replaceproject","Actualizar"],["deleteproject","Eliminar"]].forEach(([act,label]) => {
      const b = document.createElement("button"); b.className = "btn sm"; b.dataset.act = act; b.textContent = label; acts.appendChild(b);
    });
    row.append(projectThumbnail(p),input,info,acts);
    if (projectPending && projectPending.id === p.id) {
      const confirm = document.createElement("div"); confirm.className = "project-confirm";
      const text = document.createElement("p");
      text.textContent = projectPending.type === "openproject" ? "Abrir reemplazará la pantalla de trabajo y vaciará su historial. Si quieres conservarla, guarda una copia antes de continuar." : projectPending.type === "replaceproject" ? "Actualizar reemplazará esta copia guardada con tu pantalla actual. No se puede deshacer." : "¿Eliminar esta copia guardada? Tu pantalla de trabajo no se borrará.";
      const yes = document.createElement("button"); yes.className = "btn primary sm"; yes.dataset.act = "confirmproject"; yes.textContent = "Sí, continuar";
      const no = document.createElement("button"); no.className = "btn sm"; no.dataset.act = "cancelproject"; no.textContent = "Cancelar";
      confirm.append(text,yes,no); row.appendChild(confirm);
    }
    host.appendChild(row);
  });
}
$("btnProjects").addEventListener("click", openProjects);
$("mProjects").addEventListener("click", ev => {
  if (ev.target === $("mProjects")) { if (innerWidth < 1200) closeProjects(); return; }
  const b = ev.target.closest("[data-act]"); if (!b) return;
  const act = b.dataset.act;
  if (act === "closeprojects") { closeProjects(); return; }
  if (act === "saveproject") {
    const name = $("projectName").value.trim().slice(0,80);
    if (!name) { projectMessage("Escribe un nombre para guardar la pantalla."); $("projectName").focus(); return; }
    if (!readProjects()) return;
    if (projects.length >= PROJECT_LIMIT) { projectMessage("Límite de 30 proyectos. Elimina una copia para guardar otra."); return; }
    save();
    if (writeProjects([{id:projectId(),name,updated:new Date().toISOString(),state:projectState()}, ...projects])) {
      projectPending = null; renderProjects(); projectMessage("Copia guardada: " + name); $("projectName").value = "";
    }
    return;
  }
  const row = b.closest("[data-project]"); if (!row) return;
  const id = row.dataset.project;
  if (act === "cancelproject") { projectPending = null; renderProjects(); return; }
  if (["openproject","replaceproject","deleteproject"].includes(act)) { projectPending = {id,type:act}; renderProjects(); return; }
  if (!readProjects()) return;
  const project = projects.find(p => p.id === id); if (!project) { projectMessage("Este proyecto ya no existe."); renderProjects(); return; }
  if (act === "renameproject") {
    const name = row.querySelector("input").value.trim().slice(0,80);
    if (!name) { projectMessage("El nombre no puede quedar vacío."); return; }
    if (writeProjects(projects.map(p => p.id === id ? {...p,name,updated:new Date().toISOString()} : p))) { renderProjects(); projectMessage("Nombre actualizado."); }
  }
  if (act === "duplicateproject") {
    if (projects.length >= PROJECT_LIMIT) { projectMessage("Límite de 30 proyectos alcanzado."); return; }
    if (writeProjects([{...project,id:projectId(),name:(project.name + " · copia").slice(0,80),updated:new Date().toISOString(),state:JSON.parse(JSON.stringify(project.state))}, ...projects])) { renderProjects(); projectMessage("Proyecto duplicado."); }
  }
  if (act !== "confirmproject" || !projectPending || projectPending.id !== id) return;
  const type = projectPending.type;
  if (type === "openproject") {
    if (!load(project.state)) { projectMessage("No se pudo abrir el proyecto."); return; }
    historyReady = false;
    briefEl.value = S.brief; $("briefCount").textContent = S.brief.length + "/240";
    renderAll(); historyStates = [JSON.stringify(S)]; historyIndex = 0; historyGroup = null; historyReady = true; historyButtons();
    readout.textContent = "Proyecto abierto: " + project.name;
    projectPending = null; closeProjects(); toast("Proyecto abierto");
  } else {
    const next = type === "deleteproject" ? projects.filter(p => p.id !== id) : projects.map(p => p.id === id ? {...p,state:projectState(),updated:new Date().toISOString()} : p);
    if (writeProjects(next)) { projectPending = null; renderProjects(); projectMessage(type === "deleteproject" ? "Copia eliminada." : "Proyecto actualizado con la pantalla actual."); }
  }
});
$("mProjects").addEventListener("keydown", ev => {
  if (innerWidth >= 1200 && ev.key === "Tab") return;
  if (ev.key === "Escape") { ev.stopPropagation(); closeProjects(); return; }
  if (ev.key !== "Tab") return;
  const controls = [...$("mProjects").querySelectorAll("button,input")].filter(el => !el.disabled && el.getClientRects().length);
  const first = controls[0], last = controls[controls.length - 1];
  if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
  else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
});

/* ───────── Paleta y tokens ───────── */
function brand(state = S) {
  const dark = state.theme === "dark";
  return {
    sur: dark ? "#171B23" : "#FFFFFF",
    page: dark ? (state.palette.page && isDarkish(state.palette.page) ? state.palette.page : "#0E1116") : state.palette.page,
    acc: state.palette.acc,
    acc2: state.palette.acc2,
    ink: dark ? "#F2F4F8" : "#14161B",
    mut: dark ? "#9AA3B2" : "#6B7280",
    onacc: inkOn(state.palette.acc)
  };
}
function isDarkish(hex) { return contrast(hex, "#FFFFFF") > 4; }

/* Recolorear sin romper: se conservan las superficies del diseño original y solo
   se sustituye SU acento por el de tu marca (y su segundo color, si lo tiene).
   Recolorear todos los huecos por posición rompía iconos y fondos: los diseños
   no usan el mismo orden de colores entre sí. */
function styled(id, state = S) {
  const base = ENTRY[id];
  if (!base) return null;
  const p = brand(state);
  const orig = (base.colors || []).slice(0, 6);
  // Solo se considera "acento" un color con saturación real: si no, un gris de
  // fondo (#F0F0F0) se confundiría con el color de marca y pintaría el campo de azul.
  let a1 = null, a2 = null;
  orig.forEach(c => {
    if (sat(c) <= 0.3) return;
    if (!a1) a1 = c.toUpperCase();
    else if (!a2 && c.toUpperCase() !== a1) a2 = c.toUpperCase();
  });
  let colors = orig.map(c => {
    const u = c.toUpperCase();
    if (a1 && u === a1) return p.acc;
    if (a2 && u === a2) return p.acc2;
    return c;
  });
  /* En tema oscuro los neutros se invierten (blanco → superficie oscura,
     negro → texto claro). Los colores con saturación real no se tocan: son la
     identidad del diseño. Así un componente pensado en claro se adapta sin
     rehacerlo y sin que el texto desaparezca. */
  if (state.theme === "dark" && base.mode !== "dark") {
    colors = colors.map(c => {
      if (sat(c) > 0.28) return c;
      const l = lum(c);
      if (l > 0.72) return p.sur;
      if (l < 0.2) return p.ink;
      return c;
    });
  }
  return Object.assign({}, base, { colors: colors.length ? colors : orig, radius: String(state.radius), mode: state.theme });
}

/* ───────── Agente: interpretar el brief ───────── */
function detect(text) {
  const t = (text || "").toLowerCase();
  let vertical = null, theme = null, out = [];
  VERTICALS.forEach(v => { if (!vertical && v.words.some(w => t.includes(w))) vertical = v.id; });
  if (/\b(oscura?|oscuro|dark|nocturn|noche|black)\b/.test(t)) theme = "dark";
  if (/\b(clara?|claro|light|blanc|diurn)\b/.test(t)) theme = "light";
  if (vertical) { const v = VERTICALS.find(x => x.id === vertical); out.push("sector: " + v.label.toLowerCase()); }
  if (theme) out.push("tema " + (theme === "dark" ? "oscuro" : "claro"));
  if (/compact|dens|peque/.test(t)) out.push("densidad compacta");
  if (/grande|ampli|espaci/.test(t)) out.push("aire entre bloques");
  return { vertical, theme, out };
}

/* El agente elige un diseño por bloque (rotando para no repetir siempre el mismo). */
function applyRecipe(quiet) {
  const rec = RECIPES[S.vertical];
  const pick = arr => (arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null);
  const prev = S.blocks, prevHidden = S.hidden;
  S.blocks = {}; S.hidden = {};
  SLOTS.forEach(s => {
    /* un bloque con candado conserva su diseño y su visibilidad */
    if (S.locked[s.key] && prev[s.key]) { S.blocks[s.key] = prev[s.key]; S.hidden[s.key] = !!prevHidden[s.key]; return; }
    const id = pick(rec[s.key]);
    S.blocks[s.key] = id;
    S.hidden[s.key] = !id;
  });
  /* Si el encabezado ya trae buscador propio, no se repite el bloque (salvo que lo hayas bloqueado). */
  if (["enc-3", "enc-5"].includes(S.blocks.header) && S.blocks.search && !S.locked.search) S.hidden.search = true;
  if (!quiet) renderAll();
  save();
}

function generate(fromBrief) {
  const d = fromBrief ? detect(S.brief) : { vertical: null, theme: null, out: [] };
  const v = VERTICALS.find(x => x.id === (d.vertical || S.vertical)) || VERTICALS[0];
  S.vertical = v.id;
  const theme = d.theme || v.theme;
  S.theme = theme;
  S.palette = { acc: v.acc, acc2: v.acc2, page: theme === "dark" ? v.page : lightenPage(v.page) };
  applyRecipe();
  const parts = d.out.length ? d.out : ["sector: " + v.label.toLowerCase(), "tema " + (theme === "dark" ? "oscuro" : "claro")];
  readout.innerHTML = "Interpretado → <b>" + esc(parts.join(" · ")) + "</b>. Cambia cualquier bloque a la derecha.";
  toast("Diseño generado");
}

function lightenPage(page) {
  // si el sector es oscuro por defecto, damos una versión clara decente
  return contrast(page, "#FFFFFF") > 4 ? "#F4F5F8" : page;
}

/* ───────── Render: panel izquierdo ───────── */
const briefEl = $("brief"), vlabsEl = $("vlabs"), blocksEl = $("blocks"), readout = $("readout");
const scrollEl = $("scroll"), dockEl = $("dock"), screenEl = $("screen");

function renderVlabs() {
  vlabsEl.innerHTML = VERTICALS.map(v =>
    '<button class="vlab' + (v.id === S.vertical ? " on" : "") + '" data-v="' + v.id + '">' +
    ic(v.icon, 13) + esc(v.label) + "</button>").join("");
}

function renderBlocks() {
  blocksEl.innerHTML = SLOTS.map((s, i) => {
    const id = S.blocks[s.key], e = id ? ENTRY[id] : null;
    const off = S.hidden[s.key] || !e;
    const lk = !!S.locked[s.key];
    return '<div class="blk' + (contentSlot === s.key && !$("mContent").hidden ? " selected" : "") + (off ? " off" : "") + (lk ? " locked" : "") + '" data-slot="' + s.key + '">' +
      '<span class="grip" aria-hidden="true">' + ic("grip", 14) + "</span>" +
      '<div class="meta"><small>' + esc(s.label) + "</small><b>" + (e ? esc(e.name) : "Sin asignar") + "</b></div>" +
      '<div class="acts">' +
        (e ? '<button class="iconbtn" data-act="editcontent" data-slot="' + s.key + '" aria-label="Editar contenido de ' + esc(s.label) + '" title="Editar contenido">Aa</button>' : '') +
        '<button class="iconbtn lockbtn' + (lk ? " on" : "") + '" data-act="lock" data-slot="' + s.key + '" aria-pressed="' + lk + '" aria-label="' + (lk ? "Desbloquear " : "Bloquear ") + esc(s.label) + '" title="' + (lk ? "Bloqueado: el agente no lo cambia al generar" : "Bloquear: el agente no lo cambia al generar") + '">' + ic(lk ? "lock" : "unlock", 14) + "</button>" +
        '<button class="iconbtn" data-act="change" data-slot="' + s.key + '" aria-label="Cambiar ' + esc(s.label) + '">' + ic("swap", 14) + "</button>" +
        (s.optional ? '<button class="iconbtn" data-act="toggle" data-slot="' + s.key + '" aria-label="' + (off ? "Mostrar" : "Ocultar") + '">' + ic(off ? "eyeOff" : "eye", 14) + "</button>" : "") +
        '<button class="iconbtn" data-act="up" data-slot="' + s.key + '" aria-label="Subir">' + ic("arrowUp", 14) + "</button>" +
        '<button class="iconbtn" data-act="down" data-slot="' + s.key + '" aria-label="Bajar">' + ic("arrowDown", 14) + "</button>" +
      "</div></div>";
  }).join("");
  // miniaturas (una por fila, ya montadas como shadow DOM)
  SLOTS.forEach(s => {
    const id = S.blocks[s.key];
    const row = blocksEl.querySelector('[data-slot="' + s.key + '"]');
    if (!row || !id) return;
    const grip = row.querySelector(".grip");
    const thumb = document.createElement("span");
    thumb.className = "thumb"; thumb.draggable = true; thumb.title = "Arrastrar para reordenar";
    const box = document.createElement("div");
    box.className = "mini";
    box.appendChild(pvNode(styled(id)));
    thumb.appendChild(box);
    grip.replaceWith(thumb);
  });
  $("blkCount").textContent = SLOTS.filter(s => S.blocks[s.key] && !S.hidden[s.key]).length;
}

function renderSwatches() {
  const p = brand();
  const items = [
    { k: "acc", label: "Acento", v: S.palette.acc },
    { k: "acc2", label: "Secundario", v: S.palette.acc2 },
    { k: "page", label: "Fondo", v: S.palette.page }
  ];
  $("swatches").innerHTML = items.map(i =>
    '<label class="sw" title="' + i.label + '" style="background:' + esc(i.v) + '">' +
    '<input type="color" data-color="' + i.k + '" value="' + esc(i.v) + '" aria-label="' + i.label + '"></label>').join("") +
    '<span class="hint" style="align-self:center;margin-left:4px">' + (p.onacc === "#FFFFFF" ? "texto claro" : "texto oscuro") + "</span>";
  document.querySelectorAll("[data-dna-theme]").forEach(b => b.classList.toggle("on", b.dataset.dnaTheme === S.theme));
  document.querySelectorAll("[data-density]").forEach(b => b.classList.toggle("on", b.dataset.density === S.density));
  $("radius").value = S.radius;
  $("radiusVal").textContent = S.radius;
  document.querySelectorAll("[data-v]").forEach(b => b.classList.toggle("on", b.dataset.v === S.vertical));
}

/* ───────── Render: lienzo ───────── */
/* Segunda tarjeta de la fila: misma altura que la elegida para que la rejilla
   quede pareja. Si la elegida es alta, va sola a ancho completo. */
function cardPair(id) {
  if (!id || TALL_CARD.has(id) || (ENTRY[id] && variantOf(ENTRY[id]) === "card.pastel")) return [id];
  const tall = TALL_CARD.has(id);
  const candidates = SEED.filter(e => e.tab === "Tarjetas" && e.id !== id && TALL_CARD.has(e.id) === tall);
  const recipe = (RECIPES[S.vertical].cards || []).filter(x => candidates.some(c => c.id === x));
  const pick = recipe[0] || (candidates[0] && candidates[0].id);
  return pick && pick !== id ? [id, pick] : [id];
}

/* Muchos diseños escriben sus colores a mano (#14161B para el texto, #fff para
   la superficie). Para que el tema oscuro no los deje ilegibles se reescriben
   SOLO esos neutros, y solo cuando el diseño nació en claro. Los colores con
   saturación nunca se tocan. */
const INK_HEX = /#(?:14161B|111111|1A1A1A|0F172A|0B0B0B|14151C|1C1C1E)\b/gi;
const MUT_HEX = /#(?:6B7280|8A8A8A|9AA0AA|8E8E93|9BA3B4|777|999999)\b/gi;

function contentFields(html) {
  const root = document.createElement("template"); root.innerHTML = html;
  const fields = [];
  const walk = document.createTreeWalker(root.content, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walk.nextNode())) {
    if (node.textContent.trim() && !node.parentElement.closest("svg,style,script")) {
      const target = node;
      fields.push({ value: node.textContent.trim(), label: "Texto", set: v => { target.textContent = v; } });
    }
  }
  root.content.querySelectorAll("input[placeholder],textarea[placeholder]").forEach(el => {
    fields.push({ value: el.getAttribute("placeholder"), label: "Placeholder", set: v => el.setAttribute("placeholder", v) });
  });
  return { root, fields: fields.slice(0, 200) };
}
function partsFor(entry, state = S) {
  const p = designParts(entry);
  const original = ENTRY[entry.id];
  if (state.theme === "dark" && (!original || original.mode !== "dark")) {
    const b = brand(state);
    p.css = p.css.replace(INK_HEX,b.ink).replace(MUT_HEX,b.mut).replace(/(background(?:-color)?\s*:\s*)#(?:fff|ffffff)\b/gi,"$1" + b.sur);
    p.html = p.html.replace(INK_HEX,b.ink).replace(MUT_HEX,b.mut);
  }
  const values = state.content[entry.id];
  if (values) {
    const parsed = contentFields(p.html);
    parsed.fields.forEach((f,i) => { if (typeof values[i] === "string") f.set(values[i]); });
    p.html = parsed.root.innerHTML;
  }
  return studioApply(p,entry,state);
}

function shadowFor(entry, state = S) {
  const p = partsFor(entry, state);
  return "<style>" + SHADOW_BASE + p.css + "</style>" + p.html;
}

function pvNode(entry, state = S) {
  const host = document.createElement("div");
  host.className = "pv";
  const sh = host.attachShadow({ mode: "open" });
  sh.innerHTML = shadowFor(entry, state);
  sh.addEventListener("click", ev => { if (ev.target.closest("a")) ev.preventDefault(); });
  return host;
}

function renderScreen() {
  const p = brand();
  screenEl.style.background = p.page;
  const gap = S.density === "compacta" ? "9px" : "15px";
  scrollEl.style.gap = gap;
  scrollEl.innerHTML = "";
  dockEl.innerHTML = ""; dockEl.tabIndex = 0; dockEl.setAttribute("role","button"); dockEl.setAttribute("aria-label","Editar barra inferior");

  SLOTS.forEach(s => {
    const id = S.blocks[s.key];
    if (!id || S.hidden[s.key]) return;
    if (s.pinned) {
      dockEl.dataset.slot = s.key;
      dockEl.appendChild(pvNode(styled(id)));
      dockEl.style.background = "linear-gradient(to top," + p.page + " 55%, transparent)";
      return;
    }
    const wrap = document.createElement("div");
    wrap.dataset.slot = s.key;
    wrap.tabIndex = 0; wrap.setAttribute("role", "button"); wrap.setAttribute("aria-label", "Editar " + s.label);
    const pair = s.type === "grid2" ? cardPair(id) : [id];
    wrap.className = "pv" + (pair.length > 1 ? " grid2" : "");
    pair.forEach(cid => wrap.appendChild(pvNode(styled(cid))));
    scrollEl.appendChild(wrap);
  });

  const n = SLOTS.filter(s => S.blocks[s.key] && !S.hidden[s.key]).length;
  $("canvasMeta").textContent = n + " bloques · 390 × 760";
  $("canvasLabel").textContent = "Vivo · " + (VERTICALS.find(v => v.id === S.vertical) || {}).label;
  syncCanvasSelection();
}

/* ───────── Tres propuestas ─────────
   Tres combinaciones distintas con las recetas del sector: A) la primera opción de
   cada bloque, B) la segunda con los acentos intercambiados, C) la tercera en el tema
   contrario. Los bloques con candado se conservan en las tres. Nada cambia hasta elegir. */
const PROPOSAL_NAMES = ["Propuesta A · Clásica", "Propuesta B · Alternativa", "Propuesta C · Contraste"];
function proposalState(i) {
  const st = JSON.parse(JSON.stringify(S));
  const rec = RECIPES[S.vertical] || {};
  SLOTS.forEach(sl => {
    if (S.locked[sl.key] && S.blocks[sl.key]) return;
    const c = rec[sl.key] || [];
    const id = c.length ? c[i % c.length] : null;
    st.blocks[sl.key] = id; st.hidden[sl.key] = !id;
  });
  if (["enc-3", "enc-5"].includes(st.blocks.header) && st.blocks.search && !S.locked.search) st.hidden.search = true;
  if (i === 1) st.palette = { ...st.palette, acc: S.palette.acc2, acc2: S.palette.acc };
  if (i === 2) {
    const v = VERTICALS.find(x => x.id === S.vertical) || VERTICALS[0];
    st.theme = S.theme === "dark" ? "light" : "dark";
    st.palette = { ...st.palette, page: st.theme === "dark" ? (isDarkish(v.page) ? v.page : "#0E1116") : lightenPage(isDarkish(S.palette.page) ? "#F4F5F8" : S.palette.page) };
  }
  return st;
}
function proposalScreen(st) {
  const screen = document.createElement("div"); screen.className = "prop-screen";
  screen.style.background = brand(st).page;
  const scroll = document.createElement("div"); scroll.className = "prop-scroll"; scroll.style.gap = st.density === "compacta" ? "9px" : "15px";
  let dockNode = null;
  SLOTS.forEach(sl => {
    const id = st.blocks[sl.key];
    if (!id || st.hidden[sl.key] || !ENTRY[id]) return;
    if (sl.pinned) { dockNode = pvNode(styled(id, st), st); dockNode.classList.add("prop-dock"); return; }
    const wrap = document.createElement("div");
    const pair = sl.type === "grid2" ? cardPair(id) : [id];
    wrap.className = "pv" + (pair.length > 1 ? " grid2" : "");
    pair.forEach(cid => { const e = styled(cid, st); if (e) wrap.appendChild(pvNode(e, st)); });
    scroll.appendChild(wrap);
  });
  screen.appendChild(scroll); if (dockNode) screen.appendChild(dockNode);
  const frame = document.createElement("div"); frame.className = "prop-frame"; frame.appendChild(screen);
  if (globalThis.ResizeObserver) new ResizeObserver(() => { screen.style.transform = "scale(" + (frame.clientWidth / 390) + ")"; }).observe(frame);
  return frame;
}
let proposalStates = [];
function openProposals() {
  proposalStates = [0, 1, 2].map(proposalState);
  const list = $("proposalList"); list.replaceChildren();
  proposalStates.forEach((st, i) => {
    const card = document.createElement("article"); card.className = "proposal"; card.dataset.proposal = i;
    const h = document.createElement("h4"); h.textContent = PROPOSAL_NAMES[i];
    const meta = document.createElement("p"); meta.className = "hint";
    meta.textContent = (st.theme === "dark" ? "Tema oscuro" : "Tema claro") + " · " + SLOTS.filter(sl => st.blocks[sl.key] && !st.hidden[sl.key]).length + " bloques" + (SLOTS.some(sl => S.locked[sl.key]) ? " · conserva tus candados" : "");
    const btn = document.createElement("button"); btn.className = "btn primary sm"; btn.dataset.act = "pickproposal"; btn.dataset.i = i; btn.textContent = "Quedarme con la " + "ABC"[i];
    card.append(h, meta, proposalScreen(st), btn); list.appendChild(card);
  });
  $("mProposals").hidden = false;
  list.querySelector("button").focus({ preventScroll: true }); list.closest(".body").scrollTop = 0;
}
function closeProposals() { $("mProposals").hidden = true; }
function pickProposal(i) {
  const st = proposalStates[i]; if (!st) return;
  S.blocks = st.blocks; S.hidden = st.hidden; S.palette = st.palette; S.theme = st.theme;
  closeProposals(); renderAll(); toast(PROPOSAL_NAMES[i].split(" · ")[0] + " aplicada. Puedes deshacer.");
}
$("btnProposals").addEventListener("click", openProposals);
$("mProposals").addEventListener("click", ev => { const b = ev.target.closest('[data-act="pickproposal"]'); if (b) pickProposal(+b.dataset.i); });
$("mProposals").addEventListener("keydown", ev => {
  if (ev.key !== "Tab") return;
  const f = [...$("mProposals").querySelectorAll("button")].filter(b => !b.hidden), first = f[0], last = f[f.length - 1];
  if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
  else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
});
new MutationObserver(() => { if ($("mProposals").hidden) $("btnProposals").focus({ preventScroll: true }); }).observe($("mProposals"), { attributes: true, attributeFilter: ["hidden"] });

function renderAll() { renderVlabs(); renderBlocks(); renderSwatches(); renderScreen(); renderReview(); save(); }

/* ───────── Selector de diseños ───────── */
let pickerSlot = null, pickerQ = "", pickerSelected = null;
function openPicker(slotKey) {
  pickerSlot = slotKey;
  $("pickerSlotChoice").innerHTML = SLOTS.map(s => '<option value="' + s.key + '">' + esc(s.label) + '</option>').join("");
  $("pickerSlotChoice").value = slotKey;
  pickerQ = "";
  pickerSelected = S.blocks[slotKey];
  $("pickerMode").value = "all"; $("pickerSort").value = "catalog";
  const slot = SLOTS.find(s => s.key === slotKey);
  $("pickerTitle").textContent = "Cambiar " + slot.label.toLowerCase();
  $("pickerSub").textContent = "Diseños de " + slot.tab + " con tu paleta aplicada";
  $("pickerSearch").value = "";
  $("mPicker").hidden = false;
  renderPicker();
  renderPickerDetail();
  $("pickerSearch").focus();
}

function renderPicker() {
  const slot = SLOTS.find(s => s.key === pickerSlot);
  const q = norm(pickerQ);
  const words = q.split(/\s+/).filter(Boolean);
  const all = SEED.filter(e => e.tab === slot.tab);
  const mode = $("pickerMode").value, sort = $("pickerSort").value;
  const list = all.filter(e => (mode === "all" || (e.mode === "dark" ? "dark" : "light") === mode) && words.every(w => norm(e.name + " " + e.ref + " " + e.desc).includes(w)));
  if (sort === "name") list.sort((a,b) => a.name.localeCompare(b.name, "es"));
  if (sort === "current") list.sort((a,b) => Number(b.id === S.blocks[pickerSlot]) - Number(a.id === S.blocks[pickerSlot]));
  $("pickerCount").textContent = list.length + " de " + all.length + " diseños";
  const current = S.blocks[pickerSlot];
  const grid = $("pickerGrid");
  grid.innerHTML = list.length ? "" : '<p class="empty-note">Sin resultados para «' + esc(pickerQ) + '».</p>';
  list.forEach(e => {
    const btn = document.createElement("button");
    btn.className = "pick" + (e.id === pickerSelected ? " on" : "");
    btn.dataset.pick = e.id;
    btn.setAttribute("aria-pressed", e.id === pickerSelected);
    btn.setAttribute("aria-label", "Comparar " + e.name + (e.id === current ? " · actual" : ""));
    const shot = document.createElement("div");
    shot.className = "shot";
    shot.style.background = brand().page;
    const box = document.createElement("div");
    box.style.width = "240px";
    box.style.pointerEvents = "none";
    box.style.transformOrigin = "top center";
    box.appendChild(pvNode(styled(e.id)));
    shot.appendChild(box);
    const lbl = document.createElement("div");
    lbl.className = "lbl";
    lbl.innerHTML = "<b>" + esc(e.name) + (e.id === current ? " · Actual" : "") + '</b><span class="m">' + (e.mode === "dark" ? "oscuro" : "claro") + "</span>";
    btn.appendChild(shot); btn.appendChild(lbl);
    grid.appendChild(btn);
    requestAnimationFrame(() => {
      const h = box.getBoundingClientRect().height / (box.__s || 1);
      const avail = shot.clientHeight - 16;
      const s = Math.min(.78, avail / Math.max(40, h));
      box.__s = s;
      box.style.transform = "scale(" + s.toFixed(3) + ")";
    });
  });
}
function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

/* Contenido seguro: se sustituyen nodos de texto, nunca HTML del usuario. */
let contentIds = [], contentSlot = null;
function openContent(slot) {
  const id = S.blocks[slot]; if (!ENTRY[id]) return;
  contentSlot = slot;
  contentIds = slot === "cards" ? cardPair(id) : [id];
  renderContent();
  studioMediaMessage("");
  $("mContent").hidden = false;
  syncInspectorMode(); renderBlocks(); syncCanvasSelection();
  const first = $("contentFields").querySelector("textarea"); if (first) first.focus();
}
function closeContent() {
  $("mContent").hidden = true; renderAll(); syncCanvasSelection();
  const button = blocksEl.querySelector('[data-slot="' + contentSlot + '"] [data-act="editcontent"]');
  if (button) button.focus();
}
$("mContent").addEventListener("keydown", ev => {
  if (ev.key === "Escape") { ev.stopPropagation(); closeContent(); return; }
  if (ev.key !== "Tab") return;
  const inputs = [...$("mContent").querySelectorAll("textarea,input,button")];
  const first = inputs[0], last = inputs[inputs.length - 1];
  if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
  else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
});
$("mContent").addEventListener("click", ev => { if (ev.target === $("mContent") && innerWidth < 1200) closeContent(); });
function renderContent() {
  const host = $("contentFields"); host.replaceChildren();
  contentIds.forEach(id => {
    const h = document.createElement("h4"); h.textContent = ENTRY[id].name; host.appendChild(h);
    const parsed = contentFields(designParts(styled(id)).html);
    if (!parsed.fields.length) { const note = document.createElement("p"); note.textContent = "Este diseño no contiene textos editables."; host.appendChild(note); }
    parsed.fields.forEach((f, i) => {
      const label = document.createElement("label"); label.className = "content-field";
      const caption = document.createElement("span"); caption.textContent = f.label + " " + (i + 1) + " · " + f.value.slice(0, 65);
      const input = document.createElement("textarea"); input.maxLength = 500; input.rows = 2;
      input.dataset.id = id; input.dataset.index = i;
      input.value = typeof (S.content[id] || [])[i] === "string" ? S.content[id][i] : f.value;
      label.append(caption, input); host.appendChild(label);
    });
    studioMediaFields(id, host);
  });
}
$("contentFields").addEventListener("input", ev => {
  const el = ev.target.closest("textarea[data-id]"); if (!el || !ENTRY[el.dataset.id]) return;
  const id = el.dataset.id, i = Number(el.dataset.index);
  if (!Number.isInteger(i) || i < 0 || i >= 200) return;
  if (!S.content[id]) S.content[id] = [];
  S.content[id][i] = el.value.slice(0, 500);
  renderScreen(); save("content:" + id + ":" + i);
});
$("mContent").addEventListener("click", ev => {
  const b = ev.target.closest("[data-act]"); if (!b) return;
  if (b.dataset.act === "resetcontent") {
    contentIds.forEach(id => { delete S.content[id]; delete S.assets[id]; }); renderContent(); renderAll(); toast("Contenido original restaurado");
  }
  if (b.dataset.act === "donecontent") {
    closeContent();
    toast("Contenido guardado");
  }
});

/* ───────── Exportar ───────── */
let codeTab = "html";

function esc_(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function exportHTML() {
  const p = brand();
  const gap = S.density === "compacta" ? "9px" : "15px";
  const body = [];
  SLOTS.forEach(s => {
    const id = S.blocks[s.key];
    if (!id || S.hidden[s.key]) return;
    const entry = styled(id);
    const parts = partsFor(entry);
    if (s.pinned) {
      body.push('  <div class="dock">\n' + blockMarkup(parts, "    ") + "\n  </div>");
      return;
    }
    if (s.type === "grid2") {
      const pair = cardPair(id);
      body.push('  <div class="' + (pair.length > 1 ? "grid2" : "stack") + '">\n' +
        pair.map(pid => blockMarkup(partsFor(styled(pid)), "    ")).join("\n") + "\n  </div>");
      return;
    }
    body.push(blockMarkup(parts, "  "));
  });

  return '<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    "<title>Estilos · pantalla generada</title>\n<style>\n" +
    "*{box-sizing:border-box;margin:0}\n" +
    "body{background:" + p.page + ";font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;justify-content:center}\n" +
    ".screen{width:100%;max-width:390px;min-height:100vh;padding:34px 16px 96px;display:flex;flex-direction:column;gap:" + gap + ";position:relative}\n" +
    ".grid2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;align-items:start}\n.stack{display:flex;flex-direction:column;gap:10px}\n" +
    ".dock{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:390px;padding:10px 12px 14px;background:linear-gradient(to top," + p.page + " 55%,transparent)}\n" +
    "estilos-block{display:block}\n" +
    "</style>\n</head>\n<body>\n<div class=\"screen\">\n" + body.join("\n") + "\n</div>\n</body>\n</html>\n";
}

function blockMarkup(parts, indent) {
  return indent + "<estilos-block>\n" +
    indent + "  <template shadowrootmode=\"open\">\n" +
    indent + "    <style>" + SHADOW_BASE + parts.css + "</style>\n" +
    indent + "    " + parts.html.trim().split("\n").join("\n" + indent + "    ") + "\n" +
    indent + "  </template>\n" +
    indent + "</estilos-block>";
}

function exportTokens() {
  const p = brand();
  return JSON.stringify({
    meta: { generado: new Date().toISOString().slice(0, 10), estilos: APP_VERSION, sector: S.vertical },
    color: {
      accent: p.acc, accent2: p.acc2, background: p.page,
      surface: p.sur, text: p.ink, textMuted: p.mut, onAccent: p.onacc
    },
    radius: { base: S.radius + "px", small: Math.max(6, S.radius - 6) + "px", pill: "999px" },
    typography: { family: "Plus Jakarta Sans", scale: [12, 14, 16, 20, 26] },
    density: S.density,
    blocks: SLOTS.filter(s => S.blocks[s.key] && !S.hidden[s.key]).map(s => ({ slot: s.key, diseno: ENTRY[S.blocks[s.key]].name, variante: ENTRY[S.blocks[s.key]].v }))
  }, null, 2);
}

function exportPrompt() {
  const lines = [];
  lines.push("Genera una pantalla móvil con este sistema de diseño. " + (S.brief ? "Brief: \"" + S.brief + "\"." : ""));
  lines.push("");
  lines.push("Marca: acento " + brand().acc + ", secundario " + brand().acc2 + ", fondo " + brand().page + ", tema " + (S.theme === "dark" ? "oscuro" : "claro") + ", redondeo " + S.radius + "px, densidad " + S.density + ".");
  lines.push("");
  lines.push("Bloques, en orden:");
  SLOTS.forEach((s, i) => {
    const id = S.blocks[s.key];
    if (!id || S.hidden[s.key]) return;
    const e = ENTRY[id];
    lines.push((i + 1) + ". " + s.label + ": " + e.name + " — " + e.desc);
  });
  lines.push("");
  lines.push("Reglas: una sola familia tipográfica, máximo dos colores de marca, 8 px de retícula, contraste AA y botones de al menos 44 px de alto.");
  return lines.join("\n");
}

function codeFor(tab) { return tab === "tokens" ? exportTokens() : tab === "prompt" ? exportPrompt() : exportHTML(); }

function openCode(tab) {
  codeTab = tab || "html";
  document.querySelectorAll("[data-code]").forEach(b => b.classList.toggle("on", b.dataset.code === codeTab));
  $("codeOut").textContent = codeFor(codeTab);
  $("mCode").hidden = false;
}

/* ───────── Utilidades de interfaz ───────── */
let toastT;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 1800);
}
function themeIcon() {
  document.querySelector('meta[name="theme-color"]').content = document.documentElement.dataset.theme === "dark" ? "#29223F" : "#DAD7EC";
  $("btnTheme").innerHTML = ic(document.documentElement.dataset.theme === "dark" ? "sun" : "moon", 17);
}

/* Entorno Studio: selección directa y propiedades modeless en escritorio. */
function syncCanvasSelection() {
  [scrollEl,dockEl].forEach(root => {
    [root,...root.querySelectorAll("[data-slot]")].forEach(el => el.classList.toggle("is-selected", !!el.dataset.slot && el.dataset.slot === contentSlot && !$("mContent").hidden));
  });
}
function syncInspectorMode() {
  const projectSheet = $("mProjects").querySelector(".sheet");
  projectSheet.setAttribute("role", innerWidth >= 1200 ? "region" : "dialog");
  if (innerWidth >= 1200) projectSheet.removeAttribute("aria-modal"); else projectSheet.setAttribute("aria-modal","true");
  const wide = innerWidth >= 1200, sheet = $("mContent").querySelector(".sheet");
  sheet.setAttribute("role", wide ? "complementary" : "dialog");
  if (wide) sheet.removeAttribute("aria-modal"); else sheet.setAttribute("aria-modal", "true");
}
addEventListener("resize", syncInspectorMode);
$("mContent").addEventListener("keydown", ev => {
  if (innerWidth >= 1200 && ev.key === "Tab") ev.stopImmediatePropagation();
}, true);
document.addEventListener("click", ev => {
  const b = ev.target.closest("[data-studio-nav]"); if (!b) return;
  if (b.dataset.studioNav === "projects") $("btnProjects").click();
  if (b.dataset.studioNav === "add") openPicker(contentSlot || "cards");
  if (b.dataset.studioNav === "closeinspector") closeContent();
});
$("pickerSlotChoice").addEventListener("change", ev => openPicker(ev.target.value));
[scrollEl,dockEl].forEach(host => {
  host.addEventListener("click", ev => {
    const block = ev.target.closest("[data-slot]"); if (block) openContent(block.dataset.slot);
  });
  host.addEventListener("keydown", ev => {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    const block = ev.target.closest("[data-slot]"); if (block) { ev.preventDefault(); openContent(block.dataset.slot); }
  });
});

/* ───────── Eventos ───────── */
briefEl.addEventListener("input", () => {
  S.brief = briefEl.value.slice(0, 240);
  $("briefCount").textContent = S.brief.length + "/240";
  const d = detect(S.brief);
  if (d.out.length) readout.innerHTML = "El agente leerá: <b>" + esc(d.out.join(" · ")) + "</b>";
  save("brief");
});

vlabsEl.addEventListener("click", ev => {
  const b = ev.target.closest("[data-v]"); if (!b) return;
  const v = VERTICALS.find(x => x.id === b.dataset.v);
  S.vertical = v.id;
  S.theme = v.theme;
  S.palette = { acc: v.acc, acc2: v.acc2, page: v.page };
  applyRecipe();
  readout.innerHTML = "Sector <b>" + esc(v.label.toLowerCase()) + "</b>, tema " + (S.theme === "dark" ? "oscuro" : "claro") + ". Afina los bloques a la izquierda.";
});

let draggedSlot = null;
blocksEl.addEventListener("dragstart", ev => {
  const row = ev.target.closest(".blk"); if (!row) return;
  draggedSlot = row.dataset.slot; ev.dataTransfer.effectAllowed = "move"; ev.dataTransfer.setData("text/plain", draggedSlot);
});
blocksEl.addEventListener("dragover", ev => {
  const row = ev.target.closest(".blk"); if (!row || !draggedSlot || draggedSlot === row.dataset.slot) return;
  ev.preventDefault(); ev.dataTransfer.dropEffect = "move";
  blocksEl.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over")); row.classList.add("drag-over");
});
blocksEl.addEventListener("dragend", () => { draggedSlot = null; blocksEl.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over")); });
blocksEl.addEventListener("drop", ev => {
  const row = ev.target.closest(".blk"); if (!row || !draggedSlot) return;
  ev.preventDefault();
  const from = SLOTS.findIndex(s => s.key === draggedSlot), to = SLOTS.findIndex(s => s.key === row.dataset.slot);
  if (from >= 0 && to >= 0 && from !== to) { const [item] = SLOTS.splice(from,1); SLOTS.splice(to,0,item); renderAll(); }
  draggedSlot = null; blocksEl.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
});

blocksEl.addEventListener("click", ev => {
  const row = ev.target.closest(".blk");
  if (row && !ev.target.closest("[data-act]")) return openContent(row.dataset.slot);
  const b = ev.target.closest("[data-act]"); if (!b) return;
  const slot = b.dataset.slot;
  if (b.dataset.act === "editcontent") return openContent(slot);
  if (b.dataset.act === "change") return openPicker(slot);
  if (b.dataset.act === "lock") { S.locked[slot] = !S.locked[slot]; return renderAll(); }
  if (b.dataset.act === "toggle") { S.hidden[slot] = !S.hidden[slot]; return renderAll(); }
  if (b.dataset.act === "up" || b.dataset.act === "down") {
    const idx = SLOTS.findIndex(s => s.key === slot);
    const to = b.dataset.act === "up" ? idx - 1 : idx + 1;
    if (to < 0 || to >= SLOTS.length) return;
    const tmp = SLOTS[idx]; SLOTS[idx] = SLOTS[to]; SLOTS[to] = tmp;
    return renderAll();
  }
});

$("swatches").addEventListener("input", ev => {
  const inp = ev.target.closest("[data-color]"); if (!inp) return;
  S.palette[inp.dataset.color] = inp.value.toUpperCase();
  renderSwatches(); renderScreen(); renderReview(); save("color:" + inp.dataset.color);
});
$("radius").addEventListener("input", ev => { S.radius = +ev.target.value; $("radiusVal").textContent = S.radius; renderSwatches(); renderBlocks(); renderScreen(); save("radius"); });
document.addEventListener("click", ev => {
  const th = ev.target.closest("[data-dna-theme]");
  if (th) { S.theme = th.dataset.dnaTheme; renderAll(); }
  const dn = ev.target.closest("[data-density]");
  if (dn) { S.density = dn.dataset.density; renderAll(); }
});

$("btnGenerate").addEventListener("click", () => generate(true));
$("btnShuffle").addEventListener("click", () => generate(false));
$("btnExport").addEventListener("click", () => openCode("html"));
$("mExport").addEventListener("click", () => openCode("html"));
$("btnCode").addEventListener("click", () => openCode(codeTab));

$("btnTheme").addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme === "dark";
  document.documentElement.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("estilos-studio-theme", dark ? "light" : "dark"); localStorage.setItem("estilos-theme", dark ? "light" : "dark"); } catch (e) {}
  themeIcon();
});

$("pickerSearch").addEventListener("input", ev => { pickerQ = ev.target.value; renderPicker(); });
$("pickerGrid").addEventListener("click", ev => {
  const b = ev.target.closest("[data-pick]"); if (!b) return;
  pickerSelected = b.dataset.pick;
  $("pickerGrid").querySelectorAll(".pick").forEach(el => {
    el.classList.toggle("on", el.dataset.pick === pickerSelected);
    el.setAttribute("aria-pressed", el.dataset.pick === pickerSelected);
  });
  renderPickerDetail();
});
["pickerMode", "pickerSort"].forEach(id => $(id).addEventListener("change", renderPicker));
function renderPickerDetail() {
  const e = ENTRY[pickerSelected];
  $("candidateName").textContent = e ? e.name : "Elige un diseño para compararlo";
  $("candidateDesc").textContent = e ? (e.desc || e.ref || "") : "";
  [["pickerCurrent", S.blocks[pickerSlot]], ["pickerCandidate", pickerSelected]].forEach(([target,id]) => {
    const host = $(target); host.replaceChildren(); host.style.background = brand().page;
    if (ENTRY[id]) host.appendChild(pvNode(styled(id)));
    else host.textContent = "Sin asignar";
  });
  $("pickerApply").disabled = !e || (pickerSelected === S.blocks[pickerSlot] && !S.hidden[pickerSlot]);
}
function closePicker() {
  $("mPicker").hidden = true;
  const button = blocksEl.querySelector('[data-slot="' + pickerSlot + '"] [data-act="change"]');
  if (button) button.focus();
}
$("mPicker").addEventListener("click", ev => {
  if (ev.target === $("mPicker")) { closePicker(); return; }
  const b = ev.target.closest("[data-act]"); if (!b) return;
  if (b.dataset.act === "pickerclose") closePicker();
  if (b.dataset.act === "pickerreset") {
    pickerQ = ""; $("pickerSearch").value = ""; $("pickerMode").value = "all"; $("pickerSort").value = "catalog"; renderPicker();
  }
  if (b.dataset.act === "pickerapply" && !b.disabled) {
    const slot = SLOTS.find(s => s.key === pickerSlot), entry = ENTRY[pickerSelected];
    if (!slot || !entry || entry.tab !== slot.tab) return;
    S.blocks[pickerSlot] = pickerSelected; S.hidden[pickerSlot] = false;
    renderAll(); closePicker(); toast("Bloque actualizado");
  }
});
$("mPicker").addEventListener("keydown", ev => {
  if (ev.key === "Escape") { ev.stopPropagation(); closePicker(); return; }
  if (ev.key !== "Tab") return;
  const controls = [...$("mPicker").querySelectorAll("button,input,select")].filter(el => !el.disabled && el.getClientRects().length);
  const first = controls[0], last = controls[controls.length - 1];
  if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
  else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
});

$("codeTabs").addEventListener("click", ev => {
  const b = ev.target.closest("[data-code]"); if (!b) return;
  codeTab = b.dataset.code;
  document.querySelectorAll("[data-code]").forEach(x => x.classList.toggle("on", x === b));
  $("codeOut").textContent = codeFor(codeTab);
});
$("btnCopy").addEventListener("click", async () => {
  const txt = codeFor(codeTab);
  try { await navigator.clipboard.writeText(txt); toast("Copiado"); }
  catch (e) {
    const ta = document.createElement("textarea");
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("Copiado"); } catch (e2) { toast("No se pudo copiar"); }
    ta.remove();
  }
});
$("btnDownload").addEventListener("click", () => {
  const isHtml = codeTab === "html";
  const blob = new Blob([codeFor(codeTab)], { type: isHtml ? "text/html" : "text/plain" });
  const fileName = isHtml ? "estilos-pantalla.html" : codeTab === "tokens" ? "estilos-tokens.json" : "estilos-prompt.txt";
  if (nativeSave(blob, fileName)) { toast("Elige dónde guardar"); return; }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast("Descargado");
});

document.addEventListener("click", ev => {
  if (ev.target.closest("[data-close]")) { ev.target.closest(".modal").hidden = true; }
  if (ev.target.classList.contains("modal") && !(innerWidth >= 1200 && ["mProjects","mContent"].includes(ev.target.id))) ev.target.hidden = true;
});
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape") { if (!$("mProjects").hidden) closeProjects(); if (!$("mContent").hidden) closeContent(); document.querySelectorAll(".modal").forEach(m => m.hidden = true); }
});

/* Pestañas: llevan el foco a la sección correspondiente */
document.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll("[data-nav]").forEach(x => { x.classList.remove("on"); x.setAttribute("aria-selected", "false"); });
  b.classList.add("on"); b.setAttribute("aria-selected", "true");
  const target = b.dataset.nav === "marca" ? document.querySelectorAll(".card")[2]
    : b.dataset.nav === "bloques" ? document.querySelectorAll(".card")[1]
    : document.querySelectorAll(".card")[0];
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  if (innerWidth <= 720) { document.body.dataset.pane = "side"; syncPane(); }
}));

/* Móvil: ajustes / vista */
function syncPane() {
  const canvas = document.body.dataset.pane === "canvas";
  document.querySelectorAll("[data-pane-btn]").forEach(b => b.classList.toggle("on", (b.dataset.paneBtn === "canvas") === canvas));
}
document.querySelectorAll("[data-pane-btn]").forEach(b => b.addEventListener("click", () => {
  document.body.dataset.pane = b.dataset.paneBtn; syncPane();
  requestAnimationFrame(fitPhone);   // el lienzo estaba oculto: sin medidas
}));

/* Escala del teléfono para que siempre quepa */
function fitPhone() {
  const wrap = $("stagewrap"), phone = $("phone");
  if (!wrap || !phone) return;
  const availH = wrap.clientHeight - 24;
  const availW = wrap.clientWidth - 24;
  const scale = Math.min(1, availH / 780, availW / 410);
  phone.style.transform = "scale(" + Math.max(.55, scale) + ")";
  phone.style.margin = scale < 1 ? ((780 * (scale - 1)) / 2) + "px " + ((390 * (scale - 1)) / 2) + "px" : "0";
}
addEventListener("resize", fitPhone);

/* ───────── Arranque ───────── */
/* ───────── Revisión: comprueba la pantalla antes de exportarla ───────── */
function reviewChecks() {
  const vis = SLOTS.filter(s => S.blocks[s.key] && !S.hidden[s.key]).map(s => s.key);
  const has = k => vis.includes(k);
  const b = brand(), out = [];
  const ratioRow = (title, ratio, badTip) => {
    const r = ratio.toFixed(1) + ":1";
    if (ratio >= 4.5) return ["ok", title, r + " · cumple AA para texto normal."];
    if (ratio >= 3) return ["warn", title, r + " · solo cumple AA para texto grande. " + badTip];
    return ["fail", title, r + " · no se lee bien. " + badTip];
  };
  out.push(has("header") && has("nav")
    ? ["ok", "Orientación", "Encabezado y barra inferior: el usuario sabe dónde está y a dónde puede ir."]
    : ["warn", "Orientación", "Añade un encabezado y una barra inferior para dar puntos de referencia."]);
  out.push(has("cta")
    ? ["ok", "Acción principal", "Un botón marca el siguiente paso."]
    : ["warn", "Acción principal", "Sin botón la pantalla no sugiere ninguna acción."]);
  out.push(ratioRow("Texto sobre el acento", contrast(b.acc, b.onacc), "Elige un acento más oscuro o más claro."));
  out.push(ratioRow("Texto principal", contrast(b.ink, b.sur), "Revisa el color del texto o del fondo."));
  out.push(ratioRow("Texto secundario", contrast(b.mut, b.sur), "Usa un gris más oscuro para las notas."));
  const sizes = vis.flatMap(k => [...partsFor(styled(S.blocks[k])).css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m => +m[1]));
  const small = sizes.length ? Math.min(...sizes) : 99;
  out.push(small >= 11
    ? ["ok", "Texto legible", "Ningún texto baja de 11 px."]
    : ["warn", "Texto legible", "Hay texto de " + small + " px. Cambia ese bloque por otro diseño."]);
  return out;
}
function renderReview() {
  const items = reviewChecks();
  $("reviewScore").textContent = items.filter(i => i[0] === "ok").length + "/" + items.length;
  $("checks").innerHTML = items.map(([k, t, m]) => '<li class="' + k + '"><span class="ci" aria-hidden="true">' + ic(k === "ok" ? "check" : k === "warn" ? "alert" : "close", 14) + '</span><div><b>' + esc(t) + '</b><small>' + esc(m) + '</small></div></li>').join("");
}

(function init() {
  $("briefPanel").open = innerWidth < 1200;
  const restored = load();
  if (!restored) { applyRecipe(true); }
  briefEl.value = S.brief;
  $("briefCount").textContent = S.brief.length + "/240";
  // el tema de la interfaz es independiente del tema del diseño
  try {
    const ui = localStorage.getItem("estilos-theme") || localStorage.getItem("estilos-studio-theme") || "light";
    document.documentElement.dataset.theme = ui === "light" ? "light" : ui === "dark" ? "dark" : (window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  } catch (e) { document.documentElement.dataset.theme = "dark"; }
  themeIcon();
  syncInspectorMode();
  renderAll();
  historyStates = [JSON.stringify(S)]; historyIndex = 0; historyReady = true; historyButtons();
  fitPhone();
  requestAnimationFrame(fitPhone);
  if (new URLSearchParams(location.search).get("projects") === "1") {
    openProjects();
    const requested = new URLSearchParams(location.search).get("project");
    if (requested && projects.some(p => p.id === requested)) {
      projectPending = {id:requested,type:"openproject"}; renderProjects();
      const row = [...$("projectList").children].find(el => el.dataset.project === requested);
      if (row) row.scrollIntoView({block:"nearest"});
    }
  }
})();
