import {timingSafeEqual} from 'node:crypto';
import {generateBills} from '@/lib/accounting-server';
export const dynamic='force-dynamic';
export async function GET(request:Request){const secret=process.env.CRON_SECRET,provided=request.headers.get('authorization')||'';const expected='Bearer '+secret;if(!secret||secret.length<32||Buffer.byteLength(provided)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(provided),Buffer.from(expected)))return new Response(null,{status:401});try{return Response.json({ok:true,generated:await generateBills('scheduled-billing')},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Billing job failed'},{status:500})}}
