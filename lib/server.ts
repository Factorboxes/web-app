import packingSource from './packing-source.json';
const normalizePackingName=(name:string)=>name.replace(/[\s()]/g,'').toUpperCase();
function packingByName(name:string){const row=packingSource.find(r=>normalizePackingName(r['ชื่อสินค้า'])===normalizePackingName(name));return row?{capacity:Number(row['จำนวนต่อห่อ']),weightKg:Number(row['น้ำหนักต่อห่อ(kg)'])}:undefined;}
import {database} from './database';
import {identity} from './member';
import {permissionKeys,parsePermissions,type Permission,type AdminAccess} from './admin-permissions';
import {initialProducts,defaultSettings} from './catalog';
export function db(){return database;}
export async function adminAccess():Promise<AdminAccess>{const user=await identity();if(!user)return {owner:false,permissions:[]};const email=process.env.ADMIN_EMAIL;if(email&&user.email.toLowerCase()===email.toLowerCase())return {owner:true,permissions:[...permissionKeys]};const row=await db().prepare('SELECT permissions FROM admin_users WHERE member_id=? AND active=1').bind(user.id).first<{permissions:string}>();return {owner:false,permissions:row?parsePermissions(row.permissions):[]};}
export async function isAdmin(permission?:Permission){const a=await adminAccess();return a.owner||(permission?a.permissions.includes(permission):a.permissions.length>0);}
export async function catalog(){
 const result=await db().prepare('SELECT * FROM products ORDER BY sku NULLS LAST,id').all();
 const marker=await db().prepare('SELECT value FROM settings WHERE id=?').bind('single-price-20261105').first();
 const pack=await db().prepare('SELECT value FROM settings WHERE id=?').bind('packing-20261105').first<{value:string}>();
 const packing:Record<string,{capacity:number|null;weightKg:number}>=pack?JSON.parse(pack.value):{};
 const products=(result.results as unknown as typeof initialProducts).map(p=>{
  const matched=packing[p.id]??packingByName(p.name);
  return {...p,tiers:[p.price,p.price,p.price,p.price,p.price],parcelCapacity:matched?.capacity??null,parcelWeightKg:matched?.weightKg??25};
 });
 const s=await db().prepare('SELECT value FROM settings WHERE id=?').bind('shop').first<{value:string}>();
 const settings={...defaultSettings,...(s?JSON.parse(s.value):{}),pricingReady:!!marker,freeShipping:0};
 const images=(await db().prepare('SELECT id,product_id,slot FROM product_images ORDER BY slot').all()).results as {id:string,product_id:string,slot:number}[];
 return {products:products.map((p,i)=>({...p,category:p.category||'กล่อง',sku:p.sku||initialProducts.find(d=>d.id===p.id)?.sku||String(i+1).padStart(3,'0'),images:images.filter(i=>i.product_id===p.id).map(i=>({id:i.id,slot:i.slot,url:'/api/product-images?id='+i.id}))})),settings};
}
