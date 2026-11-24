/* FJ Livraison : fonctionnement hors connexion */
const C="fj-app-v1",SDK="fj-sdk-v1",TILES="fj-tiles-v1";
const CORE=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(C).then(c=>Promise.allSettled(CORE.map(u=>c.add(u)))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>![C,SDK,TILES].includes(n)).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));
});
function trim(c,max){c.keys().then(k=>{if(k.length>max)c.delete(k[0])})}
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  // pages : réseau d'abord, copie enregistrée si pas de réseau
  if(r.mode==="navigate"){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res})
      .catch(()=>caches.match(r).then(m=>m||caches.match("index.html")||caches.match("./"))));
    return;
  }
  // fichiers du site
  if(u.origin===location.origin){
    e.respondWith(caches.match(r).then(m=>{
      const f=fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>m);
      return m||f;
    }));
    return;
  }
  // outils Firebase (versions figées)
  if(u.hostname==="www.gstatic.com"&&u.pathname.includes("/firebasejs/")){
    e.respondWith(caches.open(SDK).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{c.put(r,res.clone());return res}))));
    return;
  }
  // fond de carte déjà consulté
  if(u.hostname==="tile.openstreetmap.org"){
    e.respondWith(caches.open(TILES).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{c.put(r,res.clone());trim(c,800);return res}).catch(()=>Response.error()))));
  }
});
