// Petit "service worker" : garde une copie du site sur le telephone.
// - La page : on essaie toujours internet d'abord (pour avoir la derniere version),
//   la copie ne sert que s'il n'y a pas de reseau.
// - Photos et police : copie d'abord (plus rapide), internet sinon.
// Changer le numero de version ci-dessous a chaque grosse mise a jour.
var CACHE = 'chiquito-v1';
var ESSENTIEL = ['./', './index.html', './polices/outfit.woff2', './facade.webp', './icone-192.png'];

self.addEventListener('install', function (e) {
    e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ESSENTIEL); }));
    self.skipWaiting();
});

self.addEventListener('activate', function (e) {
    e.waitUntil(caches.keys().then(function (noms) {
        return Promise.all(noms.filter(function (n) { return n !== CACHE; }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
    var req = e.request;
    // On ne touche ni aux envois (formulaire), ni aux autres sites (Google Maps, Google Forms)
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

    if (req.mode === 'navigate') {
        e.respondWith(fetch(req).then(function (rep) {
            var copie = rep.clone();
            caches.open(CACHE).then(function (c) { c.put('./', copie); });
            return rep;
        }).catch(function () { return caches.match('./'); }));
        return;
    }

    e.respondWith(caches.match(req).then(function (trouve) {
        return trouve || fetch(req).then(function (rep) {
            if (rep.ok) {
                var copie = rep.clone();
                caches.open(CACHE).then(function (c) { c.put(req, copie); });
            }
            return rep;
        });
    }));
});
