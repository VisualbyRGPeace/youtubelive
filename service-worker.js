const CACHE_NAME='gon-youtube-v24';
const APP_FILES=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./icon.svg','./player.html'];

self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  await Promise.all(APP_FILES.map(file=>cache.add(new Request(file,{cache:'reload'}))));
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
    const isPlayer=new URL(event.request.url).pathname.endsWith('/player.html');
    if(isPlayer){
      event.respondWith(fetch(event.request).catch(()=>caches.match('./player.html')));
      return;
    }
    event.respondWith(fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put('./',copy));
      return response;
    }).catch(()=>caches.match('./')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
