'use client';

import {useState, useEffect, type FormEvent} from 'react';
import {Mail, LockKeyhole, Eye, EyeOff, ArrowRight, Truck, ReceiptText, MapPin} from 'lucide-react';
import {browserAuth, readRememberLogin, setRememberLogin} from '@/lib/supabase/browser';
import {loginDestination} from '@/lib/supabase/session';

type Mode = 'login' | 'signup' | 'reset' | 'password';
const titles: Record<Mode, string> = {login: 'เข้าสู่ระบบ', signup: 'สมัครสมาชิก', reset: 'ลืมรหัสผ่าน', password: 'ตั้งรหัสผ่านใหม่'};

export default function Login() {
  const [freeShipping, setFreeShipping] = useState<number | null>(null);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<Mode>('login');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const requested = new URLSearchParams(location.search).get('mode');
    if (requested === 'password' || requested === 'signup' || requested === 'reset') setMode(requested);
    setRemember(readRememberLogin());
    fetch('/api/shop').then(r => r.ok ? r.json() : null).then(d => {
      if (typeof d?.settings?.freeShipping === 'number') setFreeShipping(d.settings.freeShipping);
    }).catch(() => {});
  }, []);

  function switchMode(next: Mode) {
    setMode(next); setShow(false); setMessage('');
    const url = new URL(location.href);
    if (next === 'login') url.searchParams.delete('mode');
    else url.searchParams.set('mode', next);
    history.replaceState(null, '', url.pathname + url.search);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setMessage('');
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    try {
      if (mode === 'login' || mode === 'signup') setRememberLogin(remember);
      const client = browserAuth();
      if (mode === 'signup') {
        const {error} = await client.auth.signUp({email, password, options: {emailRedirectTo: location.origin + '/auth/callback'}});
        if (error) throw error;
        setMessage('ตรวจสอบอีเมลเพื่อยืนยันบัญชี แล้วเข้าสู่ระบบและกรอกที่อยู่จัดส่งที่หน้าสมาชิก');
      } else if (mode === 'reset') {
        const {error} = await client.auth.resetPasswordForEmail(email, {redirectTo: location.origin + '/auth/callback?next=/login%3Fmode%3Dpassword'});
        if (error) throw error;
        setMessage('หากมีบัญชีนี้ ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ทางอีเมล');
      } else if (mode === 'password') {
        const {error} = await client.auth.updateUser({password});
        if (error) throw error;
        location.assign('/account');
      } else {
        const {error} = await client.auth.signInWithPassword({email, password});
        if (error) throw error;
        location.assign(loginDestination(new URLSearchParams(location.search).get('next')));
      }
    } catch {
      setMessage('ทำรายการไม่สำเร็จ ตรวจสอบอีเมล รหัสผ่าน และการยืนยันอีเมล หรือลองใหม่อีกครั้ง');
    } finally { setBusy(false); }
  }

  return <main className="login-scene">
    <a className="login-brand" href="/" aria-label="Factorboxes หน้าแรก">
      <span className="login-logo-halo"><img src="/factorboxes-login-logo.jpeg" alt="โลโก้ Factorboxes" width="150" height="155" fetchPriority="high"/></span>
      <strong>Factorboxes</strong><small>โรงงานผลิตกล่องพัสดุ</small>
    </a>
    <section className="login-glass" aria-labelledby="login-title">
      <h1 id="login-title">{titles[mode]}</h1>
      <p>{mode === 'reset' ? 'รับลิงก์ตั้งรหัสผ่านใหม่ทางอีเมล' : 'ยินดีต้อนรับสู่ Factorboxes'}</p>
      <form className="form login-form" method="post" onSubmit={submit} autoComplete="on" aria-busy={busy}>
        {mode !== 'password' && <label className="login-field">
          <Mail aria-hidden="true"/><span className="sr-only">อีเมล</span>
          <input id="login-email" name="email" type="email" inputMode="email" placeholder="Email" autoComplete={mode === 'login' ? 'username' : 'email'} autoCapitalize="none" spellCheck={false} required disabled={busy}/>
        </label>}
        {mode !== 'reset' && <label className="login-field">
          <LockKeyhole aria-hidden="true"/><span className="sr-only">รหัสผ่าน</span>
          <input id="login-password" name="password" type={show ? 'text' : 'password'} placeholder={mode === 'login' ? 'Password' : 'รหัสผ่านอย่างน้อย 8 ตัวอักษร'} minLength={mode === 'login' ? undefined : 8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} autoCapitalize="none" spellCheck={false} required disabled={busy}/>
          <button type="button" aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} aria-pressed={show} onClick={() => setShow(!show)} disabled={busy}>{show ? <EyeOff/> : <Eye/>}</button>
        </label>}
        {(mode === 'login' || mode === 'signup') && <div className="login-options">
          <label className="login-remember"><input type="checkbox" name="remember" checked={remember} onChange={e => setRemember(e.target.checked)} disabled={busy}/><span>จดจำการเข้าสู่ระบบ</span></label>
          {mode === 'login' && <button type="button" className="login-text-button" onClick={() => switchMode('reset')} disabled={busy}>ลืมรหัสผ่าน?</button>}
        </div>}
        {message && <p role="status" className="notice">{message}</p>}
        <button className="primary login-submit" disabled={busy} type="submit">{busy ? 'กำลังดำเนินการ…' : mode === 'reset' ? 'ส่งลิงก์ตั้งรหัสผ่าน' : mode === 'password' ? 'บันทึกรหัสผ่าน' : titles[mode]}<ArrowRight aria-hidden="true"/></button>
        <div className="login-switch">{mode === 'login' ? <><span>ยังไม่มีบัญชี?</span><button className="login-text-button" type="button" onClick={() => switchMode('signup')} disabled={busy}>สมัครสมาชิก</button></> : <button className="login-text-button" type="button" onClick={() => switchMode('login')} disabled={busy}>กลับเข้าสู่ระบบ</button>}</div>
      </form>
    </section>
    <div className="login-benefits">
      <span><Truck aria-hidden="true"/><b>{freeShipping !== null ? `ส่งฟรีครบ ฿${freeShipping.toLocaleString('th-TH')}` : 'สั่งซื้อง่าย'}</b><small>สั่งง่าย คุ้มกว่า</small></span>
      <span><ReceiptText aria-hidden="true"/><b>ราคารวม VAT</b><small>ขอใบกำกับภาษี</small></span>
      <span><MapPin aria-hidden="true"/><b>จัดส่งทั่วไทย</b><small>เช็กสถานะได้</small></span>
    </div>
    <p className="login-tagline">PACK YOUR NEXT POSSIBILITY</p>
    <a className="login-back" href="/store">เลือกชมสินค้าก่อน <ArrowRight aria-hidden="true" size={16}/></a>
  </main>;
}
