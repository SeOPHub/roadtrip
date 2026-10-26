// Offline: guarda o app inteiro no aparelho na primeira visita.
// Este arquivo é um modelo: o gerar.py preenche a versão e a lista de arquivos.
// Cada versão gerada tem um cache próprio; ao publicar uma nova, a anterior é descartada.
const VERSION = 'rt-12-61f7b918';
const PRECACHE = [
  "./",
  "./css/app.css",
  "./fonts/NouvelR.woff2",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./img/grand-canyon-page/biidi-the-arch-547.453bfbd9.jpg",
  "./img/grand-canyon-page/glen-canyon-dam-1600.d9e8b8b9.jpg",
  "./img/grand-canyon-page/glen-canyon-dam-800.d9e8b8b9.jpg",
  "./img/grand-canyon-page/hero-1600.28b7299c.jpg",
  "./img/grand-canyon-page/hero-800.28b7299c.jpg",
  "./img/grand-canyon-page/horseshoe-bend-1600.4f109e99.jpg",
  "./img/grand-canyon-page/horseshoe-bend-800.4f109e99.jpg",
  "./img/grand-canyon-page/mapa-trilha-800.8cc27536.jpg",
  "./img/grand-canyon-page/mapa-trilha-985.8cc27536.jpg",
  "./img/grand-canyon-page/mather-point-1200.e724e843.jpg",
  "./img/grand-canyon-page/mather-point-800.e724e843.jpg",
  "./img/grand-canyon-page/navajo-bridge-1400.aa6ff630.jpg",
  "./img/grand-canyon-page/navajo-bridge-800.aa6ff630.jpg",
  "./img/grand-canyon-page/navajo-point-1600.1a34b15a.jpg",
  "./img/grand-canyon-page/navajo-point-800.1a34b15a.jpg",
  "./img/grand-canyon-page/new-wave-1600.2fda0d7b.jpg",
  "./img/grand-canyon-page/new-wave-800.2fda0d7b.jpg",
  "./img/grand-canyon-page/page-sign-1600.52bb8478.jpg",
  "./img/grand-canyon-page/page-sign-800.52bb8478.jpg",
  "./img/grand-canyon-page/rim-trail-1200.8e87149d.jpg",
  "./img/grand-canyon-page/rim-trail-800.8e87149d.jpg",
  "./img/grand-canyon-page/video-1280.07fe5910.jpg",
  "./img/grand-canyon-page/video-800.07fe5910.jpg",
  "./img/grand-canyon-page/visitor-center-1600.72f542db.jpg",
  "./img/grand-canyon-page/visitor-center-800.72f542db.jpg",
  "./img/grand-canyon-page/watchtower-1200.21944f22.jpg",
  "./img/grand-canyon-page/watchtower-800.21944f22.jpg",
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
  "./img/joshua-tree/video-1280.da18ea54.jpg",
  "./img/joshua-tree/video-800.da18ea54.jpg",
  "./img/monument-valley/forrest-gump-point-1080.8c685327.jpg",
  "./img/monument-valley/forrest-gump-point-800.8c685327.jpg",
  "./img/monument-valley/goosenecks-1280.2845221d.jpg",
  "./img/monument-valley/goosenecks-800.2845221d.jpg",
  "./img/monument-valley/hero-1600.aa361298.jpg",
  "./img/monument-valley/hero-800.aa361298.jpg",
  "./img/monument-valley/looney-tunes-734.ec3efe75.jpg",
  "./img/monument-valley/mapa-scenic-drive-720.232eb0c5.jpg",
  "./img/monument-valley/mexican-hat-640.e83da0c8.jpg",
  "./img/monument-valley/the-mittens-1600.838f582d.jpg",
  "./img/monument-valley/the-mittens-800.838f582d.jpg",
  "./img/monument-valley/tribal-loop-1600.1308af43.jpg",
  "./img/monument-valley/tribal-loop-800.1308af43.jpg",
  "./img/monument-valley/utah-sign-1440.f8a1cf64.jpg",
  "./img/monument-valley/utah-sign-800.f8a1cf64.jpg",
  "./img/monument-valley/valley-of-the-gods-547.4da32720.jpg",
  "./img/monument-valley/video-1280.792f4b2b.jpg",
  "./img/monument-valley/video-800.792f4b2b.jpg",
  "./img/monument-valley/video-forrest-gump-1280.b4fdd3f3.jpg",
  "./img/monument-valley/video-forrest-gump-800.b4fdd3f3.jpg",
  "./img/route-66/amboy-1140.b3016dcf.jpg",
  "./img/route-66/amboy-800.b3016dcf.jpg",
  "./img/route-66/cool-springs-1600.ae99496c.jpg",
  "./img/route-66/cool-springs-800.ae99496c.jpg",
  "./img/route-66/hackberry-399.a176deff.jpg",
  "./img/route-66/hero-1600.e4bb4af2.jpg",
  "./img/route-66/hero-800.e4bb4af2.jpg",
  "./img/route-66/kingman-1500.0c8864c4.jpg",
  "./img/route-66/kingman-800.0c8864c4.jpg",
  "./img/route-66/oatman-1600.958af349.jpg",
  "./img/route-66/oatman-800.958af349.jpg",
  "./img/route-66/seligman-1500.b430ef3b.jpg",
  "./img/route-66/seligman-800.b430ef3b.jpg",
  "./img/route-66/williams-1280.f26cba49.jpg",
  "./img/route-66/williams-800.f26cba49.jpg",
  "./img/sedona/airport-mesa-1280.05b85194.jpg",
  "./img/sedona/airport-mesa-800.05b85194.jpg",
  "./img/sedona/bell-rock-1467.9de8408a.jpg",
  "./img/sedona/bell-rock-800.9de8408a.jpg",
  "./img/sedona/cathedral-rock-1600.7f749d84.jpg",
  "./img/sedona/cathedral-rock-800.7f749d84.jpg",
  "./img/sedona/chapel-1600.1675d27d.jpg",
  "./img/sedona/chapel-800.1675d27d.jpg",
  "./img/sedona/cottonwood-1200.cae26dc3.jpg",
  "./img/sedona/cottonwood-800.cae26dc3.jpg",
  "./img/sedona/devils-bridge-452.f0f8cedb.jpg",
  "./img/sedona/downtown-678.deea8d31.jpg",
  "./img/sedona/fay-canyon-1200.171143ce.jpg",
  "./img/sedona/fay-canyon-800.171143ce.jpg",
  "./img/sedona/hero-1600.dead7e21.jpg",
  "./img/sedona/hero-800.dead7e21.jpg",
  "./img/sedona/oak-creek-canyon-1600.b71896c2.jpg",
  "./img/sedona/oak-creek-canyon-800.b71896c2.jpg",
  "./img/sedona/oak-creek-vista-1200.53b87ecb.jpg",
  "./img/sedona/oak-creek-vista-800.53b87ecb.jpg",
  "./img/sedona/red-rocks-1440.8c046a43.jpg",
  "./img/sedona/red-rocks-800.8c046a43.jpg",
  "./img/sedona/video-1-1280.6bdb18c4.jpg",
  "./img/sedona/video-1-800.6bdb18c4.jpg",
  "./img/sedona/video-2-640.8369a7d7.jpg",
  "./index.html",
  "./ingressos/pappys-halloween-30out.bd69eb27.bin",
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
