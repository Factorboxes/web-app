import {chatGPTSignInPath,chatGPTSignOutPath} from '@/app/chatgpt-auth';
import {Heart,LogIn,LogOut,UserRound,CheckCircle2,ArrowRight} from 'lucide-react';
import {MemberHeading} from './shell';
import Profile from './profile';
import OrderHistory from './orders/history';
export default function MemberHome({email}:{email:string|null}){
  return <><MemberHeading title="สมาชิกและที่อยู่จัดส่ง" description="บันทึกข้อมูลผู้รับ และเปิดดูคำสั่งซื้อของคุณได้ในที่เดียว"/>{email?<>
    <section className="member-welcome"><div className="member-welcome-user"><span className="member-avatar"><UserRound size={39}/></span><div><span>ยินดีต้อนรับ</span><strong>{email}</strong><small><CheckCircle2 size={13}/>คุณได้เข้าสู่ระบบเรียบร้อยแล้ว</small></div></div><a className="member-outline" href={chatGPTSignOutPath('/account')} target="_top"><LogOut size={17}/>ออกจากระบบ / เปลี่ยนบัญชี</a><div className="member-welcome-thanks"><span className="member-gift"><img src="/boxes.png" alt=""/></span><div><Heart size={21} fill="currentColor"/><strong>ขอบคุณที่เป็นส่วนหนึ่ง<br/>ของ Factorboxes</strong><small>เราพร้อมดูแลทุกคำสั่งซื้อของคุณ</small></div></div></section>
    <OrderHistory compact/>
    <Profile signInPath={chatGPTSignInPath('/account')}/>
  </>:<section className="member-card member-signin"><span className="member-icon"><UserRound size={29}/></span><h2>ทุกคำสั่งซื้อ อยู่ในบัญชีเดียว</h2><p>เข้าสู่ระบบเพื่อดูสินค้าที่เคยสั่ง ติดตามพัสดุ และบันทึกที่อยู่จัดส่งสำหรับครั้งต่อไป</p><a className="member-primary" href={chatGPTSignInPath('/account')}><LogIn size={19}/>เข้าสู่ระบบ / สมัครสมาชิก<ArrowRight size={18}/></a><a className="member-text-link" href="/store">เลือกซื้อสินค้าก่อน<ArrowRight size={16}/></a></section>}</>;
}
