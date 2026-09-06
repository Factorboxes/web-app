import {NextResponse} from 'next/server';
import {authClient} from '@/lib/supabase/server';
import {safePath} from '@/app/chatgpt-auth';
export async function GET(request:Request){const url=new URL(request.url),code=url.searchParams.get('code');if(code){const {error}=await (await authClient()).auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(safePath(url.searchParams.get('next')||'/account'),url.origin))}return NextResponse.redirect(new URL('/login',url.origin))}
