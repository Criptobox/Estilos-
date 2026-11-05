/* Service worker: precache de toda la app para que funcione sin conexión. */
const BUILD = "11.0.0"; /* CI lo reemplaza por 11.0.<n.º de build> en cada despliegue */
const V = "estilos-" + BUILD;
const FILES = ["./","index.html","preview-constructor.html","manifest.webmanifest","css/styles.css","js/util.js","js/icons.js","js/designs-core.js","js/designs-a.js","js/designs-b.js","js/designs-c.js","js/designs-d.js","js/data.js","js/designs-extra.js","js/stacks.js","js/userrefs.js","js/media.js","js/export.js","js/app.js","icons/icon-192.png","icons/icon-512.png","fonts/plus-jakarta-sans.woff2","ref/ref01.webp","ref/ref02.webp","ref/ref03.webp","ref/ref04.webp","ref/ref05.webp","ref/ref06.webp","ref/ref07.webp","ref/ref08.webp","ref/ref09.webp","ref/ref10.webp","ref/ref11.webp","ref/ref12.webp","ref/ref13.webp","ref/ref14.webp","ref/ref15.webp","ref/ref16.webp","ref/ref17.webp","ref/ref18.webp","ref/ref19.webp","ref/ref20.webp","ref/ref21.webp","ref/ref22.webp","ref/ref23.webp","ref/ref24.webp","ref/ref25.webp","ref/ref26.webp","ref/ref27.webp"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
/* Caché primero y actualización en segundo plano (stale-while-revalidate):
   sin conexión o con mala red la app abre al instante. Las versiones nuevas llegan
   igualmente: cada despliegue cambia BUILD, se instala otro SW y la página se recarga. */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(V).then(c => c.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(n => { if (n.ok) c.put(req, n.clone()); return n; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => req.mode === "navigate" ? c.match("index.html") : Response.error());
  })));
});
