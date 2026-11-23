// Garricks Ait - Boards: service worker (offline shell + push alerts)
const CACHE = "boards-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "header.jpg", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // live data always goes to the network
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: "Garricks Ait - Boards", body: e.data?.text() ?? "" }; }
  const state = d.state ?? "none";
  const red = state === "red", amber = String(state).startsWith("amber");
  e.waitUntil(self.registration.showNotification(d.title ?? "Garricks Ait - Boards", {
    body: d.body ?? "",
    icon: "icon-192.png",
    tag: "boards",
    renotify: true,
    requireInteraction: red,
    vibrate: red ? [400, 150, 400, 150, 400, 150, 800] : amber ? [300, 150, 300] : [200],
    data: { url: "./" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    for (const c of cs) if ("focus" in c) return c.focus();
    return self.clients.openWindow(e.notification.data?.url ?? "./");
  }));
});
