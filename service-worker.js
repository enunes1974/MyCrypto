const CACHE = "mycrypto-v4";
const SHELL = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // APIs de cotações: nunca interceptar
  if (url.hostname.includes("coingecko.com") || url.hostname.includes("finnhub.io")) return;
  // Ficheiros da própria app: rede primeiro (apanha sempre a versão mais recente), cache só se estiver offline
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(e.request, { cache: "no-cache" })
        .then((resp) => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
