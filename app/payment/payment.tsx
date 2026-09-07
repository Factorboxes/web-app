'use client';
import {useEffect,useState} from 'react';
import {Copy,Landmark,ShieldCheck,Truck,ReceiptText,MapPin} from 'lucide-react';
import {Header,Footer,api} from '../shared';
import SlipUpload from '../slip-upload';
import {orderNumber} from '@/lib/order-number';
import {money} from '@/lib/catalog';
import {paymentStatus} from '@/lib/payment-status';
export default function Payment({token,initial,initialSlips,bank}:{token:string,initial:any,initialSlips:any[],bank:{bank:string,bankName:string,accountName:string,accountNumber:string}}){
  const [order,setOrder]=useState(initial),[slips,setSlips]=useState(initialSlips),[notice,setNotice]=useState(''),[refreshing,setRefreshing]=useState(false);
  async function refresh(){setRefreshing(true);try{const d=await api({action:'track',token});setOrder(d.order);setSlips(d.slips||[])}catch(e){setNotice((e as Error).message)}finally{setRefreshing(false)}}
  useEffect(()=>{const onFocus=()=>{void refresh()};window.addEventListener('focus',onFocus);return()=>window.removeEventListener('focus',onFocus)},[token]);
  async function copy(text:string,label:string){try{await navigator.clipboard.writeText(text);setNotice('คัดลอก'+label+'แล้ว')}catch{setNotice('คัดลอกอัตโนมัติไม่ได้ กรุณาคัดลอก'+label+'ด้วยตนเอง')}}
  const paid=order.payment==='ชำระแล้ว',cancelled=order.status==='ยกเลิก',pending=slips.some(s=>s.status==='รอตรวจสอบ'),hasBank=!!(bank.bank||bank.accountNumber);
  return <><Header/><main className="container paymentpage fb-payment">
    <div className="checkoutsteps fb-stepbar"><span>✓ 1. ยืนยันออเดอร์</span><b>2. ชำระเงิน</b><span>3. แจ้งชำระเงิน</span><span>4. เสร็จสิ้น</span></div>
    <div className="fb-payment-head"><div><h1>{paid?'ขอบคุณสำหรับการชำระเงิน':cancelled?'ออเดอร์ถูกยกเลิก':'ชำระเงิน'}</h1><p>กรุณาชำระเงินตามยอดที่แสดง และอัปโหลดสลิปเพื่อยืนยันการชำระเงิน</p></div><div className="fb-order-chip"><small>เลขที่ออเดอร์</small><b>{orderNumber(order)}</b></div></div>
    <div className="fb-payment-grid">
      <section className="fb-amount-card"><span>ยอดที่ต้องชำระ</span><strong>฿{money(order.total)}</strong><div><p><span>ยอดสินค้า</span><b>฿{money(order.total)}</b></p><p><span>ยอดรวมทั้งสิ้น</span><b>฿{money(order.total)}</b></p></div></section>
      <section className="fb-bank-card"><div className="fb-bank-title"><Landmark/><h2>โอนชำระเงินผ่านธนาคาร</h2></div>{bank.bankName&&<p><span>ธนาคาร</span><b>{bank.bankName}</b></p>}{bank.accountName&&<p><span>ชื่อบัญชี</span><b>{bank.accountName}</b></p>}{bank.accountNumber&&<><small>เลขบัญชี</small><div className="fb-account-number">{bank.accountNumber}<button onClick={()=>copy(bank.accountNumber,'เลขบัญชี')}><Copy/></button></div></>}{bank.bank&&<div className="notice preline">{bank.bank}</div>}{!hasBank&&<p className="notice">ร้านยังไม่ได้ระบุบัญชีรับโอน กรุณาติดต่อร้านก่อนชำระเงิน</p>}</section>
    </div>
    <section className="fb-slip-section"><h2>อัปโหลดสลิปการชำระเงิน</h2>{paid?<div className="fb-paid-box"><ShieldCheck/> ร้านยืนยันรับเงินแล้ว</div>:cancelled?<div className="notice">ไม่รับชำระสำหรับออเดอร์นี้</div>:pending?<div className="fb-paid-box">ได้รับสลิปแล้ว ร้านกำลังตรวจสอบยอดเงิน</div>:<SlipUpload token={token} onUploaded={()=>{setSlips([{status:'รอตรวจสอบ',created:new Date().toISOString(),note:''},...slips]);void refresh()}}/>}{slips.length>0&&<div className="fb-slip-history"><h3>ประวัติการแจ้งชำระ</h3>{slips.map((s,i)=><div className="notice" key={i}><b>{s.status}</b><small>{new Date(s.created).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'})}</small>{s.note&&<p>{s.note}</p>}</div>)}</div>}<button className="secondary" disabled={refreshing} onClick={refresh}>{refreshing?'กำลังตรวจสอบ…':'ตรวจสอบสถานะล่าสุด'}</button>{notice&&<p className="notice" role="status">{notice}</p>}</section>
    <div className="fb-payment-foot"><span><Truck/> ส่งฟรีครบ ฿750</span><span><ReceiptText/> ราคารวม VAT</span><span><MapPin/> ส่งทั่วไทย</span></div>
  </main><Footer/></>
}
