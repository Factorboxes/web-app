import {z} from 'zod';
import {identity} from '@/lib/member';
import {db} from '@/lib/server';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'คำขอไม่ถูกต้อง'},{status:403,headers});
 try{
  const user=await identity();
  if(!user)return Response.json({error:'เข้าสู่ระบบเพื่อค้นหาเลขออเดอร์หรือเลขพัสดุของคุณ หรือวางลิงก์ติดตามที่ได้รับหลังสั่งซื้อ'},{status:401,headers});
  const raw=await request.text();if(raw.length>1024)return Response.json({error:'ข้อความค้นหายาวเกินไป'},{status:400,headers});
  const parsed=z.object({query:z.string().trim().min(1).max(100)}).safeParse(JSON.parse(raw));
  if(!parsed.success)return Response.json({error:'กรอกเลขออเดอร์หรือเลขพัสดุให้ถูกต้อง'},{status:400,headers});
  const query=parsed.data.query;
  const number=/^\d{1,19}$/.test(query)?BigInt(query).toString():'';
  const matches=(await db().prepare("SELECT token FROM orders WHERE member_id=? AND (order_no::text=? OR lower(tracking)=lower(?) OR lower('FB-' || substr(id,1,8))=lower(?)) ORDER BY created DESC LIMIT 2").bind(user.id,number,query,query).all()).results;
  if(matches.length>1)return Response.json({error:'พบมากกว่าหนึ่งคำสั่งซื้อ กรุณาเลือกรายการจากประวัติคำสั่งซื้อ'},{status:409,headers});
  if(!matches.length)return Response.json({error:'ไม่พบรายการในบัญชีนี้ ตรวจสอบเลขอีกครั้ง หรือเปิดลิงก์ติดตามที่ได้รับหลังสั่งซื้อ'},{status:404,headers});
  return Response.json({token:matches[0].token},{headers});
 }catch(error){return Response.json({error:error instanceof SyntaxError?'คำขอไม่ถูกต้อง':'โหลดข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง'},{status:error instanceof SyntaxError?400:503,headers});}
}
