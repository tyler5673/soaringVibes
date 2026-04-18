const CACHE = 'soaring-vibes-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/manifest.json',
  
  // Core JS modules
  '/js/utils.js',
  '/js/config.js',
  '/js/controls.js',
  '/js/multiplayer.js',
  '/js/aircraft.js',
  '/js/camera.js',
  '/js/ocean.js',
  '/js/environment.js',
  '/js/islands.js',
  '/js/airport.js',
  '/js/airport-map-parser.js',
  '/js/boats.js',
  '/js/gauges.js',
  '/js/performance.js',
  '/js/spatial-grid.js',
  '/js/flora-manager.js',
  '/js/building-manager.js',
  '/js/hot-air-balloons.js',
  '/js/fauna-manager.js',
  '/js/music-player.js',
  
  // Physics modules
  '/js/physics/physics-bridge.js',
  '/js/physics/aerodynamics.js',
  '/js/physics/realistic-physics.js',
  '/js/physics/arcade-physics.js',
  
  // Tree geometry classes
  '/js/trees/palm.js',
  '/js/trees/coconut-palm.js',
  '/js/trees/koa.js',
  '/js/trees/giant-koa.js',
  '/js/trees/ohia.js',
  '/js/trees/banyan.js',
  '/js/trees/tree-fern.js',
  '/js/trees/ti-plant.js',
  '/js/trees/bamboo.js',
  '/js/trees/wiliwili.js',
  '/js/trees/shrub.js',
  '/js/trees/grass.js',
  '/js/trees/ground-fern.js',
  '/js/trees/naupaka.js',
  '/js/trees/beach-morning-glory.js',
  '/js/trees/driftwood.js',
  '/js/trees/lava-rock.js',
  
  // Animal classes
  '/js/animals/animal-base.js',
  '/js/animals/whale.js',
  '/js/animals/dolphin.js',
  '/js/animals/seaturtle.js',
  '/js/animals/albatross.js',
  '/js/animals/frigatebird.js',
  '/js/animals/honeycreeper.js',
  '/js/animals/nene.js',
  
  // Building classes
  '/js/buildings/residential.js',
  '/js/buildings/commercial.js',
  '/js/buildings/lighthouse.js',
  
  // Assets - heightmaps and metadata
  'assets/heightmaps/big-island.png',
  'assets/heightmaps/big-island.json',
  'assets/heightmaps/molie.png',
  'assets/heightmaps/molie.json',
  'assets/heightmaps/oahu.png',
  'assets/heightmaps/oahu.json',
  'assets/heightmaps/kauai.png',
  'assets/heightmaps/kauai.json',
  'assets/heightmaps/molokai.png',
  'assets/heightmaps/molokai.json',
  'assets/heightmaps/lanai.png',
  'assets/heightmaps/lanai.json',
  'assets/heightmaps/niihau.png',
  'assets/heightmaps/niihau.json',
  'assets/heightmaps/kahoolawe.png',
  'assets/heightmaps/kahoolawe.json',
  
  // Images
  'assets/images/icon.png',
  'assets/images/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
