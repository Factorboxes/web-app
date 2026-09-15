import {z} from 'zod';
import {createHash} from 'node:crypto';
import {db} from '@/lib/server';
import {identity} from '@/lib/member';
import {prefsFor,pushConfigured,kickNotifications} from '@/lib/notifications/server';
import {subscriptionSchema,preferenceSchema} from '@/lib/notifications/validation';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=60;
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(request:Request){try{
 const user=await identity();if(!user)return json({error:'กรุณาเข้าสู่ระบบเพื่อดูการแจ้งเตือน'},401);
 const url=new URL(request.url),id=url.searchParams.get('id');
 if(id){z.string().uuid().parse(id);const notification=await db().prepare('SELECT id,kind,title,body,url,read_at,created_at FROM fb_notifications WHERE id=? AND member_id=? AND expires_at>now()').bind(id,user.id).first();return notification?json({notification}):json({error:'ไม่พบข้อความของบัญชีนี้'},404)}
 if(url.searchParams.get('count'))return json({counts:await db().prepare('SELECT count(*) AS unread FROM fb_notifications WHERE member_id=? AND read_at IS NULL').bind(user.id).first()});
 const preferences=await prefsFor(user.id);
 const page=Math.max(1,Math.min(1000,Number(url.searchParams.get('page'))||1));
 const messages=(await db().prepare('SELECT id,kind,title,body,url,read_at,created_at FROM fb_notifications WHERE member_id=? ORDER BY created_at DESC LIMIT 25 OFFSET ?').bind(user.id,(Math.floor(page)-1)*25).all()).results;
 const counts=await db().prepare('SELECT count(*) AS total,count(*) FILTER(WHERE read_at IS NULL) AS unread FROM fb_notifications WHERE member_id=?').bind(user.id).first();
 return json({preferences,messages,counts,page,configured:pushConfigured(),publicKey:pushConfigured()?process.env.WEB_PUSH_PUBLIC_KEY:null});
 }catch{return json({error:'โหลดการแจ้งเตือนไม่สำเร็จ กรุณาติดต่อร้านหรือลองใหม่'},503)}}
export async function POST(request:Request){try{
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'คำขอไม่ถูกต้อง'},403);
 const user=await identity();if(!user)return json({error:'กรุณาเข้าสู่ระบบ'},401);
 if(Number(request.headers.get('content-length')||0)>24000)return json({error:'ข้อมูลใหญ่เกินไป'},413);
 const raw=await request.text();if(raw.length>24000)return json({error:'ข้อมูลใหญ่เกินไป'},413);const body=JSON.parse(raw);
 if(body.action==='preferences'){
  const p=preferenceSchema.parse(body.preferences);
  await db().prepare(`INSERT INTO fb_notification_preferences(member_id,orders,marketing,cart_reminders,reorder_reminders) VALUES(?,?,?,?,?) ON CONFLICT(member_id) DO UPDATE SET orders=excluded.orders,marketing=excluded.marketing,cart_reminders=excluded.cart_reminders,reorder_reminders=excluded.reorder_reminders,updated_at=now()`).bind(user.id,p.orders,p.marketing,p.marketing&&p.cart_reminders,p.marketing&&p.reorder_reminders).run();
  if(!p.marketing||!p.cart_reminders)await db().prepare('DELETE FROM fb_notification_carts WHERE member_id=?').bind(user.id).run();return json({ok:true});
 }
 if(body.action==='subscribe'){
  if(!pushConfigured())return json({error:'ร้านยังไม่ได้เปิดระบบแจ้งเตือนบนมือถือ'},503);
  const sub=subscriptionSchema.parse(body.subscription);await prefsFor(user.id);
  // Knowing a browser's private subscription permits rebinding that device, but never another user's inbox.
  await db().prepare(`INSERT INTO fb_push_subscriptions(member_id,endpoint,p256dh,auth) VALUES(?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET member_id=excluded.member_id,p256dh=excluded.p256dh,auth=excluded.auth,active=true,updated_at=now()`).bind(user.id,sub.endpoint,sub.keys.p256dh,sub.keys.auth).run();return json({ok:true});
 }
 if(body.action==='unsubscribe'){
  const endpoint=z.string().max(2048).parse(body.endpoint);await db().prepare('UPDATE fb_push_subscriptions SET active=false,updated_at=now() WHERE endpoint=? AND member_id=?').bind(endpoint,user.id).run();return json({ok:true});
 }
 if(body.action==='read'){
  const id=z.string().uuid().optional().parse(body.id);if(id)await db().prepare('UPDATE fb_notifications SET read_at=COALESCE(read_at,now()) WHERE member_id=? AND id=?').bind(user.id,id).run();else await db().prepare('UPDATE fb_notifications SET read_at=COALESCE(read_at,now()) WHERE member_id=? AND read_at IS NULL').bind(user.id).run();return json({ok:true});
 }
 if(body.action==='test'){
  if(!pushConfigured())return json({error:'ร้านยังไม่ได้ตั้งค่าระบบแจ้งเตือน'},503);
  await db().prepare("SELECT fb_add_notification(?,'test','🔔 เปิดรับแจ้งเตือนแล้ว','FACTORBOXES พร้อมแจ้งความคืบหน้าของออเดอร์คุณ','/notifications','test:'||floor(extract(epoch FROM now())/60),'',false,now()+interval '10 minutes')").bind(user.id).first();kickNotifications();return json({ok:true});
 }
 if(body.action==='cart'){
  const data=z.object({items:z.array(z.object({id:z.string().max(40),qty:z.number().int().min(1).max(100000)})).max(100),checkoutKey:z.string().uuid()}).parse(body);
  const p=await prefsFor(user.id);if(!p?.marketing||!p?.cart_reminders)return json({ok:true,tracked:false});
  const products=(await db().prepare('SELECT id FROM products WHERE active=1').all()).results;const allowed=new Set(products.map(p=>p.id));
  const items=data.items.filter(i=>allowed.has(i.id)).sort((a,b)=>a.id.localeCompare(b.id));const fp=createHash('sha256').update(JSON.stringify(items)).digest('hex');
  await db().prepare(`INSERT INTO fb_notification_carts(member_id,items,fingerprint,item_count,checkout_key)
 SELECT ?,?::jsonb,?,?,?::uuid WHERE NOT EXISTS(SELECT 1 FROM orders WHERE id=?)
 ON CONFLICT(member_id) DO UPDATE SET checkout_key=excluded.checkout_key,items=excluded.items,fingerprint=excluded.fingerprint,item_count=excluded.item_count,activity_at=now(),revision=CASE WHEN fb_notification_carts.fingerprint=excluded.fingerprint THEN fb_notification_carts.revision ELSE gen_random_uuid() END`).bind(user.id,JSON.stringify(items),fp,items.length,data.checkoutKey,data.checkoutKey).run();return json({ok:true,tracked:true});
 }
 return json({error:'คำขอไม่ถูกต้อง'},400);
 }catch(e){return json({error:e instanceof z.ZodError?'ข้อมูลไม่ถูกต้อง':'บันทึกการแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่'},e instanceof z.ZodError?400:503)}}
