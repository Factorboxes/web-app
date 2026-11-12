'use client';
import NotificationBell from '../notifications/bell';
import PriceListViewer from './price-list-viewer';
import styles from './line-contact.module.css';
import price from './price-actions.module.css';
import {ArrowUpRight,Download,Phone,MessageCircle,Globe,Smartphone,FileText,Check,UserRound} from 'lucide-react';
import {useBranding} from '../branding-context';
import {telephone} from '@/lib/branding';
const sheet='/price-lists/factorboxes-customer-price-20261106.png';
const lineUrl='https://lin.ee/Rsw5EGA';
export default function Guide(){
 const brand=useBranding();
 return <div className="fb-guide"><header><a className="guide-brand" href="/"><img src="/app-icons/icon-192.png" alt="" width="40" height="40"/><b>FACTOR<span>BOXES</span></b></a><div className="guide-header-right" id="contact"><nav className="guide-header-contacts" aria-label="ติดต่อ FACTORBOXES"><a className="guide-header-contact phone" href={telephone(brand.phone)} title={'โทร '+brand.phone} aria-label={'โทร '+brand.phone}><Phone size={19}/><span>{brand.phone}</span></a><a className="guide-header-contact line" href={lineUrl} title="เพิ่มเพื่อน LINE" aria-label="เพิ่มเพื่อน FACTORBOXES บน LINE" target="_blank" rel="noopener noreferrer"><MessageCircle size={19}/><span>เพิ่มเพื่อน LINE</span></a>{brand.facebookUrl?<a className="guide-header-contact facebook" href={brand.facebookUrl} title="Facebook ของร้าน" aria-label="Facebook ของร้าน" target="_blank" rel="noopener noreferrer"><Globe size={19}/><span>Facebook</span></a>:<a className="guide-header-contact facebook" href="https://www.facebook.com/search/top?q=Factorboxes" title="ค้นหา FACTORBOXES บน Facebook" aria-label="ค้นหา FACTORBOXES บน Facebook" target="_blank" rel="noopener noreferrer"><Globe size={19}/><span>Facebook</span></a>}</nav><div className="guide-header-account"><NotificationBell/><a href="/login" title="เข้าสู่ระบบ" aria-label="เข้าสู่ระบบ"><UserRound size={19}/><span>เข้าสู่ระบบ</span></a></div></div></header><main>
 <section className="guide-card" id="prices"><div className={price.heading}><div><span className="guide-kicker">01 / ราคาใหม่ เริ่ม 05/11/2569</span><h2>ใบราคากล่องไปรษณีย์</h2><p>ราคาเดียว เริ่มต้น 0.58 บาท/ใบ</p></div><div className={price.actions}><a className={price.buy} href="/store">เลือกซื้อสินค้า<ArrowUpRight size={16} aria-hidden="true"/></a><a className={price.download} href={sheet} download="factorboxes-customer-price-20261106.png"><Download size={16} aria-hidden="true"/>ดาวน์โหลดใบราคา</a></div></div><p className="guide-note">ราคายังไม่รวม VAT 7% และค่าจัดส่ง · คำนวณจำนวนห่อตามสินค้า น้ำหนักไม่เกิน 25 กก./ห่อ</p><PriceListViewer src={sheet} title="ใบราคาใหม่ FACTORBOXES" description="ใบราคากล่องไปรษณีย์และกล่องผลไม้ FACTORBOXES 43 รายการ ราคายังไม่รวม VAT และค่าจัดส่ง" downloadName="factorboxes-customer-price-20261106.png"/><a className="guide-primary" href="/store">เลือกซื้อกล่อง<ArrowUpRight size={19}/></a></section>
 <section className={styles.card} aria-labelledby="line-contact-heading">
  <img src="/contact/line-factorboxes.png" width="180" height="180" alt="คิวอาร์โค้ดเพิ่มเพื่อน FACTORBOXES บน LINE" />
  <div><h2 id="line-contact-heading">คุยกับเราทาง LINE</h2><p>สแกนคิวอาร์โค้ด หรือแตะปุ่มเพื่อสอบถามราคาและสั่งซื้อ</p>
  <a href={lineUrl} target="_blank" rel="noopener noreferrer">เพิ่มเพื่อน LINE <ArrowUpRight size={17}/></a></div>
 </section>
 <section className="guide-hero"><p className="guide-eyebrow">FACTORBOXES · ALWAYS WITH YOU</p><h1>ร้านกล่องของคุณ<br/><em>อยู่ใกล้แค่ปลายนิ้ว</em></h1><p>ติดตั้งทางลัด ดูราคา และติดต่อร้านได้ง่าย<br/>ครบในหน้าเดียว</p><nav><a href="#install"><Smartphone/>ติดตั้งแอป</a><a href="#contact"><MessageCircle/>ติดต่อเรา</a><a href="#prices"><FileText/>ใบราคา</a></nav></section>
 <section className="guide-card guide-install" id="install"><div><span className="guide-kicker">02 / เพิ่มร้านลงมือถือ</span><h2>กดครั้งเดียว ก็เข้าร้านได้</h2><p>เพิ่มไอคอน FACTORBOXES ลงหน้าจอ<br/>ไม่ต้องค้นหาเว็บไซต์ใหม่ทุกครั้ง</p><a className="guide-primary" href="/install"><Smartphone size={20}/>ดูวิธีติดตั้งบนมือถือ<ArrowUpRight size={18}/></a><small>รองรับ iPhone และ Android · ไม่ต้องผ่าน App Store</small></div><div className="guide-app"><img src="/app-icons/icon-192.png" alt="ไอคอนแอป FACTORBOXES" width="96" height="96"/><b>FACTORBOXES</b><span><Check size={16}/>เลือกซื้อ · เช็กออเดอร์ · ติดตามพัสดุ</span></div></section>

 </main><footer>PACK YOUR NEXT POSSIBILITY<br/><small>FACTORBOXES · โรงงานผลิตกล่องพัสดุ</small></footer></div>
}



