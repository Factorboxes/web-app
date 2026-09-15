const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
(async()=>{
 const handlers={},shown=[],navigated=[];let status=200,offline=false;
 const self={location:{origin:'https://shop.test'},registration:{showNotification:async(t,o)=>shown.push({t,o})},clients:{matchAll:async()=>[{url:'https://shop.test/store',postMessage:()=>{},navigate:async u=>navigated.push(u),focus:async()=>{}}],openWindow:async u=>navigated.push(u)},addEventListener:(kind,f)=>handlers[kind]=f};
 vm.runInNewContext(fs.readFileSync('public/sw.js','utf8'),{self,URL,AbortController,setTimeout,clearTimeout,Response,fetch:async()=>{if(offline)throw Error('offline');return new Response(JSON.stringify({notification:{title:'🚚 จัดส่งแล้ว',body:'Tracking: TH123'}}),{status})}});
 const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 async function push(data){let task;handlers.push({data:{json:()=>data},waitUntil:p=>task=p});await task;}
 await push({notificationId:id});assert.equal(shown[0].t,'🚚 จัดส่งแล้ว');assert.match(shown[0].o.body,/TH123/);assert.equal(shown[0].o.tag,'fb-'+id);
 status=404;await push({notificationId:id});assert.equal(shown[1].t,'🔔 FACTORBOXES');assert.doesNotMatch(shown[1].o.body,/TH123/,'signed-out/different account must not expose order details');
 offline=true;await push({notificationId:id});assert.equal(shown[2].t,'🔔 FACTORBOXES','offline push still displays a visible fallback');
 let task;handlers.notificationclick({notification:{close(){},data:{url:'/notifications?id='+id}},waitUntil:p=>task=p});await task;assert.deepEqual(navigated,['https://shop.test/notifications?id='+id]);
 handlers.notificationclick({notification:{close(){},data:{url:'https://evil.test/notifications'}},waitUntil:p=>task=p});await task;assert.equal(navigated.length,1);
 console.log('PASS service worker authenticated details, signed-out/offline privacy, stable tags and same-origin click navigation');
})().catch(e=>{console.error(e);process.exit(1)});
