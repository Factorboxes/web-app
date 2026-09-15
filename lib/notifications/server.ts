import 'server-only';
import webPush from 'web-push';
import {after} from 'next/server';
import {db} from '@/lib/server';
import {safePushEndpoint,quietMarketing,retryDelay} from './validation';
export const pushConfigured=()=>Boolean(process.env.WEB_PUSH_PUBLIC_KEY&&process.env.WEB_PUSH_PRIVATE_KEY&&process.env.WEB_PUSH_SUBJECT);
export function kickNotifications(){try{after(async()=>{try{await drainNotifications()}catch{console.error('notification worker failed; queued messages will retry')}})}catch{/* A scheduled worker also processes the durable queue. */}}
export async function prefsFor(member:string){await db().prepare('INSERT INTO fb_notification_preferences(member_id) VALUES(?) ON CONFLICT DO NOTHING').bind(member).run();return await db().prepare('SELECT orders,marketing,cart_reminders,reorder_reminders FROM fb_notification_preferences WHERE member_id=?').bind(member).first()}

type Delivery={id:string;lease:string;attempts:number;notification_id:string;subscription_id:string;member_id:string;endpoint:string;p256dh:string;auth:string;kind:string;marketing:boolean;source_id:string;expires_at:Date|string};
export async function deliveryAllowed(d:Delivery){
 const row=await db().prepare(`SELECT s.active AND s.member_id=n.member_id AND n.expires_at>now()
 AND CASE WHEN n.marketing THEN COALESCE(p.marketing,false) ELSE COALESCE(p.orders,true) END
 AND (n.kind<>'cart' OR (COALESCE(p.cart_reminders,false) AND (SELECT cart_enabled FROM fb_notification_settings WHERE id=1) AND EXISTS(SELECT 1 FROM fb_notification_carts c WHERE c.member_id=n.member_id AND c.revision::text=n.source_id AND c.item_count>0 AND NOT EXISTS(SELECT 1 FROM orders converted WHERE converted.id=c.checkout_key::text) AND c.activity_at < now()-(SELECT cart_hours FROM fb_notification_settings WHERE id=1)*interval '1 hour')))
 AND (n.kind<>'reorder' OR (COALESCE(p.reorder_reminders,false) AND (SELECT reorder_enabled FROM fb_notification_settings WHERE id=1) AND NOT EXISTS(SELECT 1 FROM orders o WHERE o.member_id=n.member_id::text AND o.status<>'ยกเลิก' AND o.created::timestamptz>now()-(SELECT reorder_days FROM fb_notification_settings WHERE id=1)*interval '1 day')))
 AND (n.kind<>'coupon' OR EXISTS(SELECT 1 FROM coupons c WHERE c.code=n.source_id AND c.active=1 AND (NULLIF(c.starts_at,'') IS NULL OR NULLIF(c.starts_at,'')::timestamptz<=now()) AND (NULLIF(c.ends_at,'') IS NULL OR NULLIF(c.ends_at,'')::timestamptz>now()) AND (c.max_uses IS NULL OR COALESCE(c.used_total,0)<c.max_uses) AND (c.per_member IS NULL OR (SELECT count(*) FROM coupon_redemptions r WHERE r.code=c.code AND r.member_id=n.member_id::text)<c.per_member)))
 AND (n.kind NOT IN ('received','paid','packing','shipped') OR EXISTS(SELECT 1 FROM orders o WHERE o.id=n.source_id AND o.member_id=n.member_id::text AND o.status<>'ยกเลิก')) AS allowed
 FROM fb_push_subscriptions s JOIN fb_notifications n ON n.id=? LEFT JOIN fb_notification_preferences p ON p.member_id=n.member_id WHERE s.id=?`).bind(d.notification_id,d.subscription_id).first<{allowed:boolean}>();
 return Boolean(row?.allowed);
}
async function finish(d:Delivery,status:string,code:string|null=null){await db().prepare('UPDATE fb_push_deliveries SET status=?,error_code=?,locked_until=NULL,accepted_at=CASE WHEN ?=\'accepted\' THEN now() ELSE accepted_at END WHERE id=? AND lease=?').bind(status,code,status,d.id,d.lease).run()}
async function deliver(d:Delivery){
 if(!safePushEndpoint(d.endpoint)||!await deliveryAllowed(d)){await finish(d,'skipped','not_eligible');return}
 if(d.marketing&&quietMarketing()){
  await db().prepare("UPDATE fb_push_deliveries SET status='pending',available_at=(date_trunc('day',now() AT TIME ZONE 'Asia/Bangkok')+CASE WHEN EXTRACT(hour FROM now() AT TIME ZONE 'Asia/Bangkok')>=20 THEN interval '1 day' ELSE interval '0 day' END+interval '9 hours') AT TIME ZONE 'Asia/Bangkok',locked_until=NULL,attempts=greatest(0,attempts-1) WHERE id=? AND lease=?").bind(d.id,d.lease).run();return;
 }
 if(d.marketing){const gate=await db().prepare(`INSERT INTO fb_notification_marketing_days(member_id,day,notification_id) VALUES(?,(now() AT TIME ZONE 'Asia/Bangkok')::date,?)
 ON CONFLICT(member_id,day) DO UPDATE SET notification_id=excluded.notification_id WHERE fb_notification_marketing_days.notification_id=excluded.notification_id RETURNING notification_id`).bind(d.member_id,d.notification_id).first();if(!gate){await finish(d,'skipped','daily_marketing_limit');return}}
 try{
  // Payload contains only an opaque notification id. The worker checks the current login before showing details.
  await webPush.sendNotification({endpoint:d.endpoint,keys:{p256dh:d.p256dh,auth:d.auth}},JSON.stringify({notificationId:d.notification_id}),{
   vapidDetails:{subject:process.env.WEB_PUSH_SUBJECT!,publicKey:process.env.WEB_PUSH_PUBLIC_KEY!,privateKey:process.env.WEB_PUSH_PRIVATE_KEY!},TTL:d.marketing?3600:86400,timeout:8000,urgency:'normal'
  });await finish(d,'accepted');
 }catch(e){const status=Number((e as {statusCode?:number}).statusCode)||0;
  if(status===404||status===410){await db().prepare('UPDATE fb_push_subscriptions SET active=false WHERE id=? AND endpoint=?').bind(d.subscription_id,d.endpoint).run();await finish(d,'skipped','expired_subscription');return}
  if(d.attempts>=5||status===400||status===413){await finish(d,'failed',String(status||'transport'));return}
  await db().prepare("UPDATE fb_push_deliveries SET status='pending',available_at=now()+?*interval '1 second',locked_until=NULL,error_code=? WHERE id=? AND lease=?").bind(retryDelay(d.attempts),String(status||'transport'),d.id,d.lease).run();
 }
}
export async function drainNotifications(){
 if(!pushConfigured())return {configured:false,processed:0};
 const rows=(await db().prepare(`WITH due AS (
 SELECT id FROM fb_push_deliveries WHERE (status='pending' AND available_at<=now()) OR (status='sending' AND locked_until<now()) ORDER BY available_at LIMIT 20 FOR UPDATE SKIP LOCKED
 ), claimed AS (UPDATE fb_push_deliveries d SET status='sending',lease=gen_random_uuid(),locked_until=now()+interval '5 minutes',attempts=attempts+1 FROM due WHERE d.id=due.id RETURNING d.*)
 SELECT c.*,s.member_id,s.endpoint,s.p256dh,s.auth,n.kind,n.marketing,n.source_id,n.expires_at FROM claimed c JOIN fb_push_subscriptions s ON s.id=c.subscription_id JOIN fb_notifications n ON n.id=c.notification_id`).all()).results as Delivery[];
 for(let i=0;i<rows.length;i+=5){await Promise.all(rows.slice(i,i+5).map(deliver))}
 return {configured:true,processed:rows.length};
}

