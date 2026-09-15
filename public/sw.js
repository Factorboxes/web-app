/* Cache only a public offline notice. Never cache API, auth, orders or payments. */
const CACHE='factorboxes-offline-v1';
/* Home-screen count is always read for the current session, never taken from a Push payload.
   Serialize badge writes so an older response cannot restore a count after reading/signing out. */
let badgeRevision=0,badgeWrites=Promise.resolve();
async function syncAppBadge(){
 const nav=self.navigator;if(typeof nav?.setAppBadge!=='function')return;
 const revision=++badgeRevision;
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);let unread;
  try{
   const response=await fetch('/api/notifications?count=1',{credentials:'include',cache:'no-store',signal:controller.signal});
   if(response.status===401)unread=0;
   else if(response.ok){
    const raw=(await response.json()).counts?.unread;
    if(typeof raw!=='number'&&(typeof raw!=='string'||!/^\d+$/.test(raw)))return;
    unread=Number(raw);if(!Number.isSafeInteger(unread)||unread<0)return;
   }else return;
  }finally{clearTimeout(timer)}
  if(revision!==badgeRevision)return;
  badgeWrites=badgeWrites.catch(()=>{}).then(async()=>{
   if(revision!==badgeRevision)return;
   if(unread===0&&typeof nav.clearAppBadge==='function')await nav.clearAppBadge();
   else await nav.setAppBadge(unread);
  });
  await badgeWrites;
 }catch{/* Offline or denied badges must not prevent the visible notification. */}
}
self.addEventListener('message',event=>{
 if(event.data?.type!=='factorboxes-refresh-badge'||!event.source?.url)return;
 try{if(new URL(event.source.url).origin!==self.location.origin)return}catch{return}
 event.waitUntil(syncAppBadge());
});
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
 await syncAppBadge();
 const windows=await self.clients.matchAll({type:'window'});for(const client of windows)client.postMessage({type:'factorboxes-notification'});
})()));
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{
 const target=new URL(event.notification.data?.url||'/notifications',self.location.origin);if(target.origin!==self.location.origin||target.pathname!=='/notifications')return;
 const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of windows){if(new URL(client.url).origin===self.location.origin){await client.navigate(target.href);await client.focus();return}}
 await self.clients.openWindow(target.href);
})())});
