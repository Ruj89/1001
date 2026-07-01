const CACHE_NAME = "archivio-1001-shell-v1";
const SHELL_ASSETS = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "storage.js",
  "manifest.webmanifest",
  "logo-32.png",
  "icon-192.svg",
  "icon-512.svg",
  "icons/gamepad-2.svg",
  "icons/disc-3.svg",
  "icons/circle-dot.svg",
  "icons/layout-dashboard.svg",
  "icons/archive.svg",
  "icons/upload.svg",
  "icons/download.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).catch(() => caches.match("index.html"));
    }),
  );
});
