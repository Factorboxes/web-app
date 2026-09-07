export const permissionKeys=['orders','products','coupons','branding','settings','members','sales'] as const;
export type Permission=typeof permissionKeys[number];
export const permissionLabels:Record<Permission,string>={orders:'จัดการออเดอร์ สลิป การจัดส่ง และเอกสาร',products:'แก้ไขสินค้า ราคา หมวด และรูปภาพ',coupons:'จัดการ CODE ส่วนลด',branding:'แก้ไขแบนเนอร์ LINE และเบอร์โทร',settings:'แก้ไขข้อมูลร้าน ภาษี และค่าจัดส่ง',members:'ดูข้อมูลสมาชิกและที่อยู่',sales:'ดูสรุปยอดขายและสถิติคนเข้าเว็บ'};
export type AdminAccess={owner:boolean,permissions:Permission[]};
export function parsePermissions(value:string):Permission[]{try{const p=JSON.parse(value);return Array.isArray(p)?permissionKeys.filter(k=>p.includes(k)):[]}catch{return []}}
