const {PGlite}=require('@electric-sql/pglite'),fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');
(async()=>{
 const pg=new PGlite();await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
 for(const file of ['01-schema.sql','04-order-numbers.sql'])await pg.exec(fs.readFileSync('supabase/'+file,'utf8'));
 let user={id:'member-a'};
 const adapter={prepare(sql){return {bind(...values){this.values=values;return this},async all(){let i=0;return {results:(await pg.query(sql.replaceAll('?',()=>'$'+(++i)),this.values)).rows}}}}};
 function load(file){const exports={};const mods={'zod':require('zod'),'@/lib/member':{identity:async()=>user},'@/lib/server':{db:()=>adapter}};new Function('exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports,k=>mods[k]);return exports}
 const route=load('app/api/tracking/route.ts'),view=load('lib/tracking-view.ts');
 const id=crypto.randomUUID(),token=crypto.randomUUID();
 async function insert(orderId,access,member,tracking){await pg.query("INSERT INTO orders(id,token,created,customer,phone,address,tax,items,subtotal,shipping,vat,total,status,carrier,tracking,payment,member_id) VALUES($1,$2,'2026-09-07T10:20:00Z','Test','0812345678','Test address','','[]',100,0,7,100,'จัดส่งแล้ว','J&T Express',$3,'ชำระแล้ว',$4)",[orderId,access,tracking,member])}
 await insert(id,token,'member-a','TH0123456789');const other=crypto.randomUUID();await insert(crypto.randomUUID(),other,'member-b','OTHER123');
 const req=(q,origin='https://shop.test')=>new Request('https://shop.test/api/tracking',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({query:q})});
 assert.equal((await route.POST(req('0000','https://other.test'))).status,403);
 user=null;assert.equal((await route.POST(req('0000'))).status,401);user={id:'member-a'};
 for(const q of ['0','0000','th0123456789','FB-'+id.slice(0,8).toUpperCase()]){const r=await route.POST(req(q));assert.equal(r.status,200);assert.equal((await r.json()).token,token)}
 assert.equal((await route.POST(req('0001'))).status,404);assert.equal((await route.POST(req('OTHER123'))).status,404);
 assert.equal((await route.POST(req("' OR 1=1 --"))).status,404);assert.equal((await route.POST(req('x'.repeat(101)))).status,400);
 await insert(crypto.randomUUID(),crypto.randomUUID(),'member-a','TH0123456789');assert.equal((await route.POST(req('TH0123456789'))).status,409);
 user={id:'member-b'};assert.equal((await route.POST(req('0000'))).status,404);
 assert.equal(view.trackingToken(token),token);assert.equal(view.trackingToken('https://shop.test/track?token='+token),token);assert.equal(view.trackingToken('https://shop.test/track?token=0000'),null);assert.equal(view.trackingToken('javascript:alert(1)'),null);
 assert.equal(view.shipmentStage('รอชำระเงิน'),0);assert.equal(view.shipmentStage('กำลังแพ็ก'),1);assert.equal(view.shipmentStage('จัดส่งแล้ว'),2);assert.equal(view.shipmentStage('ส่งสำเร็จ'),3);assert.equal(view.shipmentStage('ยกเลิก'),-1);assert.equal(view.carrierTrackingPage('Unknown carrier'),null);
 await pg.close();console.log('PASS member-only tracking lookup, zero-padded numbers, legacy numbers, duplicate references, origin and cancellation handling.');
})().catch(e=>{console.error(e);process.exit(1)});
