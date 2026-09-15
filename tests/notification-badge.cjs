const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const workerSource=fs.readFileSync('public/sw.js','utf8');
const messageId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
function worker({supported=true}={}){
 const handlers={},badges=[],shown=[],requests=[];
 let rawCount=3,status=200,offline=false,denied=false,override=null;
 const nav=supported?{setAppBadge:async n=>{if(denied)throw Error('NotAllowedError');badges.push(n)},clearAppBadge:async()=>{if(denied)throw Error('NotAllowedError');badges.push(0)}}:{};
 const self={navigator:nav,location:{origin:'https://shop.test'},registration:{showNotification:async(title,options)=>shown.push({title,options})},clients:{matchAll:async()=>[]},addEventListener:(name,handler)=>handlers[name]=handler};
 const fetch=async(url,options)=>{
  requests.push({url,options});if(offline)throw Error('offline');
  if(url.includes('count=1'))return override?override():new Response(JSON.stringify({counts:{unread:rawCount}}),{status});
  return new Response(JSON.stringify({notification:{title:'จัดส่งแล้ว',body:'เลขพัสดุ TEST123'}}),{status});
 };
 vm.runInNewContext(workerSource,{self,URL,Response,AbortController,setTimeout,clearTimeout,fetch});
 async function send(source='https://shop.test/notifications',extra={}){
  let pending;handlers.message({data:{type:'factorboxes-refresh-badge',...extra},source:{url:source},waitUntil:p=>pending=p});await pending;
 }
 async function push(){let pending;handlers.push({data:{json:()=>({notificationId:messageId,unread:999999})},waitUntil:p=>pending=p});await pending}
 return {badges,shown,requests,nav,send,push,setCount:v=>rawCount=v,setStatus:v=>status=v,setOffline:v=>offline=v,setDenied:v=>denied=v,override:f=>override=f};
}

(async()=>{
 const w=worker();
 await w.push();assert.equal(w.shown[0].title,'จัดส่งแล้ว');assert.deepEqual(w.badges,[3]);
 assert.equal(w.requests.find(r=>r.url.includes('count=1')).options.credentials,'include');
 assert.equal(w.requests.find(r=>r.url.includes('count=1')).options.cache,'no-store');
 await w.push();assert.deepEqual(w.badges,[3,3],'duplicate Push must not inflate unread count');
 w.setCount('2');await w.send();assert.equal(w.badges.at(-1),2,'read one message updates the count');
 w.setCount(0);await w.send();assert.equal(w.badges.at(-1),0,'read all clears the icon badge');
 w.setCount(4);await w.send();w.setStatus(401);await w.send();assert.equal(w.badges.at(-1),0,'signed-out session clears the old badge');
 w.setStatus(200);w.setCount(7);await w.send();
 const before=w.badges.length;w.setStatus(503);await w.send();assert.equal(w.badges.length,before,'server failure must not pretend inbox is empty');
 w.setStatus(200);
 for(const count of [-1,2.5,null,'',true,'not-a-number',Number.MAX_SAFE_INTEGER+1]){w.setCount(count);await w.send();assert.equal(w.badges.length,before)}
 w.setOffline(true);await w.push();assert.equal(w.shown.at(-1).title,'🔔 FACTORBOXES');assert.equal(w.badges.length,before,'offline Push keeps last known badge and visible generic fallback');
 w.setOffline(false);w.setCount(6);w.setDenied(true);await w.push();assert.equal(w.shown.at(-1).title,'จัดส่งแล้ว','denied badge permission must not break visible Push');
 const requestCount=w.requests.length;await w.send('https://evil.test/');assert.equal(w.requests.length,requestCount,'ignore refresh requests from another origin');
 w.setDenied(false);w.setCount(1);await w.send(undefined,{unread:999});assert.equal(w.badges.at(-1),1,'ignore caller-provided badge counts');
 const unsupported=worker({supported:false});await unsupported.push();assert.equal(unsupported.shown.length,1);assert.equal(unsupported.requests.length,1,'unsupported Badging API must still show Push without an extra count request');
 const fallback=worker();delete fallback.nav.clearAppBadge;fallback.setCount(0);await fallback.send();assert.deepEqual(fallback.badges,[0]);

 // A slow pre-logout response may arrive after the 401 response. It must not restore the old count.
 const race=worker();let resolveOld;race.override(()=>new Promise(resolve=>resolveOld=resolve));const oldRefresh=race.send();
 race.override(()=>Promise.resolve(new Response('{}',{status:401})));await race.send();
 resolveOld(new Response(JSON.stringify({counts:{unread:88}})));await oldRefresh;
 assert.deepEqual(race.badges,[0],'late old-account response is discarded');

 // A badge write already in progress is followed by the newer clear operation.
 const writes=worker();let finishWrite;writes.nav.setAppBadge=async n=>{await new Promise(resolve=>finishWrite=resolve);writes.badges.push(n)};
 const setting=writes.send();while(!finishWrite)await new Promise(resolve=>setImmediate(resolve));
 writes.setStatus(401);const clearing=writes.send();finishWrite();await Promise.all([setting,clearing]);
 assert.deepEqual(writes.badges,[3,0],'new clear must be the last OS badge operation');

 // Exercise the mounted client bridge: initial page, reading, return from background, and cleanup.
 const windowTarget=new EventTarget(),documentTarget=new EventTarget(),serviceWorker=new EventTarget(),messages=[];
 documentTarget.visibilityState='visible';serviceWorker.controller={postMessage:m=>messages.push(m)};
 const effects=[],intervals=[];let intervalCleared=false;
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/notifications/app-badge.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
  exports,require:name=>name==='react'?{useEffect:(effect,deps)=>effects.push({effect,deps})}:{usePathname:()=>'/login'},
  window:windowTarget,document:documentTarget,navigator:{serviceWorker},
  setInterval:callback=>{intervals.push(callback);return 1},clearInterval:()=>intervalCleared=true
 });
 exports.default();const cleanup=effects[0].effect();assert.equal(messages.length,1);assert.equal(effects[0].deps[0],'/login');
 windowTarget.dispatchEvent(new Event('notification-read'));assert.equal(messages.length,2,'read event is posted before a navigation unloads the page');
 documentTarget.visibilityState='hidden';intervals[0]();assert.equal(messages.length,2,'background tabs do not poll');
 documentTarget.visibilityState='visible';documentTarget.dispatchEvent(new Event('visibilitychange'));assert.equal(messages.length,3);
 serviceWorker.dispatchEvent(new Event('controllerchange'));assert.equal(messages.length,4,'new worker receives current session refresh');
 cleanup();windowTarget.dispatchEvent(new Event('notification-read'));assert.equal(messages.length,4);assert.equal(intervalCleared,true);
 console.log('PASS app icon badges: authenticated unread counts, duplicate Push, reading/clear, logout/races, offline/errors, unsupported/denied APIs, client navigation and cleanup');
})().catch(error=>{console.error(error);process.exit(1)});
