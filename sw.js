/* ISE Invoices service worker — app-shell precache, cache-first, versioned.
   Scope-relative so the app works at any base path (root or /Invoice_ISE/). */
const VERSION = "ise-90e9e711b66d"; // stamped with a build hash by scripts/stamp-sw.mjs
const BASE = new URL(self.registration.scope).pathname; // e.g. "/" or "/Invoice_ISE/"
const abs = (p) => BASE + p;

// Hashed build assets, injected at build time by scripts/stamp-sw.mjs.
// Precaching ALL of them (including the lazy pdfmake chunk) at install makes
// each deploy atomic: a cached shell always has every file it references, so
// PDF generation can never 404/hang after a redeploy or offline.
const BUILD_ASSETS = ["assets/index-Cl0Y-Ddv.css", "assets/index-DkwStWkE.js", "assets/ise-logo-B1Sj9nKB.svg", "assets/pdfmake-Cx9scTbD.js", "assets/rolldown-runtime-hePW80VL.js"];

const SHELL = [
  "",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "maskable-192.png",
  "maskable-512.png",
  "apple-touch-icon.png",
  "favicon-64.png",
  "fonts/jost-v20-latin-regular.woff2",
  "fonts/jost-v20-latin-500.woff2",
  "fonts/jost-v20-latin-700.woff2",
  "fonts/jost-v20-latin-italic.woff2",
  ...BUILD_ASSETS,
].map(abs);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Navigations: cached shell first (offline startup), refresh in background.
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match(abs("index.html")).then((cached) => {
        const network = fetch(event.request)
          .then((res) => {
            if (res.ok) caches.open(VERSION).then((c) => c.put(abs("index.html"), res.clone()));
            return res;
          })
          .catch(() => cached);
        return cached ?? network;
      }),
    );
    return;
  }

  // Static assets: cache-first, populate on miss.
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ??
        fetch(event.request).then((res) => {
          if (res.ok && (url.pathname.startsWith(abs("assets/")) ||
                         url.pathname.startsWith(abs("fonts/")) ||
                         SHELL.includes(url.pathname))) {
            const clone = res.clone();
            caches.open(VERSION).then((c) => c.put(event.request, clone));
          }
          return res;
        }),
    ),
  );
});
