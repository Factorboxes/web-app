# FACTORBOXES Redesign Pack
ชุดไฟล์นี้ทำมาเพื่อวางทับโปรเจกต์ GitHub `Factorboxes/web-app` ตัวเดิม โดยคง API, Supabase, Orders, Slip, Tracking และระบบหลังบ้านเดิมไว้ แล้วปรับหน้าตาเป็นดีไซน์ใหม่

## หน้าในชุดนี้
- `/` -> พาไปหน้าเข้าสู่ระบบ
- `/login` -> หน้าโลโก้สีส้ม / Login / ลงทะเบียน / ลืมรหัสผ่าน
- `/shop` -> หน้าสินค้าและตะกร้า ใช้ Shop เดิม แต่เปลี่ยนดีไซน์ด้วย CSS ใหม่
- Checkout drawer -> ยืนยันออเดอร์ ใช้ logic เดิม
- `/payment` -> หน้าเลขบัญชีเด่น + แนบสลิป
- `/track` -> หน้าติดตาม รับออเดอร์ > กำลังแพ็ก > จัดส่งแล้ว > ส่งสำเร็จ
- `/admin` -> ระบบเดิม แต่ CSS ใหม่ช่วยจัด spacing, card, table, status ให้สะอาดขึ้น

## วิธีอัป GitHub แบบง่าย
1. แตก ZIP
2. เข้า repository `Factorboxes/web-app`
3. อัปโหลดโฟลเดอร์ `app` และ `public` จากชุดนี้ โดยให้ไฟล์ชื่อเดียวกันทับไฟล์เดิม
4. GitHub ถาม Replace/Overwrite ให้ใช้ไฟล์ใหม่
5. Commit changes ไปที่ `main`
6. Vercel จะ Deploy อัตโนมัติ

## สำคัญ
- ห้ามลบ `.env` หรือ Environment Variables ใน Vercel
- ชุดนี้ไม่แก้ SQL และไม่ลบตาราง Supabase
- ระบบ Orders / Members / Slips / Accounting เดิมยังใช้ต่อ
- ถ้า Header เดิมมีลิงก์หน้าร้านเป็น `/` ให้เปลี่ยนเป็น `/shop` ภายหลังเพื่อไม่ย้อนกลับหน้า Login

## Environment Variables ที่เว็บเดิมควรมี
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
ADMIN_EMAIL
CRON_SECRET

ไม่ต้องใส่ค่า Secret ลง GitHub
