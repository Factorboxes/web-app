# เพิ่มตะกร้าลอยมุมขวาล่าง

สำหรับชุด FACTORBOXES บน Vercel / Supabase
ยังไม่ได้อัปเดตในบัญชี GitHub/Vercel ของคุณ

1. แตก ZIP
2. อัปโหลด app/floating-cart.tsx และ app/floating-cart.module.css ไปโฟลเดอร์ app
3. แทนที่ app/shop.tsx ด้วยไฟล์ในชุดนี้ และใส่ lib/order-number.ts ในโฟลเดอร์ lib
4. Commit changes แล้วรอ Vercel Deploy สำเร็จ
5. รีเฟรชเว็บ จะพบปุ่มตะกร้ามุมขวาล่าง

ไม่ต้องรัน SQL ไม่ต้องเปลี่ยน Environment Variables
หาก shop.tsx เคยแก้เพิ่มเติมนอกชุดที่ส่งในบทสนทนานี้ ให้คงการแก้นั้นไว้แล้วเพิ่มเพียง:

import FloatingCart from './floating-cart';

และวาง component ก่อน <Sheet open={open} ...>:

<FloatingCart items={items.length} total={t.total} open={open} onOpen={()=>setOpen(true)}/>

การทำงาน:
- ปุ่มติดมุมขวาล่างขณะเลื่อนหน้า ทั้งมือถือและคอมพิวเตอร์
- ไอคอนตะกร้า ตัวเลขจำนวนรายการ และยอดรวมตรงกับตะกร้าจริง
- จำนวนรายการนับชนิดสินค้า เช่น SX 100 ใบ = 1 รายการ
- ยอดรวมใช้เรท/คูปอง/ค่าส่งเดียวกับหน้าตะกร้า
- กดปุ่มเปิดตะกร้าเดิมทันที เมื่อเปิดตะกร้าแล้วปุ่มลอยจะซ่อน
- เว้นระยะด้านล่างสำหรับพื้นที่ปัดหน้าจอมือถือ
- ไม่แสดงปุ่มในหน้าพิมพ์

ผ่าน Next.js production build และ TypeScript แล้ว
ยังไม่ได้ Deploy ไปเว็บจริงของคุณ
