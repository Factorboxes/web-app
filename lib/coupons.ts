import {db} from './server';
import {couponState,type ManagedCoupon} from './coupon-rules';
export async function validCoupon(code:string,amount:number,memberId?:string|null):Promise<ManagedCoupon>{
 const c=await db().prepare('SELECT * FROM coupons WHERE code=?').bind(code.trim().toUpperCase()).first<ManagedCoupon>();
 if(!c)throw Error('ไม่พบ CODE');
 const state=couponState(c);if(state!=='ใช้งานได้')throw Error('CODE นี้'+state);
 if(c.per_member!=null){if(!memberId)throw Error('กรุณาเข้าสู่ระบบเพื่อใช้ CODE นี้');const r=await db().prepare('SELECT COUNT(*) AS used FROM coupon_redemptions WHERE code=? AND member_id=?').bind(c.code,memberId).first<{used:number}>();if(Number(r?.used||0)>=c.per_member)throw Error('คุณใช้ CODE นี้ครบจำนวนครั้งแล้ว');}
 if(amount<c.minimum)throw Error('CODE นี้ต้องมียอดสินค้าตามเรทอย่างน้อย '+(c.minimum/100).toLocaleString('th-TH')+' บาท');return c;
}
