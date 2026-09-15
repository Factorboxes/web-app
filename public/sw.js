/* Cache only a public offline notice. Never cache API, auth, orders or payments. */
const CACHE='factorboxes-offline-v1';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.add('/offline.html')).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('factorboxes-offline-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||event.request.mode!=='navigate'||url.origin!==self.location.origin||!['/','/store','/install','/track','/login'].includes(url.pathname))return;
 event.respondWith(fetch(event.request).catch(async()=>await caches.match('/offline.html')||new Response('กรุณาเชื่อมต่ออินเทอร์เน็ต',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})));
});

/* Push bodies are fetched for the CURRENT signed-in account; no order tokens or customer data in the payload. */
self.addEventListener('push',event=>event.waitUntil((async()=>{
 let id='';try{id=event.data.json().notificationId||''}catch{}
 let title='🔔 FACTORBOXES',body='มีข้อความใหม่ เปิดแอปเพื่อดูการแจ้งเตือน',url='/notifications';
 if(/^[0-9a-f-]{36}$/i.test(id)){
  try{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),5000);let r;try{r=await fetch('/api/notifications?id='+encodeURIComponent(id),{credentials:'include',cache:'no-store',signal:controller.signal})}finally{clearTimeout(timer)}
   if(r.ok){const d=await r.json();if(d.notification){title=d.notification.title;body=d.notification.body;url='/notifications?id='+encodeURIComponent(id)}}
  }catch{}
 }
 // Visible fallback is required even offline / signed out. It does not reveal the previous account's details.
 await self.registration.showNotification(title,{body,icon:'/app-icons/icon-192.png',badge:'/app-icons/icon-192.png',tag:id?'fb-'+id:'factorboxes',data:{url}});
 const windows=await self.clients.matchAll({type:'window'});for(const client of windows)client.postMessage({type:'factorboxes-notification'});
})()));
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{
 const target=new URL(event.notification.data?.url||'/notifications',self.location.origin);if(target.origin!==self.location.origin||target.pathname!=='/notifications')return;
 const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of windows){if(new URL(client.url).origin===self.location.origin){await client.navigate(target.href);await client.focus();return}}
 await self.clients.openWindow(target.href);
})())});
