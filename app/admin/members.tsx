'use client';
import {useState,useEffect} from 'react';
import {Users,Search,RefreshCw,CheckCircle2,ClipboardList,ChevronLeft,ChevronRight} from 'lucide-react';
import {missingMemberFields,type MemberDirectoryRow} from '@/lib/member-directory';
import './members.css';
type Result={members:MemberDirectoryRow[];total:number;page:number;pages:number;stats:{total:number;incomplete:number}};
export default function Members(){
 const [result,setResult]=useState<Result|null>(null),[query,setQuery]=useState(''),[search,setSearch]=useState(''),[filter,setFilter]=useState('all'),[page,setPage]=useState(1),[refresh,setRefresh]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{const abort=new AbortController();setLoading(true);setError('');const params=new URLSearchParams({admin:'1',q:search,filter,page:String(page)});
  fetch('/api/member?'+params,{cache:'no-store',signal:abort.signal}).then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.error||'โหลดข้อมูลไม่สำเร็จ');return data as Result}).then(setResult).catch(e=>{if(e.name!=='AbortError')setError(e.message)}).finally(()=>{if(!abort.signal.aborted)setLoading(false)});
  return ()=>abort.abort();
 },[search,filter,page,refresh]);
 return <section className="member-directory" aria-busy={loading}>
 <header><div><h2><Users size={25}/>สมาชิกและที่อยู่จัดส่ง</h2><p>ตรวจข้อมูลลูกค้าและสถานะการกรอกที่อยู่ได้ในหน้านี้</p></div><button className="secondary" disabled={loading} onClick={()=>setRefresh(v=>v+1)}><RefreshCw size={16}/>{loading?'กำลังโหลด…':'รีเฟรชรายชื่อ'}</button></header>
 <div className="member-directory-stats"><article><Users/><span>สมาชิกทั้งหมด</span><strong>{result?.stats?.total??'—'}</strong></article><article><CheckCircle2/><span>ข้อมูลพร้อมจัดส่ง</span><strong>{result?result.stats.total-result.stats.incomplete:'—'}</strong></article><article><ClipboardList/><span>รอกรอกข้อมูลเพิ่ม</span><strong>{result?.stats?.incomplete??'—'}</strong></article></div>
 <p className="member-directory-note">บางบัญชีอาจสมัครด้วยอีเมลแล้ว แต่ยังไม่ได้กรอกที่อยู่ ลูกค้าสามารถเพิ่มข้อมูลได้ที่ “บัญชีของฉัน”</p>
 <form className="member-directory-search" onSubmit={e=>{e.preventDefault();setSearch(query.trim());setPage(1);setRefresh(v=>v+1)}}><label><Search size={18}/><input aria-label="ค้นหาสมาชิก" placeholder="ค้นหาชื่อ อีเมล หรือเบอร์โทร" value={query} maxLength={100} onChange={e=>setQuery(e.target.value)}/></label><button className="primary" type="submit" disabled={loading}>ค้นหา</button><select aria-label="กรองสถานะข้อมูลสมาชิก" value={filter} onChange={e=>{setFilter(e.target.value);setPage(1)}}><option value="all">สมาชิกทั้งหมด</option><option value="incomplete">รอกรอกข้อมูลเพิ่ม</option></select></form>
 {error?<div className="member-directory-error" role="alert"><p>{error}</p><button className="secondary" onClick={()=>setRefresh(v=>v+1)}>ลองโหลดอีกครั้ง</button></div>:loading?<p role="status">กำลังโหลดรายชื่อสมาชิก…</p>:!result?.members.length?<p role="status">{search||filter!=='all'?'ไม่พบสมาชิกตามเงื่อนไขที่ค้นหา':'ยังไม่มีข้อมูลสมาชิกในระบบ'}</p>:<>
 <div className="member-directory-table"><table><thead><tr><th>ชื่อ / อีเมล</th><th>เบอร์โทร</th><th>ที่อยู่จัดส่ง</th><th>สถานะข้อมูล</th></tr></thead><tbody>{result.members.map(m=>{const missing=missingMemberFields(m);return <tr key={m.id}><td><b>{m.name?.trim()||'ยังไม่ได้กรอกชื่อ'}</b><small>{m.email||'ยังไม่มีอีเมลติดต่อ'}</small></td><td>{m.phone||<span className="missing">ยังไม่ได้กรอกเบอร์</span>}</td><td>{m.address?<>{m.address}<small>รหัสไปรษณีย์ {m.postcode||'ยังไม่ได้กรอก'}</small></>:<span className="missing">ยังไม่ได้บันทึกที่อยู่</span>}</td><td><span className={'member-data-status '+(missing.length?'pending':'complete')}>{missing.length?'รอกรอกข้อมูล':'ข้อมูลพร้อมจัดส่ง'}</span>{!!missing.length&&<small>ขาด: {missing.join(' / ')}</small>}</td></tr>})}</tbody></table></div>
 <footer><span>พบ {result.total.toLocaleString('th-TH')} คน · หน้า {result.page} / {result.pages}</span><div><button className="secondary" aria-label="หน้าก่อนหน้า" disabled={result.page<=1} onClick={()=>setPage(result.page-1)}><ChevronLeft size={18}/></button><button className="secondary" aria-label="หน้าถัดไป" disabled={result.page>=result.pages} onClick={()=>setPage(result.page+1)}><ChevronRight size={18}/></button></div></footer></>}
 </section>;
}
