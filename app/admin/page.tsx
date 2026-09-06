import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {adminAccess} from '@/lib/server';
import Admin from './panel';
export const dynamic='force-dynamic';
export default async function Page(){await requireChatGPTUser('/admin');const access=await adminAccess();if(!access.owner&&!access.permissions.length)return <main className="container"><h1>สำหรับผู้ดูแลร้านเท่านั้น</h1><a href="/">กลับหน้าร้าน</a></main>;return <Admin access={access}/>}
