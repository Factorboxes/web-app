import {db,adminAccess} from '@/lib/server';
import {type Permission} from '@/lib/admin-permissions';
import {salesRange} from '@/lib/sales';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try {
  const access=await adminAccess();if(!access.owner&&!access.permissions.length)return Response.json({error:'ไม่มีสิทธิ์เข้าถึง'},{status:403});
  const can=(p:Permission)=>access.owner||access.permissions.includes(p);
  const date=new URL(request.url).searchParams.get('date')||new Date(Date.now()+7*3600000).toISOString().slice(0,10);
  const day=salesRange('day',date),month=salesRange('month',date),yesterday=salesRange('day',new Date(Date.parse(date+'T00:00:00Z')-86400000).toISOString().slice(0,10));
  const data:Record<string,unknown>={date,updatedAt:new Date().toISOString()};
  if(can('orders')){
   data.orders=await db().prepare("SELECT COUNT(*) FILTER(WHERE created>=? AND created<? AND status<>'ยกเลิก') AS today,COUNT(*) FILTER(WHERE created>=? AND created<? AND status<>'ยกเลิก') AS yesterday,COUNT(*) FILTER(WHERE payment<>'ชำระแล้ว' AND status<>'ยกเลิก') AS waiting,COUNT(*) FILTER(WHERE payment='ชำระแล้ว' AND status IN ('ชำระแล้ว','กำลังแพ็ก','รอยืนยัน','รอชำระเงิน')) AS packing,COUNT(*) FILTER(WHERE status='จัดส่งแล้ว') AS shipping,COUNT(*) FILTER(WHERE status='ส่งสำเร็จ') AS delivered FROM orders").bind(day.start,day.end,yesterday.start,yesterday.end).first();
   data.slips=await db().prepare("SELECT COUNT(*) AS total,COUNT(DISTINCT s.order_id) AS orders FROM slips s JOIN orders o ON o.id=s.order_id WHERE s.status='รอตรวจสอบ' AND o.payment<>'ชำระแล้ว' AND o.status<>'ยกเลิก'").first();
  }
  if(can('sales')){
   data.sales=await db().prepare("SELECT COALESCE(SUM(total) FILTER(WHERE created>=? AND created<?),0) AS today,COALESCE(SUM(subtotal-vat) FILTER(WHERE created>=? AND created<?),0) AS income,COALESCE(SUM(vat) FILTER(WHERE created>=? AND created<?),0) AS vat,COALESCE(SUM(shipping) FILTER(WHERE created>=? AND created<?),0) AS shipping,COALESCE(SUM(total) FILTER(WHERE created>=? AND created<?),0) AS yesterday,COALESCE(SUM(total) FILTER(WHERE created>=? AND created<?),0) AS month FROM orders WHERE payment='ชำระแล้ว' AND status<>'ยกเลิก'").bind(day.start,day.end,day.start,day.end,day.start,day.end,day.start,day.end,yesterday.start,yesterday.end,month.start,month.end).first();
  }
  if(can('members'))data.members=await db().prepare('SELECT COUNT(*) AS total FROM members').first();
  if(can('accounting')){
   const ready=await db().prepare("SELECT to_regclass('public.accounting_bills') AS name").first<{name:string|null}>();
   data.bills=ready?.name?await db().prepare("SELECT COUNT(*) AS total,COALESCE(SUM(o.total),0) AS amount FROM accounting_bills b JOIN orders o ON o.id=b.order_id WHERE b.due_date=?::date AND b.voided_at IS NULL AND o.payment<>'ชำระแล้ว' AND o.status<>'ยกเลิก'").bind(date).first():null;
  }
  return Response.json(data,{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){console.error(e);return Response.json({error:'โหลดภาพรวมไม่สำเร็จ กรุณาลองใหม่'},{status:400})}
}
