/* Copia automática en un archivo (File System Access API: Chrome y Edge de escritorio).
   El usuario elige un archivo una vez; el manejador se guarda en IndexedDB y, a partir de ahí,
   cada cambio se vuelca (con una espera de unos segundos) en ese mismo archivo.
   Tras cerrar el navegador, Chrome pide confirmar el permiso con un gesto del usuario
   («Reactivar» en Ajustes); hasta entonces la copia queda en pausa y la app lo avisa. */
const AutoBackup = (function () {
  const DB = "estilos-autobackup", ST = "h", KEY = "handle", WAIT = 4000;
  const supported = typeof window.showSaveFilePicker === "function";
  let handle = null, timer = 0, dirty = false, busy = false;
  const st = { perm: "none", last: 0, error: "", name: "" };

  function open() {
    return new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error("Sin IndexedDB"));
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(ST);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  function tx(mode, fn) {
    return open().then(db => new Promise((res, rej) => {
      const t = db.transaction(ST, mode), out = fn(t.objectStore(ST));
      t.oncomplete = () => res(out && "result" in out ? out.result : undefined);
      t.onerror = t.onabort = () => rej(t.error || new Error("IndexedDB"));
    }));
  }
  async function perm(request) {
    if (!handle) return "none";
    try {
      const o = { mode: "readwrite" };
      st.perm = (request ? await handle.requestPermission(o) : await handle.queryPermission(o)) || "denied";
    } catch (e) { st.perm = "denied"; }
    return st.perm;
  }
  async function load() {
    if (!supported) return;
    try { handle = (await tx("readonly", s => s.get(KEY))) || null; } catch (e) { handle = null; }
    if (handle) { st.name = handle.name || ""; await perm(false); }
  }
  async function write() {
    if (!handle || busy || st.perm !== "granted") return false;
    busy = true;
    try {
      const text = await exportJSON();
      const w = await handle.createWritable(); await w.write(text); await w.close();
      st.last = Date.now(); st.error = ""; dirty = false; return true;
    } catch (e) { st.error = String(e && e.message || e).slice(0, 120); return false; }
    finally { busy = false; }
  }
  function touch() {
    if (!handle) return;
    dirty = true; clearTimeout(timer);
    timer = setTimeout(() => { if (dirty) write(); }, WAIT);
  }
  return {
    supported,
    load, write, touch,
    get active() { return !!handle; },
    get state() { return Object.assign({}, st); },
    flush() { clearTimeout(timer); return dirty ? write() : Promise.resolve(false); },
    async choose() {
      const h = await window.showSaveFilePicker({ suggestedName: "estilos-copia.json", types: [{ description: "Copia de Estilos", accept: { "application/json": [".json"] } }] });
      handle = h; st.name = h.name || ""; st.error = "";
      await tx("readwrite", s => s.put(h, KEY));
      await perm(false); if (st.perm !== "granted") await perm(true);
      return write();
    },
    async reconnect() { await perm(true); return write(); },
    async stop() { handle = null; clearTimeout(timer); dirty = false; st.perm = "none"; st.name = ""; try { await tx("readwrite", s => s.delete(KEY)); } catch (e) { /* ignorar */ } }
  };
})();
document.addEventListener("visibilitychange", () => { if (document.hidden) AutoBackup.flush(); });
