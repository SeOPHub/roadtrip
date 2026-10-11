// Offline: guarda o app inteiro no aparelho na primeira visita.
// Este arquivo é um modelo: o gerar.py preenche a versão e a lista de arquivos.
// Cada versão gerada tem um cache próprio; ao publicar uma nova, a anterior é descartada.
const VERSION = 'rt-4-b8842e69';
const PRECACHE = [
  "./",
  "./css/app.css",
  "./fonts/NouvelR.woff2",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./img/joshua-tree/barker-dam-724.a7d0cb12.jpg",
  "./img/joshua-tree/cholla-1600.537123c8.jpg",
  "./img/joshua-tree/cholla-800.537123c8.jpg",
  "./img/joshua-tree/deserto-1600.53441302.jpg",
  "./img/joshua-tree/deserto-800.53441302.jpg",
  "./img/joshua-tree/hero-1600.37d36865.jpg",
  "./img/joshua-tree/hero-800.37d36865.jpg",
  "./img/joshua-tree/hidden-valley-1600.8a8a4a30.jpg",
  "./img/joshua-tree/hidden-valley-800.8a8a4a30.jpg",
  "./img/joshua-tree/joshua-trees-1600.737e767b.jpg",
  "./img/joshua-tree/joshua-trees-800.737e767b.jpg",
  "./img/joshua-tree/pioneertown-1600.88e32154.jpg",
  "./img/joshua-tree/pioneertown-800.88e32154.jpg",
  "./img/route-66/amboy-1140.b3016dcf.jpg",
  "./img/route-66/amboy-800.b3016dcf.jpg",
  "./img/route-66/cool-springs-1600.ae99496c.jpg",
  "./img/route-66/cool-springs-800.ae99496c.jpg",
  "./img/route-66/hackberry-399.a176deff.jpg",
  "./img/route-66/hero-1200.567fe04d.jpg",
  "./img/route-66/hero-800.567fe04d.jpg",
  "./img/route-66/kingman-1500.0c8864c4.jpg",
  "./img/route-66/kingman-800.0c8864c4.jpg",
  "./img/route-66/oatman-346.89e07f25.jpg",
  "./img/route-66/seligman-1500.b430ef3b.jpg",
  "./img/route-66/seligman-800.b430ef3b.jpg",
  "./img/route-66/williams-1280.f26cba49.jpg",
  "./img/route-66/williams-800.f26cba49.jpg",
  "./index.html",
  "./js/app.js",
  "./js/icons.js",
  "./js/trip-data.js",
  "./manifest.json"
];

self.addEventListener('install', e => {
  // cache: 'reload' ignora o cache HTTP do navegador, para não guardar arquivos da versão anterior.
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Cache primeiro (rápido e funciona sem sinal na estrada); rede como reserva.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => req.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
