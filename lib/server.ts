import {database} from './database';
import {identity} from './member';
import {permissionKeys,parsePermissions,type Permission,type AdminAccess} from './admin-permissions';
import {initialProducts,defaultSettings} from './catalog';
export function db(){return database;}
export async function adminAccess():Promise<AdminAccess>{const user=await identity();if(!user)return {owner:false,permissions:[]};const email=process.env.ADMIN_EMAIL;if(email&&user.email.toLowerCase()===email.toLowerCase())return {owner:true,permissions:[...permissionKeys]};const row=await db().prepare('SELECT permissions FROM admin_users WHERE member_id=? AND active=1').bind(user.id).first<{permissions:string}>();return {owner:false,permissions:row?parsePermissions(row.permissions):[]};}
export async function isAdmin(permission?:Permission){const a=await adminAccess();return a.owner||(permission?a.permissions.includes(permission):a.permissions.length>0);}
export async function catalog(){
 const result=await db().prepare('SELECT * FROM products ORDER BY sku NULLS LAST,id').all();
 const saved=await db().prepare('SELECT value FROM settings WHERE id=?').bind('price-tiers-20260906').first<{value:string}>();
 const tiers:Record<string,number[]>=saved?JSON.parse(saved.value):{};
 const rows=result.results as unknown as typeof initialProducts;
 const products=saved?rows.map(p=>({...p,tiers:tiers[p.id]??[p.price,p.price,p.price,p.price,p.price]})):[...initialProducts,...rows.filter(p=>!initialProducts.some(i=>i.id===p.id)).map(p=>({...p,tiers:[p.price,p.price,p.price,p.price,p.price]}))];
 const s=await db().prepare('SELECT value FROM settings WHERE id=?').bind('shop').first<{value:string}>();
 const images=(await db().prepare('SELECT id,product_id,slot FROM product_images ORDER BY slot').all()).results as {id:string,product_id:string,slot:number}[];
 return {products:products.map((p,i)=>({...p,category:p.category||'กล่อง',sku:p.sku||initialProducts.find(d=>d.id===p.id)?.sku||String(i+1).padStart(3,'0'),images:images.filter(i=>i.product_id===p.id).map(i=>({id:i.id,slot:i.slot,url:'/api/product-images?id='+i.id}))})),settings:s?{...defaultSettings,...JSON.parse(s.value)}:defaultSettings};
}
