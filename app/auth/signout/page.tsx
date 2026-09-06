import {authClient} from '@/lib/supabase/server';
import {redirect} from 'next/navigation';
export default function Signout(){async function logout(){'use server';await (await authClient()).auth.signOut();redirect('/login')}return <main className="container narrow"><h1>ออกจากระบบ</h1><form action={logout}><button className="primary">ยืนยันออกจากระบบ</button></form><a href="/account">กลับหน้าสมาชิก</a></main>}
