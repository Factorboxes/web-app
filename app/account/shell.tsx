'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {ChevronRight,Search,ShoppingCart,UserRound,Truck,Package,Phone,ReceiptText} from 'lucide-react';
import {useBranding} from '../branding-context';
import {telephone} from '@/lib/branding';

export function AccountHeader() {
  const path = usePathname();
  const [count,setCount] = useState(0);
  useEffect(()=>{
    const load=()=>{try{const cart=JSON.parse(localStorage.getItem('factor-cart')||'{}');setCount(Object.values(cart).filter(n=>typeof n==='number'&&n>0).length)}catch{setCount(0)}};
    load();window.addEventListener('storage',load);window.addEventListener('pageshow',load);
    return ()=>{window.removeEventListener('storage',load);window.removeEventListener('pageshow',load)};
  },[]);
  return <div className="member-header-wrap"><header className="member-header">
    <a className="member-brand" href="/store" aria-label="FACTORBOXES หน้าร้าน"><img src="/factorboxes-logo.jpeg" alt=""/><span><b>FACTOR</b><em>BOXES</em><small>PACK YOUR NEXT POSSIBILITY</small></span></a>
    <nav aria-label="เมนูสมาชิก"><a href="/store"><Package size={17}/>เลือกซื้อสินค้า</a><a href="/track"><Truck size={17}/>ติดตามพัสดุ</a><a href="/account/orders" aria-current={path.startsWith('/account/orders')?'page':undefined}><ReceiptText size={17}/>ประวัติคำสั่งซื้อ</a></nav>
    <form action="/store#catalog" className="member-product-search"><Search size={17}/><input name="search" aria-label="ค้นหาสินค้าในร้าน" placeholder="ค้นหาสินค้า…" maxLength={100}/><button aria-label="ค้นหาสินค้าในร้าน"><ChevronRight size={17}/></button></form>
    <a className="member-account-link" href="/account" aria-label="บัญชีของฉัน" aria-current={path==='/account'?'page':undefined}><UserRound size={21}/><span>บัญชีของฉัน</span></a>
    <a className="member-cart-link" href="/checkout" aria-label={'ตะกร้าสินค้า '+count+' รายการ'}><ShoppingCart size={26}/><b>{count>99?'99+':count}</b></a>
  </header></div>;
}
export function AccountFooter(){const brand=useBranding();return <footer className="member-footer"><span>© 2026 FACTORBOXES · ทุกกล่อง สร้างโอกาสได้เสมอ</span><a href={telephone(brand.phone)}><Phone size={15}/> {brand.phone}</a>{brand.lineUrl?<a href={brand.lineUrl} target="_blank" rel="noreferrer">LINE: {brand.lineId}</a>:<span>LINE: {brand.lineId}</span>}</footer>}
export function MemberHeading({title,description,detail=false}:{title:string;description:string;detail?:boolean}) {
  return <><div className="member-breadcrumb"><a href="/store">หน้าหลัก</a><ChevronRight size={13}/><a href="/account">บัญชีของฉัน</a>{detail&&<><ChevronRight size={13}/><a href="/account/orders">ประวัติคำสั่งซื้อ</a></>}<ChevronRight size={13}/><span>{title}</span></div><div className="member-page-title"><h1>{title}</h1><p>{description}</p></div></>;
}
