import {requireChatGPTUser} from '@/app/chatgpt-auth';
import OrderDetails from '../details';
export const dynamic='force-dynamic';
export const metadata={title:'รายละเอียดคำสั่งซื้อ | FACTORBOXES'};
export default async function Page({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 await requireChatGPTUser('/account/orders/'+encodeURIComponent(id));
 return <OrderDetails orderId={id}/>;
}
