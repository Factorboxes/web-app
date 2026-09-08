const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
(async()=>{const handlers={},added=[];let response,network=0;
const ctx={URL,Response,self:{location:{origin:'https://shop.test'},addEventListener:(n,f)=>handlers[n]=f,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>({add:async p=>added.push(p)}),keys:async()=>[],match:async()=>new Response('offline')},fetch:async()=>{network++;throw Error('offline')}};
vm.runInNewContext(fs.readFileSync('public/sw.js','utf8'),ctx);
let work;handlers.install({waitUntil:p=>work=p});await work;assert.deepEqual(added,['/offline.html']);
for(const path of ['/api/shop','/api/slips','/payment','/account','/account/orders/0001','/admin','/auth/callback']){response=null;handlers.fetch({request:{url:'https://shop.test'+path,method:'GET',mode:'navigate'},respondWith:p=>response=p});assert.equal(response,null,path)}
handlers.fetch({request:{url:'https://shop.test/store',method:'GET',mode:'navigate'},respondWith:p=>response=p});assert.equal(await(await response).text(),'offline');assert.equal(network,1);console.log('PWA: offline fallback works; private routes untouched; only public offline notice cached');})();
