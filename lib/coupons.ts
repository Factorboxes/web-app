import {db} from './server';
import type {Coupon} from './catalog';
export async function validCoupon(code:string,amount:number):Promise<Coupon>{const c=await db().prepare('SELECT * FROM coupons WHERE code=?').bind(code.trim().toUpperCase()).first<Coupon>();if(!c||!c.active)throw Error('ไม่พบ CODE หรือ CODE นี้ถูกปิดใช้งาน');if(c.ends_at&&new Date(c.ends_at).getTime()<Date.now())throw Error('CODE นี้หมดอายุแล้ว');if(amount<c.minimum)throw Error('CODE นี้ต้องมียอดสินค้าตามเรทอย่างน้อย '+(c.minimum/100).toLocaleString('th-TH')+' บาท');return c;}