export async function makeReminders(){
 await db().batch([
 db().prepare(`SELECT fb_add_notification(c.member_id,'cart','🛒 ยังมีสินค้าในตะกร้าของคุณ','เลือกกล่องไว้แล้ว กลับมาดูตะกร้าและสั่งซื้อได้เลย','/store','cart:'||c.member_id||':'||c.revision,c.revision::text,true,now()+interval '2 days')
 FROM fb_notification_carts c JOIN fb_notification_preferences p ON p.member_id=c.member_id CROSS JOIN fb_notification_settings cfg
 WHERE cfg.id=1 AND cfg.cart_enabled AND p.marketing AND p.cart_reminders AND c.item_count>0 AND c.activity_at<=now()-cfg.cart_hours*interval '1 hour'
 AND c.activity_at>now()-interval '7 days' AND NOT EXISTS(SELECT 1 FROM orders converted WHERE converted.id=c.checkout_key::text) AND NOT EXISTS(SELECT 1 FROM orders o WHERE o.member_id=c.member_id::text AND o.status<>'ยกเลิก' AND o.created::timestamptz>=c.activity_at)
 AND NOT EXISTS(SELECT 1 FROM fb_notifications n WHERE n.member_id=c.member_id AND n.event_key='cart:'||c.member_id||':'||c.revision) LIMIT 100`),
 db().prepare(`WITH eligible AS (SELECT p.member_id,MAX(o.created::timestamptz) AS bought FROM fb_notification_preferences p JOIN orders o ON o.member_id=p.member_id::text AND o.payment='ชำระแล้ว' AND o.status<>'ยกเลิก' CROSS JOIN fb_notification_settings cfg WHERE cfg.id=1 AND cfg.reorder_enabled AND p.marketing AND p.reorder_reminders GROUP BY p.member_id,cfg.reorder_days HAVING MAX(o.created::timestamptz)<=now()-cfg.reorder_days*interval '1 day')
 SELECT fb_add_notification(e.member_id,'reorder','⭐ ถึงเวลาเติมสต็อกกล่องแล้วหรือยัง?','FACTORBOXES พร้อมดูแลออเดอร์ถัดไปของคุณ เลือกกล่องที่ใช้ประจำได้เลย','/store','reorder:'||e.member_id||':'||floor(extract(epoch FROM now())/2592000),'',true,now()+interval '2 days') FROM eligible e
 WHERE NOT EXISTS(SELECT 1 FROM fb_notifications n WHERE n.member_id=e.member_id AND n.kind='reorder' AND n.created_at>now()-interval '30 days')
 AND NOT EXISTS(SELECT 1 FROM orders o WHERE o.member_id=e.member_id::text AND o.status<>'ยกเลิก' AND o.created::timestamptz>now()-(SELECT reorder_days FROM fb_notification_settings WHERE id=1)*interval '1 day') LIMIT 100`),
 db().prepare('UPDATE fb_notification_settings SET last_job_at=now() WHERE id=1')
 ]);
}
