import {z} from 'zod';
import {db,adminAccess} from '@/lib/server';
import {storageBucket} from '@/lib/storage';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json({canDelete:(await adminAccess()).owner},{headers:{'Cache-Control':'private, no-store'}})}catch{return Response.json({canDelete:false},{status:503})}}
export async function POST(request:Request){try{
 if(request.headers.get('origin')!==new URL(request.url).origin||!(await adminAccess()).owner)return Response.json({error:'เฉพาะเจ้าของร้านเท่านั้นที่ลบออเดอร์ได้'},{status:403});
 const b=z.object({id:z.string().uuid(),confirmation:z.string().trim()}).parse(await request.json());
 const number='FB-'+b.id.slice(0,8).toUpperCase();
 if(b.confirmation!==number)return Response.json({error:'พิมพ์เลขออเดอร์ให้ตรงก่อนยืนยันลบ'},{status:400});
 const order=await db().prepare('SELECT id FROM orders WHERE id=?').bind(b.id).first();
 if(!order)return Response.json({error:'ไม่พบออเดอร์ หรือออเดอร์ถูกลบแล้ว กรุณารีเฟรชรายการ'},{status:404});
 const slips=(await db().prepare('SELECT storage_key FROM slips WHERE order_id=?').bind(b.id).all()).results;
 await db().batch([
  db().prepare('DELETE FROM documents WHERE order_id=?').bind(b.id),
  db().prepare('DELETE FROM slips WHERE order_id=?').bind(b.id),
  db().prepare('DELETE FROM orders WHERE id=?').bind(b.id)
 ]);
 let cleanupFailed=0;
 for(const slip of slips){try{await storageBucket.delete(String(slip.storage_key))}catch(e){cleanupFailed++;console.error('Order slip cleanup failed',e)}}
 return Response.json({ok:true,warning:cleanupFailed?'ลบออเดอร์และนำออกจากยอดขายแล้ว แต่ลบไฟล์ภาพสลิปบางไฟล์ในพื้นที่จัดเก็บไม่สำเร็จ':''});
 }catch(e){console.error(e);return Response.json({error:e instanceof z.ZodError?'ข้อมูลยืนยันไม่ถูกต้อง':'ลบออเดอร์ไม่สำเร็จ กรุณารีเฟรชตรวจสอบรายการแล้วลองใหม่'},{status:400})}}
