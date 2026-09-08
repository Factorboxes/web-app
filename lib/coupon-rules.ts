import type {Coupon} from './catalog';
export type ManagedCoupon=Coupon&{starts_at?:string|null;max_uses?:number|null;per_member?:number|null;used_total?:number};
export function couponState(c:ManagedCoupon,now=Date.now()){
 if(!c.active)return 'ปิดใช้งาน';
 if(c.ends_at&&Date.parse(c.ends_at)<now)return 'หมดอายุ';
 if(c.starts_at&&Date.parse(c.starts_at)>now)return 'ยังไม่เริ่ม';
 if(c.max_uses!=null&&(c.used_total||0)>=c.max_uses)return 'สิทธิ์เต็ม';
 return 'ใช้งานได้';
}
