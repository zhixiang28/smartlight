// Minimal service worker: makes the app installable and loads the shell offline.
// Network first, so updates show up immediately; the cache is only a fallback.
// Only same-origin GETs are handled; API calls (Supabase) always go straight to the network.
const CACHE = "smartlight-shell-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
    e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
    const req = e.request;
    if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
    e.respondWith(
        fetch(req).then(res => {
            if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
            return res;
        }).catch(() => caches.match(req).then(r => r || caches.match("./")))
    );
});
