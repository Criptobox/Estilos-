/* Compartir el proyecto del constructor con un enlace.
   El proyecto va comprimido (deflate) y codificado en base64url dentro del «#» de la dirección:
   el fragmento no se envía a ningún servidor. Las imágenes reemplazadas NO viajan (pesan demasiado
   para un enlace): para eso están el ZIP y la copia de seguridad. */
const SHARE_MAX_JSON = 3000000;   /* tope tras descomprimir: evita enlaces que se expanden sin control */

function bytesToB64url(u8) {
  let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(t) {
  const b = atob(t.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((t.length + 3) % 4));
  const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u;
}
async function streamBytes(stream, cap) {
  const rd = stream.getReader(), parts = []; let n = 0;
  for (;;) { const { done, value } = await rd.read(); if (done) break; n += value.length; if (cap && n > cap) { try { rd.cancel(); } catch (e) { /* ignorar */ } throw new Error("demasiado grande"); } parts.push(value); }
  const out = new Uint8Array(n); let o = 0; parts.forEach(p => { out.set(p, o); o += p.length; }); return out;
}
async function shareCompress(text) {
  const raw = new TextEncoder().encode(text);
  if (typeof CompressionStream !== "function") return { tag: "p0", bytes: raw };
  const cs = new CompressionStream("deflate-raw"), w = cs.writable.getWriter();
  w.write(raw); w.close();
  return { tag: "p1", bytes: await streamBytes(cs.readable) };
}
async function shareDecompress(tag, bytes) {
  if (tag === "p0") { if (bytes.length > SHARE_MAX_JSON) throw new Error("demasiado grande"); return new TextDecoder().decode(bytes); }
  if (typeof DecompressionStream !== "function") throw new Error("sin descompresión");
  const ds = new DecompressionStream("deflate-raw"), w = ds.writable.getWriter();
  w.write(bytes).catch(() => { /* el error sale por la lectura */ }); w.close().catch(() => { /* ídem */ });
  return new TextDecoder().decode(await streamBytes(ds.readable, SHARE_MAX_JSON));
}

/* Proyecto sin imágenes ni datos derivados, listo para ir en un enlace. */
function builderShareData() {
  syncActiveScreen();
  const copy = JSON.parse(mediaInflate(JSON.stringify(Object.assign({}, builder, { layers: undefined, selected: undefined, activeLayer: undefined }))));
  copy.screens.forEach(sc => sc.layers.forEach(l => {
    l.mediaEdits = {};
    if (l.editMeta) Object.keys(l.editMeta).forEach(k => { if (k.indexOf("m:") === 0) delete l.editMeta[k]; });
  }));
  return copy;
}
async function builderShareLink() {
  const { tag, bytes } = await shareCompress(JSON.stringify(builderShareData()));
  return location.origin + location.pathname + "#" + tag + "=" + bytesToB64url(bytes);
}
/* Devuelve { project, dropped } o null si el hash no es un enlace de proyecto válido. */
async function builderFromShareHash(hash) {
  const m = /^#(p[01])=([A-Za-z0-9_-]+)$/.exec(hash || ""); if (!m) return null;
  const obj = JSON.parse(await shareDecompress(m[1], b64urlToBytes(m[2])));
  if (!obj || typeof obj !== "object") return null;
  const wanted = (Array.isArray(obj.screens) ? obj.screens : []).reduce((n, sc) => n + (sc && Array.isArray(sc.selected) ? Math.min(12, sc.selected.length) : 0), 0);
  const project = sanitizeBuilder(obj), got = project.screens.reduce((n, sc) => n + sc.selected.length, 0);
  return { project, dropped: Math.max(0, wanted - got), blocks: got };
}
