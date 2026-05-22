const DEPLOY_BASE_PATH = "__DEPLOY_BASE_PATH__";
const CACHE_NAME = `archivio-1001-shell-v1-${DEPLOY_BASE_PATH}`;
const SHELL_ASSETS = [
  DEPLOY_BASE_PATH,
  `${DEPLOY_BASE_PATH}index.html`,
  `${DEPLOY_BASE_PATH}styles.css`,
  `${DEPLOY_BASE_PATH}app.js`,
  `${DEPLOY_BASE_PATH}storage.js`,
  `${DEPLOY_BASE_PATH}manifest.webmanifest`,
  `${DEPLOY_BASE_PATH}icon-192.svg`,
  `${DEPLOY_BASE_PATH}icon-512.svg`,
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

      return fetch(event.request).catch(() => caches.match(`${DEPLOY_BASE_PATH}index.html`));
    }),
  );
});
