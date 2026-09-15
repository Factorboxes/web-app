const {PGlite}=require('@electric-sql/pglite'),fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');
const A='00000000-0000-4000-8000-000000000001',B='00000000-0000-4000-8000-000000000002';
(async()=>{const pg=new PGlite();await pg.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);CREATE TABLE orders(id text PRIMARY KEY,order_no bigint,member_id text,status text,payment text,carrier text DEFAULT '',tracking text DEFAULT '',created text);CREATE TABLE coupons(code text PRIMARY KEY,kind text,value bigint,minimum bigint,active bigint,starts_at text,ends_at text,max_uses bigint,used_total bigint,per_member bigint,scope text);CREATE TABLE coupon_redemptions(order_id text,member_id text,code text);CREATE TABLE products(id text,active int);INSERT INTO products VALUES('SX',1);`);
await pg.query('INSERT INTO auth.users VALUES($1,$2,now()),($3,$4,now())',[A,'a@example.test',B,'b@example.test']);const migration=fs.readFileSync('supabase/21-web-push-notifications.sql','utf8');await pg.exec(migration);await pg.exec(migration);
const one=async(sql,v=[])=> (await pg.query(sql,v)).rows[0];const count=async(table)=>Number((await one('SELECT count(*) AS n FROM '+table)).n);
await pg.query('INSERT INTO fb_notification_preferences(member_id,marketing,cart_reminders,reorder_reminders) VALUES($1,true,true,true),($2,false,false,false)',[A,B]);
await pg.query("INSERT INTO fb_push_subscriptions(member_id,endpoint,p256dh,auth) VALUES($1,'https://fcm.googleapis.com/fcm/send/mockA',$3,$4),($2,'https://fcm.googleapis.com/fcm/send/mockB',$3,$4)",[A,B,'B'.repeat(87),'C'.repeat(22)]);
const order='11111111-1111-4111-8111-111111111111';await pg.query("INSERT INTO orders(id,member_id,created,status,payment) VALUES($1,$2,now()::text,'รอชำระเงิน','รอชำระ')",[order,A]);assert.equal(await count('fb_notifications'),1);assert.equal(await count('fb_push_deliveries'),1);
await pg.query("UPDATE orders SET payment='ชำระแล้ว' WHERE id=$1",[order]);await pg.query("UPDATE orders SET payment='ชำระแล้ว' WHERE id=$1",[order]);assert.equal(await count('fb_notifications'),2);
await pg.query("UPDATE orders SET status='กำลังแพ็ก' WHERE id=$1",[order]);assert.equal(await count('fb_notifications'),3);
await pg.query("UPDATE orders SET status='จัดส่งแล้ว',carrier='J&T',tracking='TH123' WHERE id=$1",[order]);await pg.query("UPDATE orders SET status='ส่งสำเร็จ' WHERE id=$1",[order]);assert.equal(await count('fb_notifications'),4);assert.match((await one("SELECT body FROM fb_notifications WHERE kind='shipped'")).body,/TH123/);
await pg.query("INSERT INTO orders(id,created,status,payment) VALUES('guest',now()::text,'รอชำระเงิน','รอชำระ')");assert.equal(await count('fb_notifications'),4);
await pg.query("SELECT fb_add_notification($1,'promotion','promo','body','/store','opt-out','',true)",[B]);assert.equal(await count('fb_notifications'),4);
let user={id:A,email:'a@example.test'},admin=true;let transport=[],mode='ok',afterCalls=[];
function statement(sql, values=[]) {
 return {
  bind(...v) { return statement(sql,v); },
  async exec() { let n=0; return pg.query(sql.replaceAll('?',()=>'$'+ ++n),values); },
  async first() { return (await this.exec()).rows[0]||null; },
  async all() { return {results:(await this.exec()).rows}; },
  async run() { return {meta:{changes:(await this.exec()).affectedRows}}; }
 };
}
const db={prepare:statement,async batch(ss) {
 await pg.exec('BEGIN');
 try { for(const s of ss) await s.exec(); await pg.exec('COMMIT'); }
 catch(e) { await pg.exec('ROLLBACK'); throw e; }
}};
const modules={};
function mod(path) {
 if(modules[path])return modules[path];
 const out={}; modules[path]=out;
 function dependency(k) {
  if(k==='server-only')return {};
  if(k==='next/server')return {after:f=>afterCalls.push(f)};
  if(k==='web-push')return {sendNotification:async(sub,payload)=>{
   transport.push({sub,payload:JSON.parse(payload)});
   if(mode==='gone')throw {statusCode:410};
   if(mode==='retry')throw {statusCode:503};
  }};
  if(k==='@/lib/server')return {db:()=>db,isAdmin:async()=>admin};
  if(k==='@/lib/member')return {identity:async()=>user};
  if(k==='@/lib/coupon-rules')return mod('lib/coupon-rules.ts');
  if(k==='@/lib/notifications/server')return mod('lib/notifications/server.ts');
  if(k==='@/lib/notifications/validation'||k==='./validation')return mod('lib/notifications/validation.ts');
  return require(k);
 }
 new Function('exports','require',ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(out,dependency);
 return out;
}
const service=mod('lib/notifications/server.ts'),route=mod('app/api/notifications/route.ts'),campaign=mod('app/api/admin-notifications/route.ts'),validation=mod('lib/notifications/validation.ts');
const req=(body,path='notifications')=>new Request('https://shop.test/api/'+path,{method:'POST',headers:{origin:'https://shop.test','content-type':'application/json'},body:JSON.stringify(body)});
let r=await route.GET(new Request('https://shop.test/api/notifications'));assert.equal(r.status,200);assert.equal((await r.json()).messages.length,4);
const nid=(await one('SELECT id FROM fb_notifications LIMIT 1')).id;user={id:B,email:'b@example.test'};assert.equal((await route.GET(new Request('https://shop.test/api/notifications?id='+nid))).status,404);await route.POST(req({action:'read',id:nid}));assert.equal((await one('SELECT read_at FROM fb_notifications WHERE id=$1',[nid])).read_at,null);user=null;assert.equal((await route.GET(new Request('https://shop.test/api/notifications'))).status,401);user={id:A,email:'a@example.test'};
assert.equal(validation.safePushEndpoint('https://127.0.0.1/a'),false);assert.equal(validation.safePushEndpoint('https://fcm.googleapis.com.evil.test/a'),false);assert.equal(validation.safePushEndpoint('https://user@fcm.googleapis.com/a'),false);
process.env.WEB_PUSH_PUBLIC_KEY='test';process.env.WEB_PUSH_PRIVATE_KEY='test';process.env.WEB_PUSH_SUBJECT='https://shop.test';
assert.equal((await route.POST(req({action:'subscribe',subscription:{endpoint:'http://localhost',keys:{p256dh:'B'.repeat(87),auth:'C'.repeat(22)}}}))).status,400);
assert.equal((await route.POST(new Request('https://shop.test/api/notifications',{method:'POST',headers:{origin:'https://evil.test'},body:'{}'}))).status,403);
await service.drainNotifications();assert.equal(transport.length,4);assert.deepEqual(Object.keys(transport[0].payload),['notificationId']);await service.drainNotifications();assert.equal(transport.length,4);
// Failed payment transaction must not enqueue a paid notification.
await pg.exec('BEGIN');await pg.query("INSERT INTO orders(id,member_id,created,status,payment) VALUES('rollback',$1,now()::text,'รอชำระเงิน','ชำระแล้ว')",[A]);await pg.exec('ROLLBACK');assert.equal(await count('fb_notifications'),4);
// Cart tracking & cancellation on purchase.
const cartKey='22222222-2222-4222-8222-222222222222';assert.equal((await route.POST(req({action:'cart',items:[{id:'SX',qty:100}],checkoutKey:cartKey}))).status,200);
await pg.query("UPDATE orders SET created=(now()-interval '5 hours')::text WHERE id=$1",[order]);
await pg.exec("UPDATE fb_notification_carts SET activity_at=now()-interval '4 hours';UPDATE fb_notification_settings SET cart_enabled=true,reorder_enabled=true;");await service.makeReminders();assert.equal(Number((await one("SELECT count(*) AS n FROM fb_notifications WHERE kind='cart'")).n),1);await service.makeReminders();assert.equal(Number((await one("SELECT count(*) AS n FROM fb_notifications WHERE kind='cart'")).n),1);
const delivery=await one("SELECT d.*,s.member_id,s.endpoint,n.kind,n.marketing,n.source_id,n.expires_at FROM fb_push_deliveries d JOIN fb_notifications n ON n.id=d.notification_id JOIN fb_push_subscriptions s ON s.id=d.subscription_id WHERE n.kind='cart'");assert.equal(await service.deliveryAllowed(delivery),true);
await pg.query("INSERT INTO orders(id,member_id,created,status,payment) VALUES($1,$2,now()::text,'รอชำระเงิน','รอชำระ')",[cartKey,A]);assert.equal(await count('fb_notification_carts'),0);assert.equal(await service.deliveryAllowed(delivery),false);
await route.POST(req({action:'cart',items:[{id:'SX',qty:100}],checkoutKey:cartKey}));assert.equal(await count('fb_notification_carts'),0);
// Simulate a cart write racing an order commit: checkout-key lookup still suppresses it.
await pg.query("INSERT INTO fb_notification_carts(member_id,checkout_key,revision,fingerprint,item_count,activity_at) VALUES($1,$2,$3,'race',1,now()-interval '4 hours')",[A,cartKey,delivery.source_id]);
assert.equal(await service.deliveryAllowed(delivery),false,'converted checkout key must suppress a racing cart snapshot');
await pg.exec('DELETE FROM fb_notification_carts');
// Campaign preview/send/retry, opt-out isolation and permissions.
const payload={action:'preview',id:'33333333-3333-4333-8333-333333333333',kind:'promotion',title:'Promo title',body:'Promo body',url:'/store'};r=await campaign.POST(req(payload,'admin-notifications'));assert.equal(r.status,200);assert.equal((await r.json()).recipients,1);payload.action='send';r=await campaign.POST(req(payload,'admin-notifications'));assert.equal(r.status,200,await r.clone().text());assert.equal((await r.json()).recipients,1);await campaign.POST(req(payload,'admin-notifications'));assert.equal(await count('fb_notification_campaigns'),1);
admin=false;assert.equal((await campaign.POST(req({...payload,id:crypto.randomUUID()},'admin-notifications'))).status,403);admin=true;
await pg.query("INSERT INTO coupons VALUES('SAVE','fixed',500,0,1,NULL,NULL,100,0,NULL,'regular')");r=await campaign.POST(req({...payload,id:crypto.randomUUID(),kind:'coupon',coupon:'SAVE'},'admin-notifications'));assert.equal(r.status,200,await r.clone().text());const couponDelivery=await one("SELECT d.*,s.member_id,s.endpoint,n.kind,n.marketing,n.source_id,n.expires_at FROM fb_push_deliveries d JOIN fb_notifications n ON n.id=d.notification_id JOIN fb_push_subscriptions s ON s.id=d.subscription_id WHERE n.kind='coupon'");assert.equal(await service.deliveryAllowed(couponDelivery),true);await pg.query("UPDATE coupons SET active=0 WHERE code='SAVE'");assert.equal(await service.deliveryAllowed(couponDelivery),false);
// Consent withdrawal and administrator switches stop queued reminders.
await pg.query("UPDATE coupons SET active=1,per_member=1 WHERE code='SAVE'");
await pg.query("INSERT INTO coupon_redemptions VALUES('old',$1,'SAVE')",[A]);
assert.equal(await service.deliveryAllowed(couponDelivery),false,'recheck per-member quota at dispatch');
await route.POST(req({action:'preferences',preferences:{orders:true,marketing:false,cart_reminders:true,reorder_reminders:true}}));
assert.equal(await service.deliveryAllowed(couponDelivery),false);
assert.equal((await one('SELECT cart_reminders FROM fb_notification_preferences WHERE member_id=$1',[A])).cart_reminders,false);
await route.POST(req({action:'preferences',preferences:{orders:true,marketing:true,cart_reminders:true,reorder_reminders:true}}));
// Reorder only after the latest paid order, and no new unpaid order may exist.
await service.makeReminders();assert.equal(Number((await one("SELECT count(*) AS n FROM fb_notifications WHERE kind='reorder'")).n),0);
await pg.query("UPDATE orders SET created=(now()-interval '40 days')::text WHERE member_id=$1",[A]);
await service.makeReminders();await service.makeReminders();assert.equal(Number((await one("SELECT count(*) AS n FROM fb_notifications WHERE kind='reorder'")).n),1);
const reorderDelivery=await one("SELECT d.*,s.member_id,s.endpoint,n.kind,n.marketing,n.source_id,n.expires_at FROM fb_push_deliveries d JOIN fb_notifications n ON n.id=d.notification_id JOIN fb_push_subscriptions s ON s.id=d.subscription_id WHERE n.kind='reorder'");
assert.equal(await service.deliveryAllowed(reorderDelivery),true);
await pg.exec('UPDATE fb_notification_settings SET reorder_enabled=false');assert.equal(await service.deliveryAllowed(reorderDelivery),false);
await pg.exec('UPDATE fb_notification_settings SET reorder_enabled=true');
await pg.query("INSERT INTO orders(id,member_id,created,status,payment) VALUES('new-unpaid',$1,now()::text,'รอชำระเงิน','รอชำระ')",[A]);assert.equal(await service.deliveryAllowed(reorderDelivery),false);
// Isolate a delivery to verify retry, opt-out and provider-expired device handling.
await pg.exec("UPDATE fb_push_deliveries SET status='skipped' WHERE status<>'accepted'");
await pg.query("SELECT fb_add_notification($1,'test','retry','body','/notifications','retry-case')",[A]);
mode='retry';await service.drainNotifications();
let retry=await one("SELECT * FROM fb_push_deliveries WHERE error_code='503'");assert.equal(retry.status,'pending');assert.equal(retry.attempts,1);assert.ok(new Date(retry.available_at)>new Date());
mode='ok';await pg.query("UPDATE fb_push_deliveries SET available_at=now() WHERE id=$1",[retry.id]);await service.drainNotifications();assert.equal((await one('SELECT status FROM fb_push_deliveries WHERE id=$1',[retry.id])).status,'accepted');
await pg.query("SELECT fb_add_notification($1,'test','expired','body','/notifications','gone-case')",[A]);mode='gone';await service.drainNotifications();assert.equal((await one('SELECT active FROM fb_push_subscriptions WHERE member_id=$1',[A])).active,false);
// Reusing a browser subscription for another account never delivers the old account's details.
const sub={endpoint:'https://fcm.googleapis.com/fcm/send/mockA',keys:{p256dh:'B'.repeat(87),auth:'C'.repeat(22)}};
assert.equal((await route.POST(req({action:'subscribe',subscription:sub}))).status,200);
await pg.query("SELECT fb_add_notification($1,'test','rebind','body','/notifications','rebind-case')",[A]);
const rebindDelivery=await one("SELECT d.*,s.member_id FROM fb_push_deliveries d JOIN fb_notifications n ON n.id=d.notification_id JOIN fb_push_subscriptions s ON s.id=d.subscription_id WHERE n.event_key='rebind-case'");
user={id:B,email:'b@example.test'};await route.POST(req({action:'subscribe',subscription:sub}));assert.equal(await service.deliveryAllowed(rebindDelivery),false);
user={id:A,email:'a@example.test'};await route.POST(req({action:'unsubscribe',endpoint:sub.endpoint}));assert.equal((await one('SELECT active FROM fb_push_subscriptions WHERE endpoint=$1',[sub.endpoint])).active,true,'cannot unsubscribe another account');
const cron=mod('app/api/cron/notifications/route.ts');process.env.CRON_SECRET='x'.repeat(32);assert.equal((await cron.GET(new Request('https://shop.test/api/cron/notifications'))).status,401);assert.equal((await cron.GET(new Request('https://shop.test/api/cron/notifications',{headers:{authorization:'Bearer bad'}}))).status,401);
assert.equal(validation.quietMarketing(new Date('2026-09-14T01:59:00Z')),true);assert.equal(validation.quietMarketing(new Date('2026-09-14T02:00:00Z')),false);assert.equal(validation.quietMarketing(new Date('2026-09-14T13:00:00Z')),true);
// No notifications available through the public database role.
await pg.exec('SET ROLE authenticated');await assert.rejects(pg.exec('SELECT * FROM fb_notifications'),/permission denied/);await assert.rejects(pg.query("SELECT fb_add_notification($1,'test','x','x','/','hack')",[A]),/permission denied/);await pg.exec('RESET ROLE');
await pg.close();console.log('PASS notification migration, order states/dedup/rollback/guest, owner-only inbox, CSRF/endpoint guards, worker payload/once queue, cart conversion/late requests, campaigns/idempotency/permissions, coupon expiry guard, RLS');
})().catch(e=>{console.error(e);process.exit(1)});
