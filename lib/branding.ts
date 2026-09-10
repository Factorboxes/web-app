export const defaultBranding={announcement:'กล่องพร้อมส่ง จากโรงงานถึงมือคุณ',phone:'062-610-6289',lineId:'Factorboxes',lineUrl:'',
 facebookUrl:'',headline:'แพ็กทุกออเดอร์\nพร้อมส่งทุกความสำเร็จ',description:'เลือกกล่องคละขนาดได้ในตะกร้าเดียว\nยิ่งสั่งมาก ยิ่งได้ราคาตามเรทที่คุ้มกว่า',eyebrow:'กล่องไปรษณีย์ · สั่งตรงจากโรงงาน',promoTitle:'ส่งฟรีทั่วไทย',promoNote:'40 ขนาดให้เลือก · รวมยอดคละขนาดได้',buttonText:'เลือกซื้อกล่อง',buttonUrl:'/#catalog',bannerMode:'designed' as 'designed'|'image',bannerImage:'',bannerAlt:'โปรโมชั่น FACTORBOXES'};
export type Branding=typeof defaultBranding;
export function telephone(phone:string){return 'tel:'+phone.replace(/[^0-9+]/g,'')}
