import {authClient} from './supabase/server';
export async function identity(){const {data:{user},error}=await (await authClient()).auth.getUser();return !error&&user&&user.email&&user.email_confirmed_at?{id:user.id,email:user.email}:null}
