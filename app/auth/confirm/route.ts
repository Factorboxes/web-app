import {NextResponse} from 'next/server';
import {authClient} from '@/lib/supabase/server';
export async function GET(request:Request){const url=new URL(request.url),token_hash=url.searchParams.get('token_hash'),type=url.searchParams.get('type');if(token_hash&&(type==='signup'||type==='recovery'||type==='email')){const {error}=await (await authClient()).auth.verifyOtp({token_hash,type});if(!error)return NextResponse.redirect(new URL(type==='recovery'?'/login?mode=password':'/account',url.origin))}return NextResponse.redirect(new URL('/login',url.origin))}
