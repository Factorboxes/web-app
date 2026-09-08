import {z} from 'zod';
import {identity} from '@/lib/member';
import {db,isAdmin,catalog} from '@/lib/server';
import {totals} from '@/lib/catalog';
import {validCoupon} from '@/lib/coupons';
export const dynamic='force-dynamic';
const code=z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{2,30}$/);
export async function GET(){try{if(!await isAdmin('coupons'))return Response.json({error:'ไม่มีสิทธิ์เข้าถึง'},{status:403});return Response.json({coupons:(await db().prepare('SELECT * FROM coupons ORDER BY code').all()).results},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error(e);return Response.json({error:'โหลด CODE ไม่สำเร็จ'},{status:503});}}
export async function POST(request:Request){try{if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'คำขอไม่ถูกต้อง'},{status:403});const body=z.record(z.unknown()).parse(await request.json());if(body.action==='apply'){const b=z.object({code,items:z.array(z.object({id:z.string(),qty:z.number().int().min(1).max(100000)})).min(1).max(100)}).parse(body);const c=await catalog();if(new Set(b.items.map(i=>i.id)).size!==b.items.length)throw Error('สินค้าซ้ำ กรุณาโหลดตะกร้าใหม่');const items=b.items.map(i=>{const p=c.products.find(p=>p.id===i.id&&p.active);if(!p)throw Error('สินค้าบางรายการไม่พร้อมขาย');return {...p,qty:i.qty}});const before=totals(items,c.settings);const coupon=await validCoupon(b.code,before.tierSubtotal,(await identity())?.id);return Response.json({coupon,discount:totals(items,c.settings,coupon).couponDiscount},{headers:{'Cache-Control':'no-store'}});}if(!await isAdmin('coupons'))return Response.json({error:'ไม่มีสิทธิ์เข้าถึง'},{status:403});const c=z.object({code,kind:z.enum(['fixed','percent']),value:z.number().int().min(1).max(100000000),minimum:z.number().int().min(0).max(100000000),active:z.number().int().min(0).max(1),ends_at:z.string().datetime({offset:true}).nullable(),starts_at:z.string().datetime({offset:true}).nullable().default(null),max_uses:z.number().int().min(1).max(100000000).nullable().default(null),per_member:z.number().int().min(1).max(100000000).nullable().default(null)}).parse(body);if(c.kind==='percent'&&c.value>10000)throw Error('ส่วนลดเปอร์เซ็นต์ต้องไม่เกิน 100%');if(c.starts_at&&c.ends_at&&Date.parse(c.starts_at)>Date.parse(c.ends_at))throw Error('วันเริ่มต้องไม่เกินวันหมดอายุ');const action=z.enum(['create','update']).parse(body.action??'create');
if(action==='update'){
 const saved=await db().prepare('UPDATE coupons SET kind=?,value=?,minimum=?,active=?,ends_at=?,starts_at=?,max_uses=?,per_member=? WHERE code=? RETURNING code').bind(c.kind,c.value,c.minimum,c.active,c.ends_at,c.starts_at,c.max_uses,c.per_member,c.code).first();
 if(!saved)return Response.json({error:'ไม่พบ CODE ที่จะแก้ไข กรุณารีเฟรชข้อมูล'},{status:404});
}else{
 await db().prepare('INSERT INTO coupons (code,kind,value,minimum,active,ends_at,starts_at,max_uses,per_member) VALUES (?,?,?,?,?,?,?,?,?)').bind(c.code,c.kind,c.value,c.minimum,c.active,c.ends_at,c.starts_at,c.max_uses,c.per_member).run();
}
return Response.json({ok:true});}catch(e){console.error(e);const sqlCode=(e as {code?:string})?.code;
if(sqlCode==='42703'||sqlCode==='42P01')return Response.json({error:'ฐานข้อมูล CODE ยังไม่อัปเดต กรุณารันไฟล์ 18-coupon-quotas.sql ใน Supabase SQL Editor ของโปรเจกต์ที่เว็บใช้งาน แล้วลองบันทึกอีกครั้ง ข้อมูลที่กรอกยังอยู่'},{status:503});
if(sqlCode==='23505')return Response.json({error:'รหัส CODE นี้มีอยู่แล้ว กรุณาใช้ชื่อใหม่ หรือเลือกแก้ไขรายการเดิม'},{status:409});
return Response.json({error:e instanceof z.ZodError?'ตรวจสอบ CODE และเงื่อนไขให้ถูกต้อง':e instanceof Error?e.message:'บันทึกไม่สำเร็จ'},{status:400});}}
