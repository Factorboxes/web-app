import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {Header,Footer} from '@/app/shared';
import OrderHistory from './history';
export const dynamic='force-dynamic';
export default async function Page(){await requireChatGPTUser('/account/orders');return <><Header/><main className="container orderhistory"><div className="eyebrow">MY ORDERS</div><h1>ประวัติคำสั่งซื้อ</h1><p className="muted">กดเลขคำสั่งซื้อเพื่อดูสถานะและเลขพัสดุ</p><OrderHistory/></main><Footer/></>}
