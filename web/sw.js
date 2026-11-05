/* Service worker: precache de toda la app para que funcione sin conexión. */
const BUILD = "5.0.0"; /* CI lo reemplaza por 5.0.<n.º de build> en cada despliegue */
const V = "estilos-" + BUILD;
const FILES = ["./","index.html","preview-constructor.html","manifest.webmanifest","css/styles.css","js/util.js","js/icons.js","js/designs-core.js","js/designs-a.js","js/designs-b.js","js/designs-c.js","js/designs-d.js","js/data.js","js/designs-extra.js","js/app.js","icons/icon-192.png","icons/icon-512.png","fonts/plus-jakarta-sans.woff2","ref/ref01.jpg","ref/ref02.jpg","ref/ref03.jpg","ref/ref04.jpg","ref/ref05.jpg","ref/ref06.jpg","ref/ref07.jpg","ref/ref08.jpg","ref/ref09.jpg","ref/ref10.jpg","ref/ref11.jpg","ref/ref12.jpg","ref/ref13.jpg","ref/ref14.jpg","ref/ref15.jpg","ref/ref16.jpg","ref/ref17.jpg","ref/ref18.jpg","ref/ref19.jpg","ref/ref20.jpg","ref/ref21.jpg","ref/ref22.jpg","ref/ref23.jpg","ref/ref24.jpg","ref/ref25.jpg","ref/ref26.jpg","ref/ref27.jpg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(n => { if (n.ok) { const cp = n.clone(); caches.open(V).then(c => c.put(e.request, cp)); } return n; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
});
