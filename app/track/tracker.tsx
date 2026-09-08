'use client';
import {usePurchaseConversion} from '@/app/use-purchase-conversion';
import {useEffect,useRef,useState} from 'react';
import {Truck,Package,House,ClipboardCheck,Search,Copy,Check,RefreshCw,ChevronRight,Headphones,MessageCircle,MapPin,ReceiptText,Info,ArrowUpRight,Clock3,AlertCircle} from 'lucide-react';
import {orderNumber} from '@/lib/order-number';
import {money} from '@/lib/catalog';
import {telephone} from '@/lib/branding';
import {paymentStatus} from '@/lib/payment-status';
import {trackingToken,shipmentStage,carrierTrackingPage} from '@/lib/tracking-view';
import {Header} from '../shared';
import {useBranding} from '../branding-context';
import './tracking.css';

type Order={id:string;order_no?:number|string;created:string;status:string;carrier:string;tracking:string;total:number;payment:string};
type Slip={created:string;status:string;note:string};
const steps=[{label:'รับคำสั่งซื้อ',Icon:ClipboardCheck},{label:'กำลังแพ็ก',Icon:Package},{label:'จัดส่งแล้ว',Icon:Truck},{label:'ถึงปลายทาง',Icon:House}];
function thaiDate(value:string,time=false){const d=new Date(value);if(Number.isNaN(d.getTime()))return '';return d.toLocaleString('th-TH',{timeZone:'Asia/Bangkok',day:'numeric',month:'short',year:'numeric',...(time?{hour:'2-digit',minute:'2-digit'}:{})})}

