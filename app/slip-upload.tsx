'use client';
import {useRef,useState,useEffect} from 'react';
import {ArrowRight,CalendarDays,Check,CloudUpload,FileImage,LockKeyhole,ReceiptText,Trash2} from 'lucide-react';
import {transferTimestamp} from '@/lib/payment-view';

export default function SlipUpload({token,onUploaded}:{token:string;onUploaded?:()=>void}) {
  const [transferred,setTransferred]=useState(''),[file,setFile]=useState<File|null>(null);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[dragging,setDragging]=useState(false);
  const input=useRef<HTMLInputElement>(null),sending=useRef(false);
  const [preview,setPreview]=useState('');
  useEffect(()=>{if(!file){setPreview('');return}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url)},[file]);
  function choose(f:File|null) {
    if(sending.current)return;
    if(f&&(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size===0||f.size>4*1024*1024)) {
      setFile(null);if(input.current)input.current.value='';
      setMessage('เลือกภาพ JPG, PNG หรือ WEBP ขนาดไม่เกิน 4 MB');return;
    }
    setFile(f);setMessage('');if(!f&&input.current)input.current.value='';
  }
  async function upload(e:React.FormEvent) {
    e.preventDefault();if(!file||sending.current)return;
    sending.current=true;setBusy(true);setMessage('');
    try {
      const form=new FormData();form.set('token',token);form.set('file',file);
      form.set('transferred_at',transferTimestamp(transferred));
      const r=await fetch('/api/slips',{method:'POST',body:form});
      const d=await r.json() as {error?:string};
      if(!r.ok)throw Error(d.error||'ส่งสลิปไม่สำเร็จ กรุณาลองอีกครั้ง');
      setMessage('แนบสลิปแล้ว รอร้านตรวจสอบยอดเงิน');setFile(null);if(input.current)input.current.value='';onUploaded?.();
    }catch(e){setMessage((e as Error).message)}finally{sending.current=false;setBusy(false)}
  }
  return <form className="payment-slip-form" onSubmit={upload} aria-busy={busy}>
    <div className="pay-upload-heading"><h2>อัปโหลดสลิปการชำระเงิน</h2><span>โอนแล้ว แนบสลิปที่นี่</span></div>
    <div className="pay-upload-grid">
      <div className={'pay-dropzone '+(dragging?'is-dragging ':'')+(file?'has-file':'')} onDragOver={e=>{e.preventDefault();if(!busy)setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);choose(e.dataTransfer.files[0]||null)}}>
        <input ref={input} className="pay-file-input" id="payment-slip-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>choose(e.target.files?.[0]||null)}/>
        {!file?<label htmlFor="payment-slip-file"><span className="pay-upload-icon"><CloudUpload size={44}/></span><strong>คลิกเพื่อเลือกไฟล์</strong><span>หรือลากภาพสลิปมาวางที่นี่</span><small>JPG, PNG, WEBP · ขนาดไม่เกิน 4 MB</small></label>:<div className="pay-file-preview">{preview&&<img src={preview} alt="ภาพสลิปที่เลือก"/>}<div><FileImage size={20}/><span>{file.name}<small>{(file.size/1024/1024).toFixed(2)} MB · พร้อมส่ง</small></span><button type="button" disabled={busy} onClick={()=>choose(null)} aria-label="นำสลิปออก"><Trash2 size={19}/></button></div><button type="button" className="pay-link" disabled={busy} onClick={()=>input.current?.click()}>เลือกภาพใหม่</button></div>}
      </div>
      <aside className="pay-slip-guide"><div className="pay-guide-heading"><span><ReceiptText size={24}/></span><div><h3>สลิปชัดเจน ตรวจสอบได้เร็ว</h3><p>ตรวจให้ครบก่อนส่ง</p></div></div><ul>{['เห็นชื่อธนาคารและบัญชีผู้รับ','เห็นวันที่และเวลาโอนเงิน','เห็นจำนวนเงินครบถ้วน','ภาพคมชัด ไม่ถูกตัดขอบ'].map(text=><li key={text}><Check size={18}/>{text}</li>)}</ul><small>แนบได้สูงสุด 5 ครั้งต่อออเดอร์</small></aside>
    </div>
    <div className="pay-transfer-row"><label htmlFor="payment-transfer-time">วันที่และเวลาโอนเงิน <span>*</span><div className="pay-time-field"><CalendarDays size={21}/><input id="payment-transfer-time" type="datetime-local" required disabled={busy} value={transferred} onChange={e=>setTransferred(e.target.value)} aria-describedby="pay-time-help"/></div></label><p id="pay-time-help">ระบุเวลาให้ตรงกับสลิป<br/><span>เวลาในประเทศไทย (GMT+7)</span></p></div>
    {message&&<p className="pay-form-error" role="alert">{message}</p>}
    <button type="submit" className="pay-submit" disabled={!file||!transferred||busy}>{busy?'กำลังส่งสลิป…':'ยืนยันการแจ้งชำระเงิน'}<ArrowRight size={24}/></button>
    <p className="pay-upload-note"><LockKeyhole size={15}/><span>ร้านตรวจสอบสลิปก่อนเปลี่ยนสถานะเป็น “ชำระแล้ว”</span></p>
  </form>;
}
