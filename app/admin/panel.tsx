'use client';
import {useCallback,useEffect,useState} from 'react';
import {BarChart3,Bell,CalendarDays,ChevronDown,CreditCard,ExternalLink,FileText,House,ImageIcon,LogOut,Menu,Package,RefreshCw,Search,Settings,ShoppingCart,Tag,Truck,UserRoundCog,Users,X} from 'lucide-react';
import {type AdminAccess,type Permission} from '@/lib/admin-permissions';
import {type AdminOrder,type OrderFilter,type OrderSection} from '@/lib/admin-orders';
import {defaultSettings} from '@/lib/catalog';
import {api} from '../shared';
import Overview,{type Dashboard} from './overview';
import Orders from './orders';
import OrderDetail from './order-detail';
import ProductsEditor from './products';
import SettingsEditor from './settings';
import Sales from './sales';
import Analytics from './analytics';
import Accounting from './accounting';
import Staff from './staff';
import BrandingEditor from './branding';
import Coupons from './coupons';
import Members from './members';
import './admin.css';

export default function Admin({access}:{access:AdminAccess}){
 const can=(p:Permission)=>access.owner||access.permissions.includes(p);
 const [tab,setTab]=useState(can('orders')||can('sales')?'overview':access.permissions[0]||'staff');
 const [query,setQuery]=useState(''),[filter,setFilter]=useState<OrderFilter>('all'),[orderDate,setOrderDate]=useState('');
 const [date,setDate]=useState(()=>new Date(Date.now()+7*3600000).toISOString().slice(0,10));
 const [menuOpen,setMenuOpen]=useState(false),[revision,setRevision]=useState(0);
 const [dashboard,setDashboard]=useState<Dashboard|null>(null),[dashboardLoading,setDashboardLoading]=useState(true),[dashboardError,setDashboardError]=useState('');
 const [carriers,setCarriers]=useState<string[]>([]),[products,setProducts]=useState<any[]>([]),[settings,setSettings]=useState(defaultSettings);
 const [selected,setSelected]=useState<AdminOrder|null>(null),[orderSection,setOrderSection]=useState<OrderSection>('details');
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{try{const r=await fetch('/api/shop?admin=1&includeOrders=0',{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);setProducts(d.products);setSettings({...defaultSettings,...d.settings});setCarriers(d.carriers||[])}catch(e){setMessage((e as Error).message)}finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]);
 useEffect(()=>{const c=new AbortController();setDashboardLoading(true);setDashboardError('');fetch('/api/admin-dashboard?'+new URLSearchParams({date}),{signal:c.signal,cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setDashboard(d)}).catch(e=>{if(e.name!=='AbortError'){setDashboard(null);setDashboardError(e.message)}}).finally(()=>{if(!c.signal.aborted)setDashboardLoading(false)});return()=>c.abort()},[date,revision]);
 useEffect(()=>{if(!menuOpen)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setMenuOpen(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[menuOpen]);
 async function save(body:unknown){setBusy(true);setMessage('');try{await api(body);await load();setMessage('บันทึกเรียบร้อยแล้ว');setRevision(r=>r+1);return true}catch(e){setMessage((e as Error).message);return false}finally{setBusy(false)}}
 function openOrders(next:OrderFilter,nextDate=''){setFilter(next);setQuery('');setOrderDate(nextDate);setTab(next==='pending'?'payments':next==='shipping'?'shipping':'orders');setMenuOpen(false)}
 function navigate(next:string){if(next==='orders')openOrders('all');else if(next==='payments')openOrders('pending');else if(next==='shipping')openOrders('shipping');else{setTab(next);setMenuOpen(false)}}
 function search(value:string){setQuery(value);setFilter('all');setOrderDate('');setTab('orders')}
 function openOrder(order:AdminOrder,section:OrderSection='details'){setSelected(order);setOrderSection(section)}
 async function fetchOrder(id:string){const r=await fetch('/api/admin-orders?'+new URLSearchParams({id}),{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);if(!d.orders[0])throw Error('ไม่พบออเดอร์นี้แล้ว');return d.orders[0] as AdminOrder}
 async function saveOrder(order:AdminOrder){await api({action:'update',...order});const fresh=await fetchOrder(order.id);setSelected(p=>p?.id===fresh.id?fresh:p);setRevision(r=>r+1);return fresh}
 async function reloadSelected(){setRevision(r=>r+1);if(selected)try{const fresh=await fetchOrder(selected.id);setSelected(p=>p?.id===fresh.id?fresh:p)}catch(e){setMessage((e as Error).message)}}
 const nav=[
  {id:'overview',label:'สรุปภาพรวม',icon:House,show:can('orders')||can('sales')},
  {id:'orders',label:'คำสั่งซื้อ',icon:ShoppingCart,show:can('orders')},
  {id:'payments',label:'ชำระเงิน / ตรวจสลิป',icon:CreditCard,show:can('orders')},
  {id:'shipping',label:'จัดส่ง / ใบปะหน้า',icon:Truck,show:can('orders')},
  {id:'members',label:'สมาชิก',icon:Users,show:can('members')},
  {id:'products',label:'สินค้าและราคา',icon:Package,show:can('products')},
  {id:'coupons',label:'โปรโมชั่น / CODE',icon:Tag,show:can('coupons')},
  {id:'accounting',label:'บัญชี / วางบิล',icon:FileText,show:can('accounting')},
  {id:'sales',label:'ยอดขาย / VAT',icon:BarChart3,show:can('sales')},
  {id:'analytics',label:'สถิติคนเข้าเว็บ',icon:BarChart3,show:can('sales')},
  {id:'staff',label:'แอดมินและสิทธิ์',icon:UserRoundCog,show:access.owner},
  {id:'branding',label:'แบนเนอร์ / ติดต่อร้าน',icon:ImageIcon,show:can('branding')},
  {id:'settings',label:'ตั้งค่าร้านค้า',icon:Settings,show:can('settings')},
 ];
 const descriptions:Record<string,string>={overview:'จัดการคำสั่งซื้อ สินค้า ลูกค้า และการจัดส่ง ในที่เดียว',orders:'ค้นหา ตรวจสถานะ และเปิดจัดการแต่ละออเดอร์ได้ทันที',payments:'ตรวจหลักฐาน ยืนยันรับเงิน และติดตามออเดอร์ที่รอชำระ',shipping:'ระบุขนส่ง เลขพัสดุ และพิมพ์ใบปะหน้าจากออเดอร์',products:'แก้ไขรหัสสินค้า ราคาแต่ละเรท และรูปสินค้าได้สูงสุด 5 รูป',branding:'เปลี่ยนโปรโมชั่น รูปแบนเนอร์ LINE และเบอร์โทรของร้าน',settings:'ข้อมูลบริษัท บัญชีรับโอน ภาษี และรายชื่อขนส่ง'};
 const orderTab=['orders','payments','shipping'].includes(tab);
 return <div className="admin-experience"><header className="admin-header"><button className="admin-menu-toggle" aria-label="เปิดเมนูจัดการร้าน" aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)}><Menu size={23}/></button><a className="admin-brand" href="/admin"><img src="/factorboxes-logo.jpeg" alt="โลโก้ FACTORBOXES"/><span><b>FACTOR</b><em>BOXES</em><small>PACK YOUR NEXT POSSIBILITY</small></span></a>{can('orders')&&<label className="admin-header-search"><Search size={18}/><input aria-label="ค้นหาออเดอร์" placeholder="ค้นหาเลขออเดอร์ ชื่อลูกค้า สินค้า …" value={query} onChange={e=>search(e.target.value)}/>{query&&<button aria-label="ล้างคำค้น" onClick={()=>search('')}><X size={15}/></button>}</label>}<div className="admin-profile-area">{can('orders')&&<button className="admin-notification" aria-label={'สลิปรอตรวจสอบ '+(dashboard?.slips?.total??0)+' รายการ'} onClick={()=>openOrders('pending')}><Bell size={22}/>{!!dashboard?.slips?.total&&<i/>}</button>}<details className="admin-profile"><summary><span className="admin-avatar">A</span><span>Admin<small>{access.owner?'เจ้าของร้าน':'ผู้ดูแลร้าน'}</small></span><ChevronDown size={15}/></summary><div><span>{access.owner?'สิทธิ์ครบทุกส่วน':'แสดงเฉพาะส่วนที่มีสิทธิ์'}</span><a href="/auth/signout?next=%2Fadmin"><LogOut size={16}/>ออกจากระบบ</a></div></details></div></header>
  {menuOpen&&<button className="admin-nav-shade" aria-label="ปิดเมนูจัดการร้าน" onClick={()=>setMenuOpen(false)}/>}
  <aside className={'admin-sidebar '+(menuOpen?'is-open':'')}><nav aria-label="เมนูจัดการร้าน">{nav.filter(n=>n.show).map(({id,label,icon:Icon})=><button type="button" key={id} aria-current={tab===id?'page':undefined} onClick={()=>navigate(id)}><Icon size={21}/><span>{label}</span>{id==='payments'&&!!dashboard?.slips?.total&&<small>{dashboard.slips.total}</small>}</button>)}</nav><div className="admin-sidebar-story"><img src="/boxes.png" alt="กล่องกระดาษ FACTORBOXES"/><strong>ทุกกล่อง<br/>สร้างโอกาสได้เสมอ</strong><small>PACK YOUR<br/>NEXT POSSIBILITY</small><i/></div><a className="admin-sidebar-store" href="/store" target="_blank" rel="noreferrer"><ExternalLink size={17}/>เปิดหน้าร้าน</a></aside>
  <main className="admin-workspace"><div className="admin-page-heading"><div><span>STORE MANAGEMENT</span><h1>{tab==='overview'?'จัดการร้านค้า':nav.find(n=>n.id===tab)?.label}</h1><p>{descriptions[tab]||'จัดการข้อมูลร้านอย่างเป็นระเบียบ'}</p></div><div className="admin-heading-actions">{tab==='overview'&&<label className="admin-report-date"><CalendarDays size={18}/><span>สรุปวันที่</span><input type="date" aria-label="วันที่สรุปภาพรวม" required value={date} onChange={e=>{if(e.target.value)setDate(e.target.value)}}/></label>}<button className="admin-icon-button" aria-label="รีเฟรชข้อมูลหลังบ้าน" disabled={dashboardLoading||busy} onClick={()=>{setRevision(r=>r+1);void load()}}><RefreshCw size={18}/></button></div></div>
   {message&&<div role="status" className="admin-feedback admin-main-feedback"><span>{message}</span><button aria-label="ปิดข้อความหลังบ้าน" onClick={()=>setMessage('')}><X size={17}/></button></div>}
   {tab==='overview'&&(can('orders')||can('sales'))&&<Overview data={dashboard} loading={dashboardLoading} error={dashboardError} access={access} date={date} revision={revision} onTab={navigate} onOrders={openOrders} onOpen={openOrder}/>}
   {orderTab&&can('orders')&&<Orders query={query} filter={filter} date={orderDate} revision={revision} onFilter={setFilter} onDate={setOrderDate} onQuery={setQuery} onOpen={openOrder}/>}
   <div className="admin-module">{tab==='sales'&&can('sales')&&<Sales/>}{tab==='analytics'&&can('sales')&&<Analytics/>}{tab==='accounting'&&can('accounting')&&<Accounting/>}{tab==='staff'&&access.owner&&<Staff/>}{tab==='members'&&can('members')&&<Members/>}{tab==='products'&&can('products')&&<ProductsEditor products={products} setProducts={setProducts} busy={busy} loading={loading} save={save}/>}{tab==='coupons'&&can('coupons')&&<Coupons/>}{tab==='branding'&&can('branding')&&<BrandingEditor/>}{tab==='settings'&&can('settings')&&<SettingsEditor settings={settings} setSettings={setSettings} carriers={carriers} busy={busy} loading={loading} save={save}/>}</div>
   <div className="admin-footer"><span>© 2026 FACTORBOXES · ระบบจัดการร้านค้า</span><span>Pack Your Next Possibility</span></div>
  </main>
  {can('orders')&&<OrderDetail order={selected} section={orderSection} carriers={carriers} onClose={()=>setSelected(null)} onSave={saveOrder} onReload={reloadSelected}/>}
 </div>
}
