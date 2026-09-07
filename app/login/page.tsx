'use client';
import {useEffect,useState} from 'react';
import {Mail,Lock,Eye,EyeOff,Truck,ReceiptText,MapPin,ArrowRight} from 'lucide-react';
import {browserAuth} from '@/lib/supabase/browser';

export default function Login(){
  const [mode,setMode]=useState<'login'|'signup'|'reset'|'password'>('login');
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[show,setShow]=useState(false);
  useEffect(()=>{if(new URLSearchParams(location.search).get('mode')==='password')setMode('password')},[]);
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMessage('');const f=new FormData(e.currentTarget),email=String(f.get('email')||''),password=String(f.get('password')||''),client=browserAuth();
    try{
      if(mode==='signup'){
        const {error}=await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/auth/callback',data:{name:'',phone:'',address:'',postcode:''}}});
        if(error)throw error;setMessage('สมัครสมาชิกเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ');setMode('login');
      }else if(mode==='reset'){
        const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/auth/callback?next=/login%3Fmode%3Dpassword'});if(error)throw error;setMessage('หากมีบัญชีนี้ ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ทางอีเมล');
      }else if(mode==='password'){
        const {error}=await client.auth.updateUser({password});if(error)throw error;location.assign('/account');
      }else{
        const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;const next=new URLSearchParams(location.search).get('next')||'/shop';location.assign(next.startsWith('/')&&!next.startsWith('//')&&!next.includes('\\')?next:'/shop');
      }
    }catch{setMessage('ทำรายการไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่านแล้วลองใหม่อีกครั้ง')}finally{setBusy(false)}
  }
  const title=mode==='signup'?'ลงทะเบียน':mode==='reset'?'ลืมรหัสผ่าน':mode==='password'?'ตั้งรหัสผ่านใหม่':'เข้าสู่ระบบ';
  return <main className="fb-login-page">
    <div className="fb-login-shape one"/><div className="fb-login-shape two"/><div className="fb-login-shape three"/>
    <section className="fb-login-wrap">
      <div className="fb-login-brand"><img src="/factorboxes-login-logo.jpeg" alt="Factorboxes logo"/><h1>Factorboxes</h1><p>PACK YOUR NEXT POSSIBILITY</p></div>
      <form className="fb-login-card" onSubmit={submit}>
        <h2>{title}</h2>{mode==='login'&&<p className="fb-login-welcome">ยินดีต้อนรับสู่ Factorboxes</p>}
        {mode!=='password'&&<label className="fb-login-field"><Mail size={22}/><input name="email" type="email" placeholder="Email" autoComplete="email" required/></label>}
        {mode!=='reset'&&<label className="fb-login-field"><Lock size={22}/><input name="password" type={show?'text':'password'} placeholder="Password" minLength={8} autoComplete={mode==='login'?'current-password':'new-password'} required/><button type="button" className="fb-eye" onClick={()=>setShow(!show)} aria-label="แสดงรหัสผ่าน">{show?<EyeOff size={22}/>:<Eye size={22}/>}</button></label>}
        {mode==='login'&&<div className="fb-login-links"><button type="button" onClick={()=>setMode('reset')}>ลืมรหัสผ่าน?</button><button type="button" onClick={()=>setMode('signup')}>ลงทะเบียน</button></div>}
        {message&&<p className="fb-login-message">{message}</p>}
        <button className="fb-login-submit" disabled={busy}>{busy?'กำลังดำเนินการ…':title}<ArrowRight size={22}/></button>
        {mode!=='login'&&<button className="fb-back-login" type="button" onClick={()=>{setMode('login');setMessage('')}}>กลับเข้าสู่ระบบ</button>}
      </form>
      <div className="fb-login-benefits"><span><Truck/> <b>ส่งฟรีครบ ฿750</b><small>สั่งง่าย คุ้มกว่า</small></span><span><ReceiptText/> <b>ราคารวม VAT</b><small>ออกใบกำกับภาษีได้</small></span><span><MapPin/> <b>ส่งทั่วไทย</b><small>1-3 วัน ถึงมือคุณ</small></span></div>
    </section>
  </main>
}
