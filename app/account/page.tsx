import {identity} from '@/lib/member';
import MemberHome from './home';
export const dynamic='force-dynamic';
export default async function Page(){const user=await identity();return <MemberHome email={user?.email||null}/>;}
