import {z} from 'zod';
import {db,isAdmin} from '@/lib/server';
import {orderFilters} from '@/lib/admin-orders';
import {salesRange} from '@/lib/sales';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try {
  if(!await isAdmin('orders'))return Response.json({error:'ไม่มีสิทธิ์ดูคำสั่งซื้อ'},{status:403});
  const p=new URL(request.url).searchParams;
  const input=z.object({filter:z.enum(orderFilters).default('all'),query:z.string().trim().max(120).default(''),page:z.coerce.number().int().min(1).max(100000).default(1),limit:z.coerce.number().int().min(1).max(50).default(20),date:z.string().default(''),id:z.string().uuid().optional()}).parse(Object.fromEntries(p));
  const where:string[]=[],values:unknown[]=[];
  if(input.id){where.push('o.id=?');values.push(input.id)}
  const conditions:Record<string,string>={waiting:"o.payment<>'ชำระแล้ว' AND o.status<>'ยกเลิก'",pending:"o.payment<>'ชำระแล้ว' AND o.status<>'ยกเลิก' AND EXISTS(SELECT 1 FROM slips s WHERE s.order_id=o.id AND s.status='รอตรวจสอบ')",packing:"o.payment='ชำระแล้ว' AND o.status IN ('ชำระแล้ว','กำลังแพ็ก','รอยืนยัน','รอชำระเงิน')",shipping:"o.status='จัดส่งแล้ว'",delivered:"o.status='ส่งสำเร็จ'",cancelled:"o.status='ยกเลิก'",paid:"o.payment='ชำระแล้ว' AND o.status<>'ยกเลิก'"};
  if(conditions[input.filter])where.push('('+conditions[input.filter]+')');
  if(input.query){const pattern='%'+input.query.replace(/[\\%_]/g,'\\$&')+'%';const number=/^\d+$/.test(input.query)?BigInt(input.query).toString():input.query;where.push("(o.order_no::text=? OR (NOT EXISTS(SELECT 1 FROM orders exact_order WHERE exact_order.order_no::text=?) AND (LOWER('FB-'||substring(o.id,1,8)) LIKE LOWER(?) OR o.customer ILIKE ? OR o.phone ILIKE ? OR o.tracking ILIKE ? OR o.carrier ILIKE ? OR o.items ILIKE ?)))");values.push(number,number,pattern,pattern,pattern,pattern,pattern,pattern)}
  if(input.date){const range=salesRange('day',input.date);where.push('o.created>=? AND o.created<?');values.push(range.start,range.end)}
  const clause=where.length?' WHERE '+where.join(' AND '):'';
  const count=await db().prepare('SELECT COUNT(*) AS total FROM orders o'+clause).bind(...values).first<{total:number}>();
  const rows=await db().prepare("SELECT o.*, (SELECT COUNT(*) FROM slips s WHERE s.order_id=o.id AND s.status='รอตรวจสอบ') AS pending_slips FROM orders o"+clause+' ORDER BY o.created DESC,o.id DESC LIMIT ? OFFSET ?').bind(...values,input.limit,(input.page-1)*input.limit).all();
  return Response.json({orders:rows.results,total:count?.total||0,page:input.page,limit:input.limit},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){console.error(e);return Response.json({error:'โหลดคำสั่งซื้อไม่สำเร็จ กรุณาตรวจสอบคำค้นและวันที่'},{status:400})}
}
