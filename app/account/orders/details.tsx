'use client';
import {usePurchaseConversion} from '@/app/use-purchase-conversion';
import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,Package,MapPin,ReceiptText,Truck,Wallet,Copy,Check,CalendarDays,Phone,RefreshCw,Info} from 'lucide-react';
import {MemberHeading} from '../shell';
import {MemberBadge} from './history';
import {orderNumber} from '@/lib/order-number';
import {money} from '@/lib/catalog';
import {paymentDate} from '@/lib/payment-view';
import {purchasedItems,type MemberOrderDetail} from '@/lib/member-orders';
import {useBranding} from '@/app/branding-context';
import {telephone} from '@/lib/branding';

export default function OrderDetails({orderId}:{orderId:string}) {
 const [order,setOrder]=useState<MemberOrderDetail|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[expired,setExpired]=useState(false),[revision,setRevision]=useState(0),[copied,setCopied]=useState(false),[copyMessage,setCopyMessage]=useState('');
 usePurchaseConversion(order);
 const brand=useBranding();
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError('');setExpired(false);setOrder(null);
  fetch('/api/member-orders?'+new URLSearchParams({id:orderId}),{cache:'no-store',signal:controller.signal}).then(async r=>{const d=await r.json();if(r.status===401)setExpired(true);if(!r.ok)throw Error(d.error||'โหลดรายละเอียดไม่สำเร็จ');setOrder(d.order)}).catch(e=>{if(e.name!=='AbortError')setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});return ()=>controller.abort();
 },[orderId,revision]);
 useEffect(()=>{const refresh=(e:PageTransitionEvent)=>{if(e.persisted)setRevision(v=>v+1)};window.addEventListener('pageshow',refresh);return()=>window.removeEventListener('pageshow',refresh)},[]);
 async function copy(){if(!order?.tracking)return;setCopyMessage('');try{await navigator.clipboard.writeText(order.tracking);setCopied(true);setCopyMessage('คัดลอกเลขพัสดุแล้ว')}catch{setCopyMessage('แตะค้างที่เลขพัสดุเพื่อเลือกและคัดลอกได้เลย')}}
 const items=order?purchasedItems(order.items):null;
 return <><MemberHeading title="รายละเอียดคำสั่งซื้อ" description="รายการสินค้าและยอดเงินที่บันทึกไว้เมื่อคุณสั่งซื้อ" detail/>
  <a className="member-back" href="/account/orders"><ArrowLeft size={17}/>กลับไปประวัติคำสั่งซื้อ</a>
  {loading?<section className="member-card member-loading" role="status"><span className="member-loading-dot"/>กำลังโหลดรายละเอียดออเดอร์…</section>:error||!order?<section className="member-card member-empty" role="alert"><ReceiptText size={38}/><h2>{error||'ไม่พบคำสั่งซื้อ'}</h2><p>เปิดได้เฉพาะคำสั่งซื้อในบัญชีที่คุณเข้าสู่ระบบ</p>{expired?<a className="member-primary" href={'/login?next='+encodeURIComponent('/account/orders/'+orderId)}>เข้าสู่ระบบอีกครั้ง</a>:<button className="member-outline" onClick={()=>setRevision(v=>v+1)}>ลองโหลดอีกครั้ง</button>}</section>:<>
   <section className="member-card member-detail-heading"><div><span>เลขคำสั่งซื้อ</span><h2>#{orderNumber(order)}</h2><p><CalendarDays size={15}/>{paymentDate(order.created)} น.</p></div><div className="member-detail-state"><MemberBadge order={order}/><span className={'member-payment-state '+(order.payment==='ชำระแล้ว'?'paid':'')}><Wallet size={15}/>{order.payment==='ชำระแล้ว'?'ชำระเงินแล้ว':order.status==='ยกเลิก'?'ออเดอร์ยกเลิก':order.pending_slips>0?'แนบสลิปแล้ว · รอตรวจสอบ':'ยังไม่ได้ชำระเงิน'}</span></div><div className="member-detail-amount"><span>ยอดรวมทั้งสิ้น</span><strong>฿{money(order.total)}</strong></div></section>
   <div className="member-detail-grid"><div className="member-detail-main">
    <section className="member-card member-purchased-card"><div className="member-section-heading"><span className="member-icon"><Package size={25}/></span><div><h2>สินค้าที่คุณสั่ง</h2><p>{items?.length?items.length+' รายการ · รวม '+items.reduce((s,i)=>s+i.qty,0).toLocaleString()+' ชิ้น':'รายละเอียดจากออเดอร์เดิม'}</p></div></div>
     {items?.length?items.map((item,index)=><article className="member-purchased-item" key={item.id+'-'+index}><span className="member-product-icon"><Package size={28}/></span><div><h3>{item.name}</h3>{(item.sku||item.size)&&<p>{item.sku&&'รหัส '+item.sku}{item.sku&&item.size?' · ':''}{item.size}{item.size&&item.category==='กล่อง'?' ซม.':''}</p>}<span>{item.qty.toLocaleString()} {item.category==='กล่อง'?'ใบ':'ชิ้น'} × ฿{money(item.price)} / {item.category==='กล่อง'?'ใบ':'ชิ้น'}</span></div><strong>฿{money(item.price*item.qty)}</strong></article>):<p className="member-feedback">ไม่สามารถอ่านรายการสินค้าของออเดอร์เก่านี้ได้ กรุณาติดต่อร้านพร้อมเลขคำสั่งซื้อ</p>}
     <p className="member-snapshot-note"><Info size={15}/>แสดงชื่อ จำนวน และราคาตอนสั่งซื้อ แม้ราคาหน้าร้านจะเปลี่ยนไปแล้ว</p>
    </section>
    <section className="member-card member-shipment"><div className="member-section-heading"><span className="member-icon teal"><Truck size={25}/></span><div><h2>ข้อมูลการจัดส่ง</h2><p>ตรวจสอบเลขพัสดุและสถานะล่าสุดของออเดอร์นี้</p></div></div>{order.tracking?<div className="member-tracking-box"><div><small>บริษัทขนส่ง</small><strong>{order.carrier||'รอระบุขนส่ง'}</strong></div><div><small>เลขพัสดุ</small><strong className="member-tracking-number">{order.tracking}</strong></div><button className="member-copy" type="button" aria-label="คัดลอกเลขพัสดุ" onClick={copy}>{copied?<Check size={19}/>:<Copy size={19}/>}</button></div>:<p className="member-shipment-note">{order.status==='ยกเลิก'?'คำสั่งซื้อนี้ถูกยกเลิกแล้ว':'เลขพัสดุจะแสดงหลังร้านบันทึกข้อมูลจัดส่ง'}</p>}{copyMessage&&<p className="member-copy-message" role="status">{copyMessage}</p>}<a className="member-outline" href={'/track?token='+encodeURIComponent(order.token)}>ติดตามสถานะออเดอร์<ArrowRight size={17}/></a></section>
    <section className="member-card member-recipient"><div className="member-section-heading"><span className="member-icon"><MapPin size={24}/></span><div><h2>ที่อยู่จัดส่งของออเดอร์นี้</h2><p>ข้อมูลผู้รับที่บันทึกไว้ตอนสั่งซื้อ</p></div></div><strong>{order.customer}</strong><p><Phone size={15}/>{order.phone}</p><p className="member-address-text">{order.address}</p>{order.tax&&<details className="member-buyer-tax"><summary>ข้อมูลผู้ซื้อสำหรับใบกำกับภาษี</summary><p>{order.tax}</p></details>}</section>
   </div><aside className="member-detail-side"><section className="member-card member-order-summary"><div className="member-section-heading"><span className="member-icon"><ReceiptText size={24}/></span><div><h2>สรุปคำสั่งซื้อ</h2><p>ยอดเงินจากคำสั่งซื้อเดิม</p></div></div><dl>
     {!!order.special_discount&&<div className="discount"><dt>CODE พิเศษ {order.special_code}</dt><dd>−฿{money(order.special_discount)}</dd></div>}
     <div><dt>ยอดสินค้าตามเรท</dt><dd>฿{money(order.subtotal+(order.coupon_discount||0))}</dd></div>
     {order.coupon_discount-(order.special_discount||0)>0&&<div className="discount"><dt>ส่วนลด CODE {order.coupon_code}</dt><dd>−฿{money(order.coupon_discount-(order.special_discount||0))}</dd></div>}
     <div><dt>สินค้าก่อน VAT</dt><dd>฿{money(order.subtotal-order.vat)}</dd></div><div><dt>VAT (รวมในราคาสินค้า)</dt><dd>฿{money(order.vat)}</dd></div><div><dt>ค่าจัดส่ง</dt><dd>{order.shipping===0?<span className="member-free">ส่งฟรี</span>:'฿'+money(order.shipping)}</dd></div><div className="grand"><dt>ยอดรวมทั้งสิ้น</dt><dd>฿{money(order.total)}</dd></div>
    </dl>{order.transferred_at&&<p className="member-transfer-time"><Wallet size={16}/><span>เวลาโอนเงินที่บันทึก<br/><strong>{paymentDate(order.transferred_at)} น.</strong></span></p>}
    {order.status!=='ยกเลิก'&&order.payment!=='ชำระแล้ว'&&<a className="member-primary" href={'/payment?token='+encodeURIComponent(order.token)}>{order.pending_slips>0?'ดูการแจ้งชำระเงิน':'ชำระเงิน / แนบสลิป'}<ArrowRight size={18}/></a>}
    {order.payment==='ชำระแล้ว'&&<div className="member-paid-note"><Check size={18}/>ร้านยืนยันรับชำระเงินแล้ว</div>}
    </section><section className="member-card member-order-help"><span className="member-icon teal"><Phone size={23}/></span><h3>ให้เราช่วยดูแลออเดอร์นี้</h3><p>แจ้งเลขคำสั่งซื้อ #{orderNumber(order)}<br/>เพื่อให้ทีมงานตรวจสอบได้รวดเร็ว</p><a className="member-outline" href={telephone(brand.phone)}><Phone size={16}/>{brand.phone}</a>{brand.lineUrl&&<a className="member-text-link" href={brand.lineUrl} target="_blank" rel="noreferrer">ติดต่อผ่าน LINE<ArrowRight size={15}/></a>}</section><button className="member-detail-reload" onClick={()=>setRevision(v=>v+1)}><RefreshCw size={16}/>อัปเดตสถานะล่าสุด</button></aside></div>
  </>}
 </>;
}
