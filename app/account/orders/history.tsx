'use client';
import {useState,useEffect} from 'react';
import {ArrowRight,Search,ReceiptText,Package,ChevronLeft,ChevronRight,Link2,Plus,RefreshCw} from 'lucide-react';
import {orderNumber} from '@/lib/order-number';
import {money} from '@/lib/catalog';
import {paymentDate} from '@/lib/payment-view';
import {memberOrderFilters,memberFilterLabels,memberStatus,purchasedItems,savedOrderToken,type MemberOrder,type MemberOrderFilter} from '@/lib/member-orders';

export function MemberBadge({order}:{order:MemberOrder}){const badge=memberStatus(order);return <span className={'member-status '+badge.tone}><i/>{badge.label}</span>}
function ItemSummary({order}:{order:MemberOrder}){
 const items=purchasedItems(order.items);
 if(!items?.length)return <span className="member-muted">เปิดดูข้อมูลคำสั่งซื้อ</span>;
 return <div className="member-item-summary"><span>{items[0].name} <small>({items[0].qty.toLocaleString()} {items[0].category==='กล่อง'?'ใบ':'ชิ้น'})</small></span>{items.length>1&&<small>และอีก {items.length-1} รายการ · รวม {items.reduce((s,i)=>s+i.qty,0).toLocaleString()} ชิ้น</small>}</div>;
}
export default function OrderHistory({compact=false}:{compact?:boolean}){
 const [orders,setOrders]=useState<MemberOrder[]>([]),[total,setTotal]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState(''),[expired,setExpired]=useState(false);
 const [input,setInput]=useState(''),[query,setQuery]=useState(''),[filter,setFilter]=useState<MemberOrderFilter>('all'),[page,setPage]=useState(1),[revision,setRevision]=useState(0);
 const [token,setToken]=useState(''),[busy,setBusy]=useState(false),[claimMessage,setClaimMessage]=useState(''),[claimSuccess,setClaimSuccess]=useState(false);
 const limit=compact&&!query?4:10;
 useEffect(()=>{
  const controller=new AbortController();setLoading(true);setError('');setExpired(false);
  fetch('/api/member-orders?'+new URLSearchParams({query,filter,page:String(page),limit:String(limit)}),{cache:'no-store',signal:controller.signal}).then(async r=>{
   const d=await r.json();if(r.status===401)setExpired(true);if(!r.ok)throw Error(d.error||'โหลดประวัติไม่สำเร็จ');
   const pages=Math.max(1,Math.ceil(Number(d.total)/limit));if(page>pages){setPage(pages);return}
   setOrders(d.orders);setTotal(Number(d.total));
  }).catch(e=>{if(e.name!=='AbortError'){setOrders([]);setError(e.message)}}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return ()=>controller.abort();
 },[query,filter,page,limit,revision]);
 useEffect(()=>{const refresh=(e:PageTransitionEvent)=>{if(e.persisted)setRevision(r=>r+1)};window.addEventListener('pageshow',refresh);return ()=>window.removeEventListener('pageshow',refresh)},[]);
 function search(e:React.FormEvent){e.preventDefault();setPage(1);setQuery(input.trim());setRevision(v=>v+1)}
 function reset(){setPage(1);setInput('');setQuery('');setFilter('all')}
 async function claim(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setClaimMessage('');setClaimSuccess(false);try{
  const code=savedOrderToken(token);const r=await fetch('/api/member-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:code})});const d=await r.json();if(!r.ok)throw Error(d.error||'เพิ่มคำสั่งซื้อไม่สำเร็จ');
  setToken('');setClaimSuccess(true);setClaimMessage('เพิ่มคำสั่งซื้อเข้าประวัติแล้ว กดเลขออเดอร์เพื่อดูรายการสินค้าได้เลย');reset();setRevision(v=>v+1);
 }catch(e){setClaimMessage((e as Error).message)}finally{setBusy(false)}}
 const pages=Math.max(1,Math.ceil(total/limit));
 return <div className="member-history">
  <form className="member-card member-order-search" onSubmit={search}><div className="member-section-heading"><span className="member-icon bright"><Search size={25}/></span><div><h2>ค้นหาคำสั่งซื้อ</h2><p>ค้นหาเลขคำสั่งซื้อของคุณได้อย่างรวดเร็ว</p></div></div><div className="member-search-field"><Search size={20}/><input aria-label="ค้นหาคำสั่งซื้อ" placeholder="เลขคำสั่งซื้อ เช่น 0001 หรือชื่อสินค้า" autoCapitalize="none" value={input} maxLength={100} onChange={e=>setInput(e.target.value)}/></div><button className="member-primary" type="submit">ค้นหา</button></form>
  <section className="member-card member-history-card" aria-busy={loading}>
   <div className="member-section-heading"><span className="member-icon"><ReceiptText size={25}/></span><div><h2>{query?'ผลการค้นหาคำสั่งซื้อ':compact?'ประวัติคำสั่งซื้อล่าสุด':'คำสั่งซื้อของคุณ'}</h2><p>{query?'คำค้น “'+query+'”':compact?'รายการคำสั่งซื้อของคุณ':'เลือกรายการเพื่อดูสินค้าที่สั่งและรายละเอียดทั้งหมด'}</p></div>{compact?<a className="member-outline" href="/account/orders">ดูทั้งหมด<ArrowRight size={15}/></a>:<button className="member-refresh" aria-label="รีเฟรชประวัติคำสั่งซื้อ" disabled={loading} onClick={()=>setRevision(v=>v+1)}><RefreshCw size={19}/></button>}</div>
   {!compact&&<div className="member-order-filters" role="group" aria-label="กรองคำสั่งซื้อ">{memberOrderFilters.map(value=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>{setFilter(value);setPage(1)}}>{memberFilterLabels[value]}</button>)}</div>}
   {loading?<div className="member-loading" role="status"><span className="member-loading-dot"/>กำลังโหลดคำสั่งซื้อ…</div>:error?<div className="member-empty" role="alert"><ReceiptText size={35}/><h3>{error}</h3>{expired?<a className="member-primary" href={'/login?next='+encodeURIComponent(compact?'/account':'/account/orders')}>เข้าสู่ระบบอีกครั้ง</a>:<button className="member-outline" onClick={()=>setRevision(v=>v+1)}>ลองอีกครั้ง</button>}</div>:!orders.length?<div className="member-empty"><Package size={37}/><h3>{query||filter!=='all'?'ไม่พบคำสั่งซื้อที่ตรงกัน':'ยังไม่มีคำสั่งซื้อในบัญชีนี้'}</h3><p>{query||filter!=='all'?'ลองตรวจเลขคำสั่งซื้อ หรือเลือกดูรายการทั้งหมด':'เมื่อสั่งซื้อด้วยบัญชีนี้ คำสั่งซื้อจะแสดงที่นี่'}</p>{query||filter!=='all'?<button className="member-outline" onClick={reset}>ดูคำสั่งซื้อทั้งหมด</button>:<a className="member-primary" href="/store">เลือกซื้อสินค้า<ArrowRight size={17}/></a>}</div>:<>
    <div className="member-table-wrap"><table className="member-order-table"><thead><tr><th>เลขคำสั่งซื้อ</th><th>วันที่สั่งซื้อ</th><th>รายการสินค้า</th><th>ยอดรวม</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>{orders.map(order=><tr key={order.id}><td><a className="member-order-no" href={'/account/orders/'+encodeURIComponent(order.id)}>{orderNumber(order)}</a></td><td className="member-date-cell">{paymentDate(order.created)} น.</td><td><ItemSummary order={order}/></td><td className="member-money">฿{money(order.total)}</td><td><MemberBadge order={order}/></td><td><a className="member-detail-link" aria-label={'ดูรายละเอียดออเดอร์ '+orderNumber(order)} href={'/account/orders/'+encodeURIComponent(order.id)}>ดูรายละเอียด<ArrowRight size={15}/></a></td></tr>)}</tbody></table></div>
    <div className="member-order-cards">{orders.map(order=><article key={order.id}><div className="member-order-card-top"><a className="member-order-no" href={'/account/orders/'+encodeURIComponent(order.id)}>#{orderNumber(order)}</a><MemberBadge order={order}/></div><time>{paymentDate(order.created)} น.</time><ItemSummary order={order}/><div className="member-order-card-bottom"><span>ยอดรวม<strong>฿{money(order.total)}</strong></span><a className="member-outline" aria-label={'ดูรายละเอียดออเดอร์ '+orderNumber(order)} href={'/account/orders/'+encodeURIComponent(order.id)}>ดูรายละเอียด<ArrowRight size={17}/></a></div></article>)}</div>
   </>}
   {!loading&&!error&&orders.length>0&&(!compact||query)&&<div className="member-pagination"><span>แสดง {(page-1)*limit+1}–{Math.min(page*limit,total)} จาก {total.toLocaleString()} ออเดอร์</span><div><button aria-label="คำสั่งซื้อหน้าก่อนหน้า" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={18}/></button><span>หน้า {page} / {pages}</span><button aria-label="คำสั่งซื้อหน้าถัดไป" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}><ChevronRight size={18}/></button></div></div>}
   {compact&&!loading&&!error&&total>limit&&!query&&<div className="member-history-more"><span>มีคำสั่งซื้อทั้งหมด {total.toLocaleString()} ออเดอร์</span><a href="/account/orders">เปิดประวัติทั้งหมด<ArrowRight size={15}/></a></div>}
   {query&&<button className="member-clear-search" onClick={reset}>ล้างการค้นหา</button>}
  </section>
  {compact?<a className="member-missing-order" href="/account/orders#link-order"><Link2 size={15}/>สั่งก่อนเข้าสู่ระบบ? เพิ่มคำสั่งซื้อเดิมเข้าบัญชี<ChevronRight size={15}/></a>:<details className="member-card member-claim" id="link-order"><summary><span className="member-icon"><Link2 size={23}/></span><span><strong>เพิ่มคำสั่งซื้อเดิมเข้าบัญชี</strong><small>สำหรับคำสั่งซื้อก่อนเข้าสู่ระบบ</small></span><Plus size={20}/></summary><form onSubmit={claim}><p>วางลิงก์ชำระเงินหรือลิงก์ติดตามที่เก็บไว้หลังสั่งซื้อ เพื่อเพิ่มออเดอร์นั้นเข้าประวัติของคุณ</p><label>ลิงก์คำสั่งซื้อเดิม<input value={token} maxLength={2000} autoComplete="off" spellCheck={false} required onChange={e=>setToken(e.target.value)} placeholder="วางลิงก์ที่ได้รับหลังยืนยันออเดอร์"/></label><button className="member-primary" disabled={busy}>{busy?'กำลังตรวจสอบ…':'เพิ่มคำสั่งซื้อเข้าบัญชี'}<ArrowRight size={17}/></button>{claimMessage&&<p role="status" className={'member-feedback '+(claimSuccess?'success':'')}>{claimMessage}</p>}<small>ใช้ได้กับออเดอร์ที่ยังไม่ผูกกับบัญชีอื่น หากไม่มีลิงก์เดิม ติดต่อร้านเพื่อช่วยตรวจสอบ</small></form></details>}
 </div>;
}
