/* 云隐 PWA 离线缓存 */
var CACHE = 'yunyin-v4';
var CORE = [
  './xianxia-jewelry-app-ios.html',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/hero_2560x1440.jpg',
  './assets/yoga-downward-dog.jpg',
  './assets/yoga-cat-cow.jpg',
  './assets/yoga-warrior-two.jpg',
  './assets/yoga-breathwork.jpg',
  './assets/product-jade_1920x1920.jpg',
  './assets/product-bracelet_1920x1920.jpg',
  './assets/product-beads_1920x1920.jpg',
  './assets/product-hairpin_1920x1920.jpg'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(CORE); }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== location.origin) return;
  /* 视频走网络，避免 Range 请求与缓存冲突；离线时由 poster 兜底 */
  if(/\.mp4$/.test(url.pathname)) return;

  /* 页面走网络优先，保证更新即时生效，离线时回退缓存 */
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(function(res){
        if(res && res.status === 200){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){ return caches.match(req); })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        if(res && res.status === 200 && res.type === 'basic'){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
