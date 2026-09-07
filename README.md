> ล่าสุด: หน้าติดตามพัสดุใหม่ อ่าน [UPDATE-TRACKING-TH.md](UPDATE-TRACKING-TH.md)

อัปเดตหน้าชำระเงินล่าสุด: [รายละเอียดและวิธีอัปโหลด](UPDATE-PAYMENT-TH.md)

> ล่าสุด: หน้าสินค้าใหม่ อ่าน UPDATE-STOREFRONT-TH.md

> ล่าสุด: ปรับหน้าเข้าสู่ระบบให้เล็กลง ใช้โลโก้ใหม่พร้อมแสงรอบโลโก้ อ่าน UPDATE-LOGIN-SIZE-TH.md

> ล่าสุด: หน้าแรกเปลี่ยนเป็นหน้าเข้าสู่ระบบพื้นส้มแล้ว อ่าน UPDATE-HOME-TH.md ส่วนหน้าสินค้าอยู่ /store

> อัปเดตหน้าตา 6 หน้า: อ่าน [UPDATE-DESIGN-TH.md](UPDATE-DESIGN-TH.md) ก่อนอัปโหลด

อัปเดตล่าสุด: ข้อความส่งฟรีและเรทถัดไปในตะกร้า — อ่าน [UPDATE-TIER-PROMPT-TH.md](UPDATE-TIER-PROMPT-TH.md)

อัปเดตล่าสุด: แยกยืนยันออเดอร์ → ชำระเงิน — อ่าน [UPDATE-CHECKOUT-TH.md](UPDATE-CHECKOUT-TH.md)

อัปเดตล่าสุด: ระบบบัญชี / วางบิล — อ่าน [UPDATE-ACCOUNTING-TH.md](UPDATE-ACCOUNTING-TH.md) และรัน supabase/06-accounting.sql

อัปเดตล่าสุด: สถิติคนเข้าเว็บ — อ่าน [UPDATE-ANALYTICS-TH.md](UPDATE-ANALYTICS-TH.md) และรัน supabase/05-analytics.sql ก่อนใช้งาน

อัปเดตล่าสุด: ระบบเลือกบริษัทขนส่งและเพิ่มรายชื่อเอง — อ่าน [UPDATE-CARRIERS-TH.md](UPDATE-CARRIERS-TH.md)

# อัปเดตเว็บที่ใช้อยู่: อ่าน FIX-FIRST-TH.md ก่อน

# FACTORBOXES — GitHub + Vercel + Supabase

ชุดเว็บล่าสุด พร้อมหมวดสินค้า สิทธิ์แอดมิน และสรุปรายได้แยก VAT
เริ่มที่ **START-HERE-TH.md** (คู่มือติดตั้งภาษาไทย)

- Next.js App Router บน Vercel
- Supabase PostgreSQL, private Storage และ Auth แบบอีเมล/รหัสผ่าน
- สินค้าตั้งต้น 40 รายการ และราคา 5 เรทจากใบราคาวันที่ 06/09/2569
- หน้าเว็บ `/` สมาชิก `/account` หลังบ้าน `/admin`
- สมัคร/ล็อกอิน/ลืมรหัสผ่าน `/login`

```bash
npm ci
npm run typecheck
npm test
npm run build
```

คัดลอก `.env.example` เป็น `.env.local` และใส่ค่าของคุณก่อนรัน `npm run dev`.
อย่าอัปโหลด `.env.local`, database password หรือ service role key ลง GitHub.

ชุดนี้เป็น source code และสินค้าตั้งต้น ไม่ใช่สำเนาฐานข้อมูลสดของ Sites
ไม่มีออเดอร์ สมาชิก รูปที่อัปโหลด คูปอง หรือการตั้งค่าที่แก้ผ่านหลังบ้านเดิม
ต้องตั้งค่าและทดสอบกับ Supabase/Vercel ของคุณก่อนใช้งานจริง

## โครงสร้าง

| โฟลเดอร์ | หน้าที่ |
|---|---|
| app | หน้าร้าน หลังบ้าน สมาชิก และ API |
| lib | ราคา ภาษี สิทธิ์ PostgreSQL และ Supabase |
| public | โลโก้และภาพเริ่มต้น |
| supabase | SQL สร้างตาราง สินค้า และพื้นที่รูปภาพ |
| tests | ทดสอบ SQL กับ PostgreSQL แบบฝังตัว |

## รายละเอียดการย้ายระบบ

การตรวจสิทธิ์ใช้ `Supabase Auth getUser()` ไม่เชื่อถือ header จากผู้เรียก
ตารางเปิด RLS และปิดสิทธิ์ anon/authenticated; API ฝั่งเซิร์ฟเวอร์ตรวจสิทธิ์ก่อนเข้าถึงผ่าน DATABASE_URL
Storage เป็น private ใช้ service role เฉพาะฝั่งเซิร์ฟเวอร์
คำสั่งอัปเดตสินค้าหลายรายการทำใน PostgreSQL transaction
Auth เก็บเซสชันใน cookie และ proxy ต่ออายุเซสชัน
ชื่อไฟล์ `app/chatgpt-auth.ts` คงไว้เพื่อเข้ากันได้กับหน้าจอเดิม แต่ภายในใช้ Supabase เท่านั้น

ขนาดรูป/สลิปสูงสุด 4 MiB ต่อไฟล์ เพื่อรองรับขีดจำกัด request ของ Vercel Functions
ระบบขนส่งและการยืนยันสลิปยังจัดการด้วยแอดมิน ไม่มีการเชื่อมผู้ขนส่งหรือธนาคารอัตโนมัติ
ล็อกอิน Facebook/Google/Apple ยังไม่ได้ตั้งค่าในชุดนี้ ใช้อีเมลและรหัสผ่านได้หลังเชื่อม Supabase
VAT รายงานเป็น VAT ขายที่บันทึกต่อออเดอร์ ไม่ใช่ภาษีสุทธิหลังหักภาษีซื้อ

## เอกสารอ้างอิง

- [Supabase SSR Auth](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase PostgreSQL connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Vercel Functions limits](https://vercel.com/docs/functions/limitations)
