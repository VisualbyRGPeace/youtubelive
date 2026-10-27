const CACHE_NAME='gon-youtube-v5';
const APP_FILES=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./icon.svg'];

self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  await cache.addAll(APP_FILES);
  await self.skipWaiting();
})()));

self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put('./',copy));
      return response;
    }).catch(()=>caches.match('./')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});