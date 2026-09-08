'use client';
import {usePurchaseConversion} from '@/app/use-purchase-conversion';
import {useCallback,useEffect,useState} from 'react';
import {ArrowRight,Ban,Check,CheckCircle2,Clock3,Copy,Info,Landmark,Link2,MapPin,ReceiptText,RefreshCw,Truck} from 'lucide-react';
import {Header,api} from '../shared';
import SlipUpload from '../slip-upload';
import {orderNumber} from '@/lib/order-number';
import {money} from '@/lib/catalog';
import {paymentStatus} from '@/lib/payment-status';
import {paymentBank,paymentDate,type BankDetails} from '@/lib/payment-view';
import './payment.css';

type PaymentOrder={id:string;order_no?:number|string;created?:string;total:number;subtotal:number;shipping:number;payment:string;status:string};
type Slip={created:string;status:string;note?:string};
type Props={token:string;initial:PaymentOrder;initialSlips:Slip[];bank:BankDetails;freeShipping?:number};

export default function Payment({token,initial,initialSlips,bank,freeShipping=750}:Props) {
  const [order,setOrder]=useState(initial),[slips,setSlips]=useState(initialSlips);
 usePurchaseConversion(order);
  const [notice,setNotice]=useState(''),[copied,setCopied]=useState(''),[refreshing,setRefreshing]=useState(false);
  const refresh=useCallback(async()=>{
    setRefreshing(true);
    try {const d=await api({action:'track',token});setOrder(prev=>({...prev,...d.order}));setSlips(d.slips||[])}
    catch(e){setNotice((e as Error).message)}finally{setRefreshing(false)}
  },[token]);
  useEffect(()=>{const onFocus=()=>{void refresh()};window.addEventListener('focus',onFocus);return()=>window.removeEventListener('focus',onFocus)},[refresh]);
  useEffect(()=>{if(!copied)return;const t=setTimeout(()=>setCopied(''),3500);return()=>clearTimeout(t)},[copied]);
  async function copy(text:string,label:string) {
    try{await navigator.clipboard.writeText(text);setCopied(label);setNotice('คัดลอก'+label+'แล้ว')}
    catch{setNotice('คัดลอกอัตโนมัติไม่ได้ กรุณาเลือกและคัดลอก'+label+'ด้วยตนเอง')}
  }
  const account=paymentBank(bank);
  const cancelled=order.status==='ยกเลิก',paid=!cancelled&&order.payment==='ชำระแล้ว';
  const pending=!paid&&!cancelled&&slips.some(s=>s.status==='รอตรวจสอบ');
  const stage=paid?3:pending?2:1;
  const status=paymentStatus(order,slips);
  const hasBank=Boolean(account.copyNumber||bank.bank);
  const canUpload=!paid&&!cancelled&&!pending;
  const steps=['ยืนยันออเดอร์','ชำระเงิน','แจ้งชำระเงิน','เสร็จสิ้น'];
  return <div className="payment-experience">
    <Header/>
    <main className="payment-canvas">
      <div className="payment-decoration" aria-hidden="true"/>
      <article className="payment-sheet">
        {!cancelled&&<ol className="pay-steps" aria-label="ขั้นตอนการสั่งซื้อ">{steps.map((label,i)=><li key={label} className={i<stage?'complete':i===stage?'current':''} aria-current={i===stage?'step':undefined}><span className="pay-step-dot">{i<stage||paid&&i===3?<Check size={19}/>:i+1}</span><span>{label}</span></li>)}</ol>}
        <div className="pay-title-row">
          <div><span className="pay-eyebrow">PAYMENT DETAILS</span><h1>{paid?'ชำระเงินเรียบร้อย':cancelled?'ออเดอร์ถูกยกเลิก':pending?'แจ้งชำระเงินแล้ว':'ชำระเงิน'}</h1><p>{paid?'ขอบคุณที่ให้ FACTORBOXES ดูแลทุกการแพ็คของคุณ':cancelled?'ออเดอร์นี้ปิดรับการชำระเงินแล้ว':pending?'ได้รับสลิปแล้ว กรุณารอร้านตรวจสอบยอดเงิน':'โอนตามยอดที่แสดง แล้วแนบสลิปเพื่อแจ้งชำระเงิน'}</p></div>
          <aside className="pay-order-meta" aria-label="ข้อมูลออเดอร์"><span>เลขออเดอร์</span><strong>{orderNumber(order)}</strong>{order.created&&<small>สั่งซื้อ {paymentDate(order.created)} น.</small>}<span className={'pay-status '+(paid?'is-paid':cancelled?'is-cancelled':'')}><i/>{status}</span></aside>
        </div>
        <div className="pay-details-grid">
          <section className="pay-amount-card" aria-labelledby="pay-amount-label">
            <div className="pay-amount-hero"><div><ReceiptText size={20}/><h2 id="pay-amount-label">{paid?'ยอดที่ชำระแล้ว':cancelled?'ยอดออเดอร์':'ยอดที่ต้องชำระ'}</h2></div><strong className="pay-total">฿{money(order.total)}</strong><span>{paid?'ร้านยืนยันรับเงินเรียบร้อยแล้ว':'ยอดรวมตามคำสั่งซื้อของคุณ'}</span></div>
            <dl className="pay-breakdown"><div><dt>ยอดสินค้า</dt><dd>฿{money(order.subtotal)}</dd></div><div><dt>ค่าจัดส่ง</dt><dd className={order.shipping===0?'pay-free':''}>{order.shipping===0?'ฟรี':`฿${money(order.shipping)}`}</dd></div><div className="pay-grand-total"><dt>ยอดรวมทั้งสิ้น</dt><dd>฿{money(order.total)}</dd></div></dl>
            <p className="pay-amount-note">ราคาสินค้าปรับตามเรทและ CODE ที่ใช้แล้ว</p>
          </section>
          {!paid&&!cancelled&&!pending?<section className="pay-bank-card" aria-labelledby="pay-bank-heading">
            <h2 id="pay-bank-heading">โอนชำระเงินผ่านธนาคาร</h2>
            {account.name&&<div className="pay-bank-identity">{account.isKbank?<img src="/kbank.png" alt="โลโก้ธนาคารกสิกรไทย" width="58" height="58"/>:<span className="pay-bank-icon"><Landmark size={30}/></span>}<div><strong>{account.name}</strong>{account.isKbank&&<small>KASIKORNBANK</small>}</div></div>}
            {bank.accountName&&<div className="pay-holder"><span>ชื่อบัญชี</span><strong>{bank.accountName}</strong></div>}
            {account.copyNumber&&<div className="pay-account"><span>เลขบัญชี</span><div className="pay-account-number"><strong>{account.displayNumber}</strong><button type="button" onClick={()=>copy(account.copyNumber,'เลขบัญชี')} aria-label="คัดลอกเลขบัญชี" className={copied==='เลขบัญชี'?'was-copied':''}>{copied==='เลขบัญชี'?<Check size={22}/>:<Copy size={22}/>}<span>{copied==='เลขบัญชี'?'คัดลอกแล้ว':'คัดลอก'}</span></button></div></div>}
            {bank.bank&&(!bank.accountName||!account.copyNumber)?<p className="pay-legacy-bank">{bank.bank}</p>:bank.bank&&<details className="pay-bank-notes"><summary>รายละเอียดบัญชีเพิ่มเติม</summary><p>{bank.bank}</p></details>}
            <div className="pay-bank-alert"><Info size={20}/><p>{hasBank?<>กรุณาโอนตามยอดที่แสดงเท่านั้น<br/><span>แล้วอัปโหลดสลิปเพื่อแจ้งชำระเงิน</span></>:<>ร้านยังไม่ได้ระบุบัญชีรับโอน<br/><span>กรุณาติดต่อร้านก่อนโอนเงิน ออเดอร์บันทึกไว้แล้ว</span></>}</p></div>
          </section>:<section className={'pay-state-card '+(paid?'is-paid':cancelled?'is-cancelled':'')} role="status">{paid?<CheckCircle2 size={50}/>:cancelled?<Ban size={46}/>:<Clock3 size={46}/>}<h2>{paid?'ร้านยืนยันรับเงินแล้ว':cancelled?'ไม่รับชำระสำหรับออเดอร์นี้':'ได้รับสลิปเรียบร้อยแล้ว'}</h2><p>{paid?'ไม่ต้องโอนซ้ำ ดูความคืบหน้าการจัดส่งได้ที่หน้าติดตามพัสดุ':cancelled?'คุณสามารถกลับไปเลือกสินค้าและสร้างออเดอร์ใหม่ได้': 'ร้านกำลังตรวจสอบยอดเงิน ไม่ต้องโอนหรือแนบสลิปซ้ำ'}</p><a className="pay-outline" href={cancelled?'/store':'/track?token='+token}>{cancelled?'เลือกซื้อสินค้า':'ติดตามสถานะออเดอร์'}<ArrowRight size={18}/></a></section>}
        </div>
        {canUpload&&<SlipUpload token={token} onUploaded={()=>{setSlips(prev=>[{status:'รอตรวจสอบ',created:new Date().toISOString(),note:''},...prev]);void refresh()}}/>}
        {slips.length>0&&<section className="pay-slip-history"><h2>ประวัติการแจ้งชำระ</h2>{slips.map((s,i)=><div key={i}><ReceiptText size={21}/><div><strong>{s.status}</strong><small>{paymentDate(s.created)} น.</small>{s.note&&<p>{s.note}</p>}</div></div>)}</section>}
        <div className="pay-order-actions"><button type="button" className="pay-link" onClick={()=>copy(window.location.href,'ลิงก์ชำระเงิน')}><Link2 size={17}/>{copied==='ลิงก์ชำระเงิน'?'คัดลอกลิงก์แล้ว':'เก็บลิงก์ไว้ชำระภายหลัง'}</button><button type="button" className="pay-link" disabled={refreshing} onClick={refresh}><RefreshCw size={16} className={refreshing?'pay-spinning':''}/>{refreshing?'กำลังตรวจสอบ…':'ตรวจสอบสถานะล่าสุด'}</button><a className="pay-link" href={'/track?token='+token}>ติดตามออเดอร์<ArrowRight size={17}/></a></div>
        <p className="pay-private-note">ลิงก์นี้ใช้เข้าถึงออเดอร์ของคุณ กรุณาเก็บไว้เป็นส่วนตัว</p>
      </article>
      <div className="pay-benefits"><div><Truck/><span><strong>ส่งฟรีครบ ฿{freeShipping.toLocaleString('th-TH')}</strong><small>สั่งง่าย คุ้มกว่า</small></span></div><div><ReceiptText/><span><strong>ราคาสินค้ารวม VAT</strong><small>ขอใบกำกับภาษีได้</small></span></div><div><MapPin/><span><strong>จัดส่งทั่วไทย</strong><small>ติดตามออเดอร์ได้</small></span></div></div>
    </main>
    <div className={'pay-toast '+(notice?'visible':'')} role="status" aria-live="polite">{notice&&<><Info size={18}/><span>{notice}</span><button type="button" onClick={()=>setNotice('')} aria-label="ปิดข้อความ">×</button></>}</div>
  </div>;
}
