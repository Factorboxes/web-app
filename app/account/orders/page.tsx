import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {MemberHeading} from '../shell';
import OrderHistory from './history';
export const dynamic='force-dynamic';
export const metadata={title:'ประวัติคำสั่งซื้อ | FACTORBOXES'};
export default async function Page(){await requireChatGPTUser('/account/orders');return <><MemberHeading title="ประวัติคำสั่งซื้อ" description="เปิดดูสินค้าที่เคยสั่ง รายละเอียดการชำระเงิน และสถานะจัดส่งได้ทุกออเดอร์"/><OrderHistory/></>}