export default function Track(){
 const brand=useBranding();
 const [query,setQuery]=useState(''),[token,setToken]=useState(''),[order,setOrder]=useState<Order|null>(null),[slips,setSlips]=useState<Slip[]>([]);
 usePurchaseConversion(order);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[needsLogin,setNeedsLogin]=useState(false),[copied,setCopied]=useState(false),[notice,setNotice]=useState(''),[checkedAt,setCheckedAt]=useState(''),[freeShipping,setFreeShipping]=useState<number|null>(null);
 const controller=useRef<AbortController|null>(null);
 async function find(value:string,refresh=false){
  if(!value.trim())return;
  controller.current?.abort();const active=new AbortController();controller.current=active;
  setBusy(true);setError('');setNotice('');setNeedsLogin(false);setCopied(false);
  if(!refresh){setOrder(null);setSlips([]);setToken('')}
  try{
   let accessToken=trackingToken(value);
   if(!accessToken){
    const r=await fetch('/api/tracking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:value.trim()}),signal:active.signal});
    const data=await r.json();if(!r.ok){setNeedsLogin(r.status===401);throw Error(data.error||'ค้นหาไม่สำเร็จ')}
    accessToken=data.token;
   }
   const r=await fetch('/api/shop',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'track',token:accessToken}),signal:active.signal});
   const data=await r.json();if(!r.ok)throw Error(data.error||'โหลดสถานะไม่สำเร็จ');
   if(active.signal.aborted)return;
   setOrder(data.order);setSlips(data.slips||[]);setToken(accessToken||'');setCheckedAt(new Date().toLocaleTimeString('th-TH',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit'}));
  }catch(e){if(!active.signal.aborted)setError((e as Error).message)}finally{if(!active.signal.aborted)setBusy(false)}
 }
 useEffect(()=>{
  const t=new URLSearchParams(window.location.search).get('token');if(t){void find(t)}
  fetch('/api/shop').then(r=>r.ok?r.json():null).then(d=>{if(typeof d?.settings?.freeShipping==='number')setFreeShipping(d.settings.freeShipping)}).catch(()=>{});
  return()=>controller.current?.abort();
 },[]);
 async function copyTracking(){if(!order?.tracking)return;try{await navigator.clipboard.writeText(order.tracking);setCopied(true);setNotice('คัดลอกเลขพัสดุแล้ว')}catch{setNotice('คัดลอกอัตโนมัติไม่ได้ แตะค้างที่เลขพัสดุเพื่อคัดลอกได้')}}
 const stage=shipmentStage(order?.status||''),cancelled=order?.status==='ยกเลิก';
 const carrierPage=order?carrierTrackingPage(order.carrier):null;
 const statusTitle=cancelled?'ยกเลิกออเดอร์':stage===3?'ส่งถึงปลายทางแล้ว':stage===2?'อยู่ระหว่างจัดส่ง':stage===1?'กำลังแพ็กสินค้า':'รับคำสั่งซื้อแล้ว';
 const statusDetail=cancelled?'ติดต่อร้านหากต้องการความช่วยเหลือ':stage===3?'ขอบคุณที่เลือก FACTORBOXES':stage===2?'เช็กความคืบหน้ากับบริษัทขนส่ง':stage===1?'ร้านกำลังเตรียมกล่องของคุณ':order?.payment==='ชำระแล้ว'?'ชำระแล้ว · รอเตรียมสินค้า':order?paymentStatus(order,slips):'';
 return <><Header active="track"/><main className="tracking-experience"><div className="tracking-decoration" aria-hidden="true"/><div className="tracking-container">
  <section className="tracking-intro" aria-labelledby="tracking-title"><div className="tracking-hero-art" aria-hidden="true"><MapPin/><Package/></div><div className="tracking-hero-icon"><Truck/></div><p className="tracking-eyebrow">TRACK YOUR ORDER</p><h1 id="tracking-title">กล่องของคุณ <span>ถึงไหนแล้ว?</span></h1><p>เช็กสถานะคำสั่งซื้อและเลขพัสดุได้ที่นี่</p></section>
  <form className="tracking-search" onSubmit={e=>{e.preventDefault();void find(query)}}><div className="tracking-search-field"><Search aria-hidden="true"/><input type="text" aria-label="เลขออเดอร์ เลขพัสดุ หรือลิงก์ติดตาม" placeholder="เลขออเดอร์ / เลขพัสดุ / ลิงก์ติดตาม" maxLength={500} required autoComplete="off" autoCapitalize="none" spellCheck={false} value={query} onChange={e=>setQuery(e.target.value)}/></div><button type="submit" disabled={busy}>{busy?'กำลังค้นหา…':'ติดตาม'}</button></form>
  <p className="tracking-search-hint"><Info/><span>ค้นหาออเดอร์ในบัญชีของคุณ หรือวางลิงก์ติดตามจากร้าน <a href="/account/orders">ประวัติคำสั่งซื้อ <ChevronRight/></a></span></p>
  {error&&<div className="tracking-error" role="alert"><AlertCircle/><div><p>{error}</p>{needsLogin&&<a href="/login?next=%2Ftrack">เข้าสู่ระบบ <ChevronRight/></a>}</div></div>}
  {busy&&!order&&<div className="tracking-loading" role="status"><RefreshCw className="tracking-spin"/>กำลังตรวจสอบคำสั่งซื้อ…</div>}
  {order&&<section className="tracking-result" aria-label="สถานะคำสั่งซื้อ" aria-busy={busy}>
   <div className="tracking-order-head"><div><p>เลขคำสั่งซื้อ</p><h2>{orderNumber(order)}</h2><small>สั่งซื้อเมื่อ {thaiDate(order.created,true)} น.</small></div><div className={'tracking-status '+(cancelled?'cancelled':stage>=2?'shipped':stage===1?'packing':'received')}>{cancelled?<AlertCircle/>:stage===3?<House/>:<Package/>}<div><strong>{statusTitle}</strong><span>{statusDetail}</span></div></div></div>
   {!cancelled&&<ol className="shipment-steps" aria-label="ขั้นตอนการจัดส่ง">{steps.map(({label,Icon},i)=><li className={'shipment-step step-'+i+(i<=stage?' complete':'')+(i===stage?' current':'')} key={label} aria-current={i===stage?'step':undefined}><span className="shipment-node"><Icon/></span><b>{label}</b><small>{i===0?thaiDate(order.created):i===stage?'สถานะปัจจุบัน':i<stage?'ดำเนินการแล้ว':'รออัปเดต'}</small></li>)}</ol>}
   <div className="shipment-carrier"><div className="carrier-company"><span className="carrier-icon"><Truck/></span><div><small>บริษัทขนส่ง</small><b>{order.carrier||'รอร้านเลือกขนส่ง'}</b></div></div><div className="carrier-number"><div><small>เลขพัสดุ <span>(Tracking No.)</span></small><strong>{order.tracking||'รอออกเลขพัสดุ'}</strong></div>{order.tracking&&<button type="button" aria-label="คัดลอกเลขพัสดุ" onClick={copyTracking}>{copied?<Check/>:<Copy/>}</button>}</div></div>
   {order.tracking&&carrierPage&&<a className="tracking-carrier-link" href={carrierPage} target="_blank" rel="noreferrer">เช็กสถานะกับ {order.carrier} <ArrowUpRight/></a>}
   <div className="tracking-record-head"><h3>การอัปเดตออเดอร์</h3><button type="button" onClick={()=>void find(token,true)} disabled={busy} aria-label="รีเฟรชสถานะ"><RefreshCw className={busy?'tracking-spin':''}/><span>รีเฟรช</span></button></div>
   <ol className="tracking-records"><li className={cancelled?'cancelled':'latest'}><span className="record-dot"/><div><b>{statusTitle}</b><p>{cancelled?'ติดต่อร้านเพื่อสอบถามรายละเอียด':stage===2?`ร้านระบุว่าจัดส่งแล้ว${order.carrier?' · '+order.carrier:''}`:stage===3?'ร้านอัปเดตว่าส่งสำเร็จ':stage===1?'ร้านกำลังจัดเตรียมสินค้าก่อนส่ง':statusDetail}</p><small>สถานะล่าสุดจากร้านค้า</small></div></li><li><span className="record-dot"/><div><b>ได้รับคำสั่งซื้อ</b><p>บันทึกคำสั่งซื้อเรียบร้อยแล้ว</p><time dateTime={order.created}>{thaiDate(order.created,true)} น.</time></div></li></ol>
   <p className="tracking-source"><Clock3/>ตรวจสอบล่าสุด {checkedAt} น. · สถานะอัปเดตโดยร้านค้า</p>
   <details className="tracking-payment"><summary><ReceiptText/><span>การชำระเงิน <b>{paymentStatus(order,slips)}</b></span><ChevronRight/></summary><div><p>ยอดคำสั่งซื้อ <b>฿{money(order.total)}</b></p>{slips.length?slips.map((s,i)=><article key={i}><b>{s.status}</b><time dateTime={s.created}>{thaiDate(s.created,true)} น.</time>{s.note&&<p>{s.note}</p>}</article>):<p>ยังไม่ได้แนบสลิป</p>}{order.payment!=='ชำระแล้ว'&&!cancelled&&<a href={'/payment?token='+encodeURIComponent(token)}>ไปหน้าชำระเงิน / แนบสลิป <ChevronRight/></a>}</div></details>
  </section>}
  {!order&&!busy&&!error&&<section className="tracking-empty"><Package/><h2>ติดตามทุกขั้นตอนของกล่องคุณ</h2><p>เปิดออเดอร์จากประวัติการสั่งซื้อ<br/>หรือกรอกรหัสติดตามด้านบนเพื่อเริ่มต้น</p><a href="/account/orders">เลือกคำสั่งซื้อของฉัน <ChevronRight/></a></section>}
  {notice&&<p className="tracking-feedback" role="status">{notice}</p>}
  <div className="tracking-help-grid"><a href={telephone(brand.phone)}><span className="tracking-help-icon"><Headphones/></span><div><b>มีคำถาม?</b><small>โทร. {brand.phone}</small></div><ChevronRight/></a><a href="/account/orders"><span className="tracking-help-icon"><ReceiptText/></span><div><b>หาเลขออเดอร์ไม่เจอ?</b><small>ดูประวัติคำสั่งซื้อ</small></div><ChevronRight/></a>{brand.lineUrl?<a href={brand.lineUrl} target="_blank" rel="noreferrer"><span className="tracking-line-icon">LINE</span><div><b>สอบถามผ่าน LINE</b><small>{brand.lineId}</small></div><ChevronRight/></a>:<div className="tracking-line-contact"><span className="tracking-line-icon">LINE</span><div><b>สอบถามผ่าน LINE</b><small>ค้นหา {brand.lineId}</small></div><MessageCircle/></div>}</div>
  <div className="tracking-benefits"><div><Truck/><span><b>{freeShipping!==null?'ส่งฟรีครบ ฿'+freeShipping.toLocaleString():'สั่งซื้อง่าย'}</b><small>รวมสินค้าคละขนาดได้</small></span></div><div><ReceiptText/><span><b>ราคารวม VAT</b><small>ขอใบกำกับภาษีได้</small></span></div><div><MapPin/><span><b>จัดส่งทั่วไทย</b><small>แพ็กพร้อมส่งถึงคุณ</small></span></div></div>
  <p className="tracking-copyright">FACTORBOXES · PACK YOUR NEXT POSSIBILITY</p>
 </div></main></>;
}
