'use client';
import {useState,useEffect} from 'react';
import {money} from '@/lib/catalog';
import {couponState,type ManagedCoupon} from '@/lib/coupon-rules';
import './coupons.css';
const empty={code:'',kind:'fixed',value:'',minimum:'0',active:true,start:'',end:'',max:'',personal:''};
const localDate=(s?:string|null)=>s?new Date(Date.parse(s)+7*3600000).toISOString().slice(0,10):'';
export default function Coupons(){
 const [rows,setRows]=useState<ManagedCoupon[]>([]),[form,setForm]=useState(empty),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[message,setMessage]=useState(''),[editing,setEditing]=useState(false),[query,setQuery]=useState('');
 async function load(){setLoading(true);try{const r=await fetch('/api/coupons',{cache:'no-store'}),d=await r.json();if(!r.ok)throw Error(d.error);setRows(d.coupons)}finally{setLoading(false)}}
 useEffect(()=>{load().catch(e=>setMessage(e.message))},[]);
 async function save(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setMessage('');try{
 const code=form.code.trim().toUpperCase();if(!editing&&rows.some(c=>c.code===code))throw Error('CODE นี้มีแล้ว กดแก้ไขจากรายการได้เลย');
 const r=await fetch('/api/coupons',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,kind:form.kind,value:Math.round(Number(form.value)*100),minimum:Math.round(Number(form.minimum)*100),active:form.active?1:0,starts_at:form.start?new Date(form.start+'T00:00:00+07:00').toISOString():null,ends_at:form.end?new Date(form.end+'T23:59:59.999+07:00').toISOString():null,max_uses:form.max?Number(form.max):null,per_member:form.personal?Number(form.personal):null})});const d=await r.json();if(!r.ok)throw Error(d.error);setForm(empty);setEditing(false);await load();setMessage('บันทึก CODE สำเร็จแล้ว');
 }catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 function edit(c:ManagedCoupon){setEditing(true);setForm({code:c.code,kind:c.kind,value:String(c.value/100),minimum:String(c.minimum/100),active:!!c.active,start:localDate(c.starts_at),end:localDate(c.ends_at),max:c.max_uses==null?'':String(c.max_uses),personal:c.per_member==null?'':String(c.per_member)});document.getElementById('coupon-editor')?.scrollIntoView({behavior:'smooth',block:'start'})}
 const visible=rows.filter(c=>c.code.includes(query.trim().toUpperCase()));
 return <section className="coupon-manager"><header><div><small>PROMOTION CENTER</small><h2>จัดการ CODE ส่วนลด</h2><p>กำหนดช่วงเวลาและสิทธิ์ให้ชัดเจน พร้อมดูจำนวนที่ใช้แล้ว</p></div><button className="secondary" disabled={loading} onClick={()=>load().catch(e=>setMessage(e.message))}>รีเฟรชข้อมูล</button></header>
 <div className="coupon-stats">{[['CODE ทั้งหมด',rows.length],['ใช้งานได้',rows.filter(c=>couponState(c)==='ใช้งานได้').length],['ใช้ไปแล้ว (ครั้ง)',rows.reduce((s,c)=>s+Number(c.used_total||0),0)],['หมดอายุ / สิทธิ์เต็ม',rows.filter(c=>['หมดอายุ','สิทธิ์เต็ม'].includes(couponState(c))).length]].map(([label,n])=><article key={label}><span>{label}</span><strong>{n}</strong></article>)}</div>
 <div className="coupon-rule">1 ออเดอร์ ใช้ได้ 1 CODE · ลดจากราคาตามเรทแล้ว · ไม่รวมค่าจัดส่ง</div>
 <form id="coupon-editor" className="coupon-box" onSubmit={save}><h3>{editing?'แก้ไข '+form.code:'สร้าง CODE ใหม่'}</h3><fieldset disabled={busy||loading} className="coupon-fields">
 <label>รหัส CODE<input required readOnly={editing} pattern="[A-Za-z0-9_-]{2,30}" placeholder="เช่น WELCOME50" value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})}/></label>
 <label>ประเภทส่วนลด<select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})}><option value="fixed">ลดเป็นบาท</option><option value="percent">ลดเป็นเปอร์เซ็นต์</option></select></label>
 <label>ส่วนลด ({form.kind==='fixed'?'บาท':'%'})<input type="number" required min="0.01" step="0.01" max={form.kind==='percent'?100:1000000} value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></label>
 <label>ยอดสินค้าขั้นต่ำ (บาท)<input type="number" required min="0" step="0.01" max="1000000" value={form.minimum} onChange={e=>setForm({...form,minimum:e.target.value})}/></label>
 <label>วันที่เริ่มใช้<input type="date" value={form.start} onChange={e=>setForm({...form,start:e.target.value})}/><small>เว้นว่าง = เริ่มทันที</small></label>
 <label>วันที่หมดอายุ<input type="date" min={form.start||undefined} value={form.end} onChange={e=>setForm({...form,end:e.target.value})}/><small>ถึงสิ้นวันตามเวลาไทย · เว้นว่าง = ไม่หมดอายุ</small></label>
 <label>จำนวนสิทธิ์ทั้งหมด (ครั้ง)<input type="number" min="1" max="100000000" step="1" placeholder="ไม่จำกัด" value={form.max} onChange={e=>setForm({...form,max:e.target.value})}/><small>เช่น 100 = ใช้ได้รวม 100 ออเดอร์</small></label>
 <label>ใช้ได้ต่อสมาชิก (ครั้ง)<input type="number" min="1" max="100000000" step="1" placeholder="ไม่จำกัด" value={form.personal} onChange={e=>setForm({...form,personal:e.target.value})}/><small>ถ้ากำหนด ลูกค้าต้องเข้าสู่ระบบก่อนใช้</small></label>
 <label className="coupon-toggle"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/>เปิดใช้งาน CODE</label>
 </fieldset><p className="coupon-help">นับสิทธิ์เมื่อยืนยันออเดอร์สำเร็จ ไม่หักสิทธิ์ตอนลองกรอก CODE การยกเลิกหรือลบออเดอร์ไม่คืนสิทธิ์อัตโนมัติ</p><div className="coupon-actions"><button className="primary" disabled={busy||loading}>{busy?'กำลังบันทึก…':editing?'บันทึกการแก้ไข':'สร้าง CODE'}</button>{editing&&<button type="button" className="secondary" disabled={busy} onClick={()=>{setForm(empty);setEditing(false)}}>ยกเลิกการแก้ไข</button>}</div></form>
 {message&&<p role="status" className="notice">{message}</p>}
 <section className="coupon-box"><div className="coupon-list-head"><h3>รายการ CODE ({rows.length})</h3><input aria-label="ค้นหา CODE" placeholder="ค้นหารหัส CODE…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
 {loading?<p>กำลังโหลดข้อมูล…</p>:!visible.length?<p>ไม่พบ CODE</p>:<div className="coupon-table-wrap"><table><thead><tr>{['CODE / ส่วนลด','ระยะเวลา (ไทย)','ใช้แล้ว / สิทธิ์ทั้งหมด','ต่อสมาชิก','สถานะ','จัดการ'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{visible.map(c=><tr key={c.code}><td><strong>{c.code}</strong><small>ลด {money(c.value)}{c.kind==='fixed'?' บาท':'%'} · ขั้นต่ำ {money(c.minimum)} บาท</small></td><td>{localDate(c.starts_at)||'เริ่มทันที'}<small>ถึง {localDate(c.ends_at)||'ไม่หมดอายุ'}</small></td><td><b>{c.used_total||0} / {c.max_uses??'ไม่จำกัด'}</b><small>{c.max_uses!=null?'เหลือ '+Math.max(0,c.max_uses-(c.used_total||0))+' สิทธิ์':'ใช้ได้ไม่จำกัดจำนวน'}</small></td><td>{c.per_member==null?'ไม่จำกัด':c.per_member+' ครั้ง'}</td><td><span className={'coupon-status '+(couponState(c)==='ใช้งานได้'?'good':'')}>{couponState(c)}</span></td><td><button className="secondary" disabled={busy} onClick={()=>edit(c)}>แก้ไข</button></td></tr>)}</tbody></table></div>}</section></section>
}
