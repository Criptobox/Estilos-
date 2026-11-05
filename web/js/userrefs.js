/* Capturas propias (IndexedDB, solo en este dispositivo) y extracción de paleta. */
const RefStore = (function () {
  const DB = "estilos-refs", ST = "refs";
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
    all: () => tx("readonly", s => s.getAll()).then(l => (l || []).sort((a, b) => b.date - a.date)),
    put: r => tx("readwrite", s => s.put(r)),
    del: id => tx("readwrite", s => s.delete(id))
  };
})();

/* Reduce la imagen (máx. 1400 px) y la guarda como WebP/JPEG para no llenar el almacenamiento. */
function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("Imagen no válida")); i.src = src; });
}
function shrinkImage(file, max) {
  const url = URL.createObjectURL(file);
  return loadImage(url).then(img => {
    const k = Math.min(1, (max || 1400) / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    return new Promise(res => c.toBlob(b => res(b || file), "image/webp", 0.82));
  }).catch(e => { URL.revokeObjectURL(url); throw e; });
}

/* Paleta dominante: muestrea a 80 px, agrupa en cubos de 4 bits por canal y elige
   los más frecuentes que se distingan entre sí (distancia RGB ponderada). */
function extractPalette(img, n) {
  n = n || 6;
  const S = 80, k = Math.min(1, S / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const w = Math.max(1, Math.round((img.naturalWidth || img.width) * k)), h = Math.max(1, Math.round((img.naturalHeight || img.height) * k));
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data, bins = new Map();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const key = (d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | (d[i + 2] >> 4);
    const b = bins.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2]; bins.set(key, b);
  }
  const cands = [...bins.values()].map(b => ({ n: b.n, c: [b.r / b.n, b.g / b.n, b.b / b.n].map(Math.round) }));
  /* Un color saturado poco frecuente (el acento) pesa más que su recuento a secas. */
  cands.forEach(x => { const mx = Math.max(...x.c), mn = Math.min(...x.c); x.s = x.n * (1 + 2 * (mx ? (mx - mn) / mx : 0)); });
  cands.sort((a, b) => b.s - a.s);
  const dist = (a, b) => { const r = (a[0] + b[0]) / 2, dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2]; return Math.sqrt((2 + r / 256) * dr * dr + 4 * dg * dg + (2 + (255 - r) / 256) * db * db); };
  const out = [];
  for (const x of cands) { if (out.every(o => dist(o.c, x.c) > 70)) out.push(x); if (out.length >= n) break; }
  return out.sort((a, b) => b.n - a.n).map(x => "#" + x.c.map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase());
}
