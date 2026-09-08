import {z} from 'zod';
import {identity} from '@/lib/member';
import {db,isAdmin,catalog} from '@/lib/server';
import {totals} from '@/lib/catalog';
import {validCoupon} from '@/lib/coupons';

export const dynamic='force-dynamic';

const code=z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{2,30}$/);

const couponInput=z.object({
 action:z.enum(['create','update']).default('create'),
 code,
 kind:z.enum(['fixed','percent']),
 value:z.number().int().min(1).max(100000000),
 minimum:z.number().int().min(0).max(100000000),
 active:z.number().int().min(0).max(1),
 ends_at:z.string().datetime({offset:true}).nullable(),
 starts_at:z.string().datetime({offset:true}).nullable().default(null),
 max_uses:z.number().int().min(1).max(100000000).nullable().default(null),
 per_member:z.number().int().min(1).max(100000000).nullable().default(null)
});

export async function GET(){
 try{
  if(!await isAdmin('coupons'))return Response.json({error:'ไม่มีสิทธิ์เข้าถึง'},{status:403});
  const result=await db().prepare('SELECT * FROM coupons ORDER BY code').all();
  return Response.json(
   {coupons:result.results||[]},
   {headers:{'Cache-Control':'no-store, no-cache, must-revalidate, max-age=0'}}
  );
 }catch(e){
  console.error(e);
  return Response.json({error:'โหลด CODE ไม่สำเร็จ'},{status:503});
 }
}

export async function POST(request:Request){
 try{
  if(request.headers.get('origin')!==new URL(request.url).origin){
   return Response.json({error:'คำขอไม่ถูกต้อง'},{status:403});
  }

  const body=z.record(z.unknown()).parse(await request.json());

  if(body.action==='apply'){
   const b=z.object({
    action:z.literal('apply'),
    code,
    items:z.array(z.object({
     id:z.string(),
     qty:z.number().int().min(1).max(100000)
    })).min(1).max(100)
   }).parse(body);

   const c=await catalog();
   if(new Set(b.items.map(i=>i.id)).size!==b.items.length)throw Error('สินค้าซ้ำ กรุณาโหลดตะกร้าใหม่');

   const items=b.items.map(i=>{
    const p=c.products.find(p=>p.id===i.id&&p.active);
    if(!p)throw Error('สินค้าบางรายการไม่พร้อมขาย');
    return {...p,qty:i.qty};
   });

   const before=totals(items,c.settings);
   const coupon=await validCoupon(b.code,before.tierSubtotal,(await identity())?.id);
   return Response.json(
    {coupon,discount:totals(items,c.settings,coupon).couponDiscount},
    {headers:{'Cache-Control':'no-store'}}
   );
  }

  if(!await isAdmin('coupons')){
   return Response.json({error:'ไม่มีสิทธิ์เข้าถึง'},{status:403});
  }

  const c=couponInput.parse(body);

  if(c.kind==='percent'&&c.value>10000)throw Error('ส่วนลดเปอร์เซ็นต์ต้องไม่เกิน 100%');
  if(c.starts_at&&c.ends_at&&Date.parse(c.starts_at)>Date.parse(c.ends_at))throw Error('วันเริ่มต้องไม่เกินวันหมดอายุ');

  if(c.action==='create'){
   const exists=await db().prepare('SELECT code FROM coupons WHERE code=? LIMIT 1').bind(c.code).first<{code:string}>();
   if(exists)throw Error('CODE นี้มีอยู่แล้ว กรุณาใช้รหัสใหม่');

   await db().prepare(
    'INSERT INTO coupons (code,kind,value,minimum,active,ends_at,starts_at,max_uses,per_member) VALUES (?,?,?,?,?,?,?,?,?)'
   ).bind(
    c.code,c.kind,c.value,c.minimum,c.active,c.ends_at,c.starts_at,c.max_uses,c.per_member
   ).run();

   const saved=await db().prepare('SELECT code FROM coupons WHERE code=? LIMIT 1').bind(c.code).first<{code:string}>();
   if(!saved)throw Error('สร้าง CODE ไม่สำเร็จ กรุณาลองอีกครั้ง');
  }else{
   const exists=await db().prepare('SELECT code FROM coupons WHERE code=? LIMIT 1').bind(c.code).first<{code:string}>();
   if(!exists)throw Error('ไม่พบ CODE ที่ต้องการแก้ไข');

   await db().prepare(
    'UPDATE coupons SET kind=?,value=?,minimum=?,active=?,ends_at=?,starts_at=?,max_uses=?,per_member=? WHERE code=?'
   ).bind(
    c.kind,c.value,c.minimum,c.active,c.ends_at,c.starts_at,c.max_uses,c.per_member,c.code
   ).run();
  }

  const count=await db().prepare('SELECT COUNT(*) AS total FROM coupons').first<{total:number|string}>();

  return Response.json({
   ok:true,
   action:c.action,
   code:c.code,
   total:Number(count?.total||0)
  },{headers:{'Cache-Control':'no-store'}});
 }catch(e){
  console.error(e);
  const raw=e instanceof Error?e.message:'บันทึกไม่สำเร็จ';
  const unique=/unique|duplicate|constraint/i.test(raw);
  return Response.json({
   error:e instanceof z.ZodError
    ?'ตรวจสอบ CODE และเงื่อนไขให้ถูกต้อง'
    :unique
      ?'CODE นี้มีอยู่แล้ว กรุณาใช้รหัสใหม่'
      :raw
  },{status:400});
 }
}
