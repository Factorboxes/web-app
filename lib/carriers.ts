import {z} from 'zod';
export const defaultCarriers=['ไปรษณีย์ไทย','Flash Express','J&T Express','KEX Express','BEST Express','SPX Express'];
export const carrierListSchema=z.array(z.string().trim().min(1).max(80)).max(100).refine(names=>new Set(names.map(n=>n.toLocaleLowerCase())).size===names.length,{message:'ชื่อบริษัทขนส่งต้องไม่ซ้ำกัน'});
