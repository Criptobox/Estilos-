/* Imágenes del constructor.
   El proyecto (builder) se guarda en localStorage, que suele limitarse a ~5 MB. Las fotos
   reemplazadas por el usuario son data URLs de cientos de KB: aquí se sacan a IndexedDB y
   en el JSON del proyecto queda solo una referencia  "idb:<id>".
   En memoria el proyecto sigue llevando las data URLs, así que el resto del código
   (vista previa, exportación, historial) no cambia. */
const MediaStore = (function () {
  const DB = "estilos-media", ST = "media";
  let dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error("Sin IndexedDB"));
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(ST, { keyPath: "id" });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    dbp.catch(() => { dbp = null; });
    return dbp;
  }
  function tx(mode, fn) {
    return open().then(db => new Promise((res, rej) => {
      const t = db.transaction(ST, mode), out = fn(t.objectStore(ST));
      t.oncomplete = () => res(out && "result" in out ? out.result : undefined);
      t.onerror = t.onabort = () => rej(t.error || new Error("IndexedDB"));
    }));
  }
  return {
    all: () => tx("readonly", s => s.getAll()),
    put: (id, data) => tx("readwrite", s => s.put({ id, data })),
    del: id => tx("readwrite", s => s.delete(id))
  };
})();

const mediaCache = new Map();    /* id -> data URL */
let mediaOK = false;             /* true cuando IndexedDB responde: hasta entonces las imágenes se quedan dentro del JSON */
const mediaFailed = new Set();   /* ids que no se pudieron guardar en IndexedDB: se mantienen dentro del JSON */
const mediaIdOf = new Map();     /* data URL -> id (evita volver a calcular el hash en cada guardado) */
const MEDIA_RE = /"data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+"/g;
const MEDIA_REF_RE = /"idb:(m[a-z0-9]+)"/g;

/* Hash de 53 bits (cyrb53): suficiente para distinguir imágenes dentro de un mismo proyecto. */
function mediaHash(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
function isDataImg(v) { return typeof v === "string" && /^data:image\//.test(v); }
function mediaRegister(dataUrl) {
  let id = mediaIdOf.get(dataUrl);
  if (!id) { id = "m" + mediaHash(dataUrl) + dataUrl.length.toString(36); mediaIdOf.set(dataUrl, id); }
  if (!mediaCache.has(id)) { mediaCache.set(id, dataUrl); MediaStore.put(id, dataUrl).catch(() => { mediaFailed.add(id); }); }
  return id;
}
/* JSON con data URLs -> JSON con referencias idb:  (las registra en IndexedDB) */
function mediaStrip(json) {
  if (!mediaOK) return json;
  return json.replace(MEDIA_RE, m => { const id = mediaRegister(m.slice(1, -1)); return mediaFailed.has(id) ? m : '"idb:' + id + '"'; });
}
/* JSON con referencias -> JSON con data URLs (las que aún no se han cargado se dejan como están) */
function mediaInflate(json) { return json.replace(MEDIA_REF_RE, (m, id) => mediaCache.has(id) ? '"' + mediaCache.get(id) + '"' : m); }
function mediaLoadAll() {
  return MediaStore.all().then(rows => { (rows || []).forEach(r => { if (r && isDataImg(r.data)) mediaCache.set(r.id, r.data); }); mediaOK = true; }).catch(() => { /* sin IndexedDB: todo se queda en localStorage, como antes */ });
}
/* Borra de IndexedDB las imágenes que ya no usa nada (proyecto ni historial). */
function mediaCollect(used) {
  return MediaStore.all().then(rows => Promise.all((rows || []).filter(r => !used.has(r.id)).map(r => MediaStore.del(r.id)))).catch(() => { /* ignorar */ });
}
function mediaRefsIn(text) { const s = new Set(); String(text || "").replace(MEDIA_REF_RE, (m, id) => { s.add(id); return m; }); return s; }
