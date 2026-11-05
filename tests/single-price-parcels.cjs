const {PGlite}=require('@electric-sql/pglite'),fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');
(async()=>{
 const pg=new PGlite(); await pg.exec('CREATE ROLE anon;CREATE ROLE authenticated;');
 for(const f of ['01-schema.sql','02-products.sql','04-order-numbers.sql','18-coupon-quotas.sql','19-special-coupons.sql'])await pg.exec(fs.readFileSync('supabase/'+f,'utf8'));
 const database={prepare(sql){return {bind(...v){this.v=v;return this},async exec(){let i=0;return pg.query(sql.replaceAll('?',()=>'$'+(++i)),this.v||[])},async first(){return(await this.exec()).rows[0]||null},async all(){return {results:(await this.exec()).rows}},async run(){return this.exec()}}},async batch(qs){await pg.exec('BEGIN');try{for(const q of qs)await q.exec();await pg.exec('COMMIT')}catch(e){await pg.exec('ROLLBACK');throw e}}};
 const mods={'./database':{database},'./member':{identity:async()=>null},'./admin-permissions':{permissionKeys:[],parsePermissions:()=>[]},'./packing-source.json':JSON.parse(fs.readFileSync('lib/packing-source.json')),'@/lib/notifications/server':{kickNotifications(){}},'@/lib/member':{identity:async()=>null},'@/lib/carriers-server':{getCarriers:async()=>[]},zod:require('zod')};
 function load(file){const exports={};new Function('exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(exports,k=>{if(!(k in mods))throw Error('Missing module '+k);return mods[k]});return exports;}
 mods['./mixed-packing']=load('lib/mixed-packing.ts');const c=mods['./catalog']=mods['@/lib/catalog']=load('lib/catalog.ts'); const server=mods['@/lib/server']=load('lib/server.ts');
 const settings={...c.defaultSettings,pricingReady:true,shippingPerParcel:150};
 const item=(id,qty)=>({...c.initialProducts.find(p=>p.id===id),qty});
 assert.equal(c.initialProducts.length,43);
 for(const p of c.initialProducts)assert(p.price>0&&p.tiers.every(v=>v===p.price));
 let t=c.totals([item('SX',1000),item('A',400)],settings);
 assert.equal(t.netSubtotal,113200);assert.equal(t.vat,7924);assert.equal(t.parcelCount,2);assert.equal(t.shipping,30000);assert.equal(t.total,151124);
 assert.equal(c.totals([item('SX',1001)],settings).parcelCount,2);
 assert.equal(c.totals([item('SX',999)],settings).parcelCount,1);
 assert.equal(c.totals([item('SX',1000)],{...settings,shippingPerParcel:null}).shippingReady,false);
 assert.equal(c.totals([item('OO-P',100)],settings).shippingReady,false);
 assert.equal(c.totals([{...item('SX',1000),parcelWeightKg:25.01}],settings).shippingReady,false);
 for(const p of c.initialProducts.filter(p=>p.parcelCapacity))for(const qty of [1,p.parcelCapacity,p.parcelCapacity+1,99999]){
  const t=c.totals([{...p,qty}],settings),pack=t.packing[0];assert.equal(pack.parcels,Math.ceil(qty/p.parcelCapacity));assert(pack.lastWeightKg<=25);assert.equal(pack.full*p.parcelCapacity+pack.remaining,qty);
 }
 const mixed=c.totals([item('A',300),item('B',250),item('C',150),item('D',220)],settings);
 assert.equal(mixed.parcelCount,5);assert.equal(mixed.shipping,75000);
 const found={};for(const g of mixed.parcelGroups){assert(g.weightKg<=25);for(const l of g.lines)found[l.id]=(found[l.id]||0)+l.qty*g.count;}assert.deepEqual(found,{D:220,C:150,B:250,A:300});
 for(let k=1;k<=50;k++){
  const sample=['A','B','C','D','SX','H'].map((id,i)=>item(id,(k*137+i*83)%1777+1));
  const packed=c.totals(sample,settings);const quantities={};
  for(const g of packed.parcelGroups){assert(g.weightKg<=25);for(const l of g.lines)quantities[l.id]=(quantities[l.id]||0)+l.qty*g.count;}
  for(const i of sample)assert.equal(quantities[i.id],i.qty);
  assert.equal(packed.parcelCount,packed.parcelGroups.reduce((n,g)=>n+g.count,0));
  assert.equal(c.totals([...sample].reverse(),settings).parcelCount,packed.parcelCount);
 }
 console.log('Mixed example:',JSON.stringify(mixed.parcelGroups));
 const coupons={code:'R5',scope:'regular',kind:'percent',value:500,minimum:0,active:1,ends_at:null},special={...coupons,code:'S3',scope:'special',value:300};
 t=c.totals([item('SX',1000)],settings,coupons,special);assert.equal(t.couponDiscount,2900);assert.equal(t.specialDiscount,1653);assert.equal(t.netSubtotal,53447);assert.equal(t.vat,3741);assert.equal(t.total,72188);
 const before=await server.catalog();assert.equal(before.settings.pricingReady,false);
 const migration=fs.readFileSync('supabase/23-single-price-parcel-shipping.sql','utf8');await pg.exec(migration);await pg.exec(migration);
 let data=await server.catalog();assert.equal(data.settings.pricingReady,true);assert.equal(data.products.find(p=>p.id==='SX').price,58);assert.equal(data.products.find(p=>p.id==='OO-P').parcelCapacity,null);assert.equal(data.products.find(p=>p.id==='I3').active,0);
 // A re-run must not reset merchant edits or stored rate.
 await pg.exec("UPDATE products SET price=59 WHERE id='SX'");await pg.exec(migration);assert.equal((await server.catalog()).products.find(p=>p.id==='SX').price,59);await pg.exec("UPDATE products SET price=58 WHERE id='SX'");
 await pg.query("INSERT INTO settings(id,value) VALUES('shop',$1) ON CONFLICT(id) DO UPDATE SET value=excluded.value",[JSON.stringify(settings)]);
 mods['@/lib/carriers']=load('lib/carriers.ts');mods['./server']=server;mods['./coupon-rules']=load('lib/coupon-rules.ts');mods['@/lib/coupons']=load('lib/coupons.ts');
 const route=load('app/api/shop/route.ts');
 const request=body=>new Request('https://shop.test/api/shop',{method:'POST',headers:{origin:'https://shop.test','content-type':'application/json'},body:JSON.stringify(body)});
 const input={action:'order',key:crypto.randomUUID(),customer:'Test buyer',phone:'0812345678',address:'Test shipping address',postcode:'10110',tax:'',items:[{id:'SX',qty:1000},{id:'A',qty:400}],total:1,shipping:1};
 let response=await route.POST(request(input));assert.equal(response.status,200,JSON.stringify(await response.clone().json()));const result=await response.json();assert.equal(result.order.total,151124);
 let order=(await pg.query('SELECT * FROM orders WHERE id=$1',[input.key])).rows[0];assert.equal(JSON.parse(order.items)[0].packing.parcels,2);assert.equal(order.subtotal-order.vat,113200);assert.equal(order.subtotal+order.shipping,order.total);
 assert.equal((await (await route.POST(request(input))).json()).order.token,result.order.token);
 response=await route.POST(request({...input,key:crypto.randomUUID(),items:[{id:'OO-P',qty:100}]}));assert.equal(response.status,400);
 response=await route.POST(request({...input,key:crypto.randomUUID(),items:[{id:'SX',qty:100},{id:'SX',qty:100}]}));assert.equal(response.status,400);
 await pg.exec("INSERT INTO coupons(code,kind,value,minimum,active,scope) VALUES('R5','percent',500,0,1,'regular'),('S3','percent',300,0,1,'special')");
 response=await route.POST(request({...input,key:crypto.randomUUID(),items:[{id:'SX',qty:1000}],coupon:'R5',special:'S3'}));assert.equal(response.status,200,JSON.stringify(await response.clone().json()));assert.equal((await response.json()).order.total,72188);
 // Unknown shipping rate must fail closed at the actual API.
 await pg.query("UPDATE settings SET value=$1 WHERE id='shop'",[JSON.stringify({...settings,shippingPerParcel:null})]);
 response=await route.POST(request({...input,key:crypto.randomUUID()}));assert.equal(response.status,400);
 // Source image must be the only price-list viewer on the guide.
 assert.equal((fs.readFileSync('app/guide/screen.tsx','utf8').match(/<PriceListViewer /g)||[]).length,1);
 await pg.close();console.log('PASS: 43 prices, VAT, parcel boundaries and 25kg cap, missing configuration, coupon stacking + SQL quota trigger, real order API, authoritative amounts, retry, idempotent migration and one price sheet.');
})().catch(e=>{console.error(e);process.exit(1)});
