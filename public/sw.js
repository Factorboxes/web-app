/* Cache only a public offline notice. Never cache API, auth, orders or payments. */
const CACHE='factorboxes-offline-v1';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.add('/offline.html')).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('factorboxes-offline-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||event.request.mode!=='navigate'||url.origin!==self.location.origin||!['/','/store','/install','/track','/login'].includes(url.pathname))return;
 event.respondWith(fetch(event.request).catch(async()=>await caches.match('/offline.html')||new Response('กรุณาเชื่อมต่ออินเทอร์เน็ต',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})));
});
