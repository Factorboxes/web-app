import {z} from 'zod';
import {db,isAdmin} from '@/lib/server';
import {trackedPaths} from '@/lib/analytics';
import {salesPeriods,salesRange} from '@/lib/sales';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return new Response(null,{status:403});
 if(/bot|crawler|spider|headless/i.test(request.headers.get('user-agent')||'')||request.headers.get('dnt')==='1')return new Response(null,{status:204});
 try{const text=await request.text();if(text.length>500)return new Response(null,{status:413});const b=z.object({visitor:z.string().uuid(),path:z.enum(trackedPaths)}).parse(JSON.parse(text));
 await db().prepare("INSERT INTO site_visits(day,visitor,path) VALUES ((now() AT TIME ZONE 'Asia/Bangkok')::date,?,?) ON CONFLICT(day,visitor,path) DO UPDATE SET views=site_visits.views+1,last_seen=now() WHERE site_visits.last_seen<now()-interval '30 seconds'").bind(b.visitor,b.path).run();return new Response(null,{status:204});
 }catch{return new Response(null,{status:400})}
}
export async function GET(request:Request){try{
 if(!await isAdmin('sales'))return Response.json({error:'ไม่มีสิทธิ์ดูสถิติ'},{status:403});
 const q=new URL(request.url).searchParams;const period=z.enum(salesPeriods).parse(q.get('period')||'month');const range=salesRange(period,q.get('date')||new Date(Date.now()+7*3600000).toISOString().slice(0,10));
 const filter=' FROM site_visits WHERE day>=?::date AND day<=?::date';const args=[range.from,range.through];
 const totals=await db().prepare('SELECT COALESCE(SUM(views),0) AS views,COUNT(DISTINCT visitor) AS visitors'+filter).bind(...args).first();
 const rows=(await db().prepare('SELECT day::text AS day,SUM(views) AS views,COUNT(DISTINCT visitor) AS visitors'+filter+' GROUP BY day ORDER BY day DESC').bind(...args).all()).results;
 const pages=(await db().prepare('SELECT path,SUM(views) AS views,COUNT(DISTINCT visitor) AS visitors'+filter+' GROUP BY path ORDER BY views DESC').bind(...args).all()).results;
 return Response.json({totals,rows,pages,range},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'โหลดสถิติไม่สำเร็จ ตรวจสอบวันที่ และรันไฟล์ supabase/05-analytics.sql ก่อนใช้งานครั้งแรก'},{status:400})}}
