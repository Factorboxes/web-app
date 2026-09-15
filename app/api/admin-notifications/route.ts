import {z} from 'zod';
import {db,isAdmin} from '@/lib/server';
import {identity} from '@/lib/member';
import {pushConfigured,kickNotifications,makeReminders} from '@/lib/notifications/server';
import {couponState,type ManagedCoupon} from '@/lib/coupon-rules';
import {safeTarget} from '@/lib/notifications/validation';
export const dynamic='force-dynamic';export const runtime='nodejs';export const maxDuration=60;
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(){try{
 if(!await isAdmin('notifications'))return json({error:'ไม่มีสิทธิ์จัดการแจ้งเตือน'},403);
 const stats=await db().prepare(`SELECT (SELECT count(*) FROM fb_notification_preferences WHERE marketing) AS opted_in,(SELECT count(*) FROM fb_push_subscriptions WHERE active) AS devices,(SELECT count(*) FROM fb_push_deliveries WHERE status IN ('pending','sending')) AS queued,(SELECT count(*) FROM fb_push_deliveries WHERE status='accepted') AS accepted,(SELECT count(*) FROM fb_push_deliveries WHERE status='failed') AS failed,(SELECT count(*) FROM fb_push_deliveries WHERE status='skipped') AS skipped`).first();
 const coupons=(await db().prepare('SELECT * FROM coupons ORDER BY code').all()).results as ManagedCoupon[];
 return json({stats,configured:pushConfigured(),settings:await db().prepare('SELECT * FROM fb_notification_settings WHERE id=1').first(),campaigns:(await db().prepare('SELECT id,kind,title,created_at,recipients FROM fb_notification_campaigns ORDER BY created_at DESC LIMIT 20').all()).results,coupons:coupons.filter(c=>couponState(c)==='ใช้งานได้').map(c=>({code:c.code,kind:c.kind,value:c.value,minimum:c.minimum,scope:c.scope}))});
 }catch{return json({error:'โหลดระบบแจ้งเตือนไม่สำเร็จ กรุณาตรวจว่ารัน SQL 21 แล้ว'},503)}}
export async function POST(request:Request){try{
 if(request.headers.get('origin')!==new URL(request.url).origin||!await isAdmin('notifications'))return json({error:'ไม่มีสิทธิ์จัดการแจ้งเตือน'},403);
 const user=await identity();if(!user)return json({error:'กรุณาเข้าสู่ระบบ'},401);
 const raw=await request.text();if(raw.length>6000)return json({error:'ข้อความยาวเกินไป'},413);const body=JSON.parse(raw);
 if(body.action==='settings'){
 const s=z.object({cart_enabled:z.boolean(),reorder_enabled:z.boolean(),cart_hours:z.number().int().min(1).max(168),reorder_days:z.number().int().min(7).max(365)}).parse(body.settings);
 await db().prepare('UPDATE fb_notification_settings SET cart_enabled=?,reorder_enabled=?,cart_hours=?,reorder_days=? WHERE id=1').bind(s.cart_enabled,s.reorder_enabled,s.cart_hours,s.reorder_days).run();return json({ok:true});}
 if(body.action==='process'){await makeReminders();kickNotifications();return json({ok:true});}
 const c=z.object({action:z.enum(['preview','send']),id:z.string().uuid(),kind:z.enum(['coupon','promotion']),title:z.string().trim().min(3).max(80),body:z.string().trim().min(3).max(220),url:z.string().refine(safeTarget),coupon:z.string().max(30).optional()}).parse(body);
 let coupon:ManagedCoupon|null=null;
 if(c.kind==='coupon'){coupon=await db().prepare('SELECT * FROM coupons WHERE code=?').bind(c.coupon||'').first<ManagedCoupon>();if(!coupon||couponState(coupon)!=='ใช้งานได้')return json({error:'กรุณาเลือก CODE ที่เปิดใช้งานและยังมีสิทธิ์'},400);c.body='CODE '+coupon.code+' · '+c.body+' · ตรวจเงื่อนไขก่อนใช้';}
 const audience=`p.marketing AND EXISTS(SELECT 1 FROM auth.users u WHERE u.id=p.member_id AND u.email_confirmed_at IS NOT NULL) AND (?::text IS NULL OR NOT EXISTS(SELECT 1 FROM coupons c WHERE c.code=? AND c.per_member IS NOT NULL AND (SELECT count(*) FROM coupon_redemptions r WHERE r.code=c.code AND r.member_id=p.member_id::text)>=c.per_member))`;
 const count=await db().prepare('SELECT count(*) AS recipients FROM fb_notification_preferences p WHERE '+audience).bind(coupon?.code||null,coupon?.code||null).first<{recipients:number}>();
 if(c.action==='preview')return json({recipients:count?.recipients||0,title:c.title,body:c.body});
 const expiry=coupon?.ends_at?new Date(Math.min(Date.parse(coupon.ends_at),Date.now()+3*86400000)).toISOString():new Date(Date.now()+3*86400000).toISOString();
 // Idempotent campaign id: a network retry never creates another broadcast.
 await db().prepare(`WITH created AS (INSERT INTO fb_notification_campaigns(id,created_by,kind,title,body,url,coupon_code) VALUES(?,?,?,?,?,?,?) ON CONFLICT DO NOTHING RETURNING id), sent AS (
 SELECT fb_add_notification(p.member_id,?,?,? ,?,'campaign:'||created.id,?,true,?::timestamptz) AS nid FROM fb_notification_preferences p CROSS JOIN created WHERE ${audience}
 ) SELECT count(*) FROM sent WHERE nid IS NOT NULL`).bind(c.id,user.id,c.kind,c.title,c.body,c.url,coupon?.code||null,c.kind,c.title,c.body,c.url,coupon?.code||'',expiry,coupon?.code||null,coupon?.code||null).run();
 // Store the recipient count after the atomic insert-and-enqueue statement.
 await db().prepare("UPDATE fb_notification_campaigns SET recipients=(SELECT count(*) FROM fb_notifications WHERE event_key=?) WHERE id=?").bind('campaign:'+c.id,c.id).run();
 kickNotifications();return json({ok:true,recipients:(await db().prepare('SELECT recipients FROM fb_notification_campaigns WHERE id=?').bind(c.id).first())?.recipients||0});
 }catch(e){return json({error:e instanceof z.ZodError?'กรุณาตรวจข้อมูลข้อความและลิงก์':'ทำรายการแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่'},e instanceof z.ZodError?400:503)}}
