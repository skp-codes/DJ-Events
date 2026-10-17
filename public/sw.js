// Offline support: pages and app files load from cache when there's no connection.
// Data, sign-in and Netlify endpoints always go to the network and are never cached.
const CACHE = "rey-events-v1";
const STATIC = ["/app.js", "/pw-toggle.js", "/vendor/xlsx.full.min.js", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(STATIC.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.pathname.startsWith("/api/") || url.pathname.startsWith("/.netlify/")) return;
  if (req.mode === "navigate") {
    // Network first (sign-in links carry tokens in the address, so always hit the network); offline → cached shell.
    e.respondWith(fetch(req).then((res) => {
      if (res.ok && !res.redirected && url.pathname === "/") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("/", copy)); }
      return res;
    }).catch(() => caches.match("/").then((r) => r || new Response("You’re offline. Open the app again when you’re connected.", { headers: { "content-type": "text/plain; charset=utf-8" } }))));
    return;
  }
  if (url.origin === location.origin || url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    // App files and fonts: serve from cache straight away, refresh in the background.
    e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => {
      const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
  }
});
