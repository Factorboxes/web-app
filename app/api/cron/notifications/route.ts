import {timingSafeEqual} from 'node:crypto';
import {makeReminders,drainNotifications} from '@/lib/notifications/server';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET,provided=request.headers.get('authorization')||'',expected='Bearer '+secret;
 if(!secret||secret.length<32||Buffer.byteLength(provided)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(provided),Buffer.from(expected)))return new Response(null,{status:401});
 try{await makeReminders();return Response.json({ok:true,...await drainNotifications()},{headers:{'Cache-Control':'no-store'}})}catch{console.error('scheduled notifications failed');return Response.json({error:'Notification job failed'},{status:500})}
}
