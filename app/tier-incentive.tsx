'use client';
import {Truck,TrendingDown,Plus} from 'lucide-react';
import {money} from '@/lib/catalog';
import {tierIncentive} from '@/lib/tier-incentive';
export default function TierIncentive({items,freeShipping,onAdd}:{items:{price:number,tiers?:number[],qty:number}[],freeShipping:number,onAdd:()=>void}){
 if(!items.length)return null;
 const r=tierIncentive(items,freeShipping);
 const percent=r.percent>0&&r.percent<0.01?'<0.01':r.percent.toLocaleString('th-TH',{maximumFractionDigits:2});
 return <section className="tierincentive" aria-label="สิทธิ์ส่งฟรีและราคาเรทถัดไป"><p className="tierfreight"><Truck size={19}/>{r.shippingRemaining>0?<>เพิ่มอีก <b>฿{money(r.shippingRemaining)}</b> ก็ส่งฟรี!</>:<b>ออเดอร์นี้ส่งฟรีแล้ว!</b>}</p>{r.target!==null?<><h3>เพิ่มสินค้าอีกเพียง <strong>฿{money(r.remaining)}</strong></h3><p>รับราคาเรท <b>{(r.target/100).toLocaleString('th-TH')} บาท</b> อัตโนมัติ</p><div className="tiermeter" role="progressbar" aria-label="ยอดสะสมเพื่อรับเรทถัดไป" aria-valuemin={0} aria-valuemax={r.target/100} aria-valuenow={r.base/100} aria-valuetext={'ขาดอีก '+money(r.remaining)+' บาท'}><span style={{width:Math.min(100,r.base/r.target*100)+'%'}}/></div>{r.savings>0?<div className="tiersaving"><TrendingDown size={21}/><p>สินค้าที่เลือกไว้จะถูกลงอีก <b>{percent}%</b><br/>ประหยัดเพิ่ม <b>฿{money(r.savings)}</b> เมื่อเทียบกับเรทปัจจุบัน</p></div>:<p className="muted">เมื่อยอดถึงเกณฑ์ ระบบจะใช้ราคาเรทถัดไปให้อัตโนมัติ</p>}<button type="button" className="secondary wide" onClick={onAdd}><Plus size={17}/>เลือกสินค้าเพิ่ม</button>{r.savings>0&&<small>ส่วนต่างคำนวณจากสินค้าและจำนวนที่เลือกอยู่ เมื่อใช้เรทถัดไป ไม่รวมสินค้าที่จะเพิ่มและ CODE ส่วนลด</small>}</>:<><h3>คุณได้รับราคาเรทสูงสุดแล้ว!</h3><p>ใช้ราคาเรท 50,000 บาทกับสินค้าที่เลือกโดยอัตโนมัติ</p><button type="button" className="secondary wide" onClick={onAdd}><Plus size={17}/>เลือกสินค้าเพิ่ม</button></>}<small>ยอดสะสมเพื่อเลือกเรทคำนวณจากราคาเรทแรก ก่อน CODE ส่วนลด ไม่รวมค่าจัดส่ง</small></section>
}
