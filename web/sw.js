/* Service worker: precache de toda la app para que funcione sin conexión. */
const BUILD = "tinta-2026.11.8"; /* CI añade un identificador de despliegue; no reutilizar la caché clásica. */
const V = "estilos-" + BUILD;
const FILES = ["js/tinta-pwa.js","js/tinta-composer.js","js/tinta-slots.js","js/tinta-composition-data.js","./", "index.html", "agente.html", "preview-constructor.html", "manifest.webmanifest", "css/styles.css", "css/agente.css", "css/studio-shell.css", "css/tinta-skin.css", "images/luma-avatar.webp", "js/util.js", "js/icons.js", "js/designs-core.js", "js/designs-a.js", "js/designs-b.js", "js/designs-c.js", "js/designs-d.js", "js/data.js", "js/designs-extra.js", "js/stacks.js", "js/userrefs.js", "js/media.js", "js/creator-mobile.js", "js/image-export.js", "js/export.js", "js/autobackup.js", "js/share.js", "js/app.js", "js/studio-media.js", "js/agente.js", "js/project-backup.js", "icons/icon-192.png", "icons/icon-512.png", "fonts/plus-jakarta-sans.woff2", "ref/ref01.webp", "ref/ref02.webp", "ref/ref03.webp", "ref/ref04.webp", "ref/ref05.webp", "ref/ref06.webp", "ref/ref07.webp", "ref/ref08.webp", "ref/ref09.webp", "ref/ref10.webp", "ref/ref11.webp", "ref/ref12.webp", "ref/ref13.webp", "ref/ref14.webp", "ref/ref15.webp", "ref/ref16.webp", "ref/ref17.webp", "ref/ref18.webp", "ref/ref19.webp", "ref/ref20.webp", "ref/ref21.webp", "ref/ref22.webp", "ref/ref23.webp", "ref/ref24.webp", "ref/ref25.webp", "ref/ref26.webp", "ref/ref27.webp", "crear.html", "biblioteca.html", "images/tinta-avatar.webp", "icons/icon-maskable-512.png", "js/tinta-assets.js", "js/tinta-button-style.js", "js/tinta-card-style.js", "js/tinta-catalog.js", "js/tinta-history.js", "js/tinta-sectors.js", "screenshots/tinta-movil.jpg", "screenshots/tinta-escritorio.jpg", "js/tinta-library.js", "js/tinta-states.js", "js/crear.js", "css/crear.css"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith("estilos-") && x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
/* Caché primero y actualización en segundo plano (stale-while-revalidate):
   sin conexión o con mala red la app abre al instante. Las versiones nuevas llegan
   igualmente: cada despliegue cambia BUILD, se instala otro SW y la página se recarga. */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if(req.mode === "navigate") {
    e.respondWith(fetch(req).then(response=>{if(response.ok){const copy=response.clone();e.waitUntil(caches.open(V).then(c=>c.put(req,copy)));}return response;}).catch(()=>caches.open(V).then(c=>c.match(req,{ignoreSearch:true}).then(hit=>hit||c.match("index.html")))));return;
  }
  e.respondWith(caches.open(V).then(c => c.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(n => { if (n.ok) c.put(req, n.clone()); return n; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => req.mode === "navigate" ? c.match("index.html") : Response.error());
  })));
});
