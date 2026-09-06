# เริ่มติดตั้ง FACTORBOXES

ใช้ชุดไฟล์นี้ชุดเดียวกับ GitHub, Vercel และ Supabase ได้เลย
การติดตั้งครั้งแรกแนะนำใช้คอมพิวเตอร์ เพราะต้องอัปโหลดหลายโฟลเดอร์
บน iPhone ให้เปิดแอปไฟล์ (Files) > Downloads > แตะ ZIP เพื่อแตกไฟล์

## 1. สร้าง Supabase และตาราง

1. เข้า https://supabase.com/dashboard แล้วสร้าง New project ตั้งรหัสผ่านฐานข้อมูลและเก็บไว้
2. เลือกภูมิภาคใกล้ลูกค้า เช่น Singapore แล้วรอสร้างเสร็จ
3. เปิด SQL Editor > New query
4. เปิดไฟล์ `supabase/01-schema.sql` คัดลอกทั้งหมดลงช่อง SQL แล้วกด Run
5. ทำเช่นเดียวกันกับ `supabase/02-products.sql` และ `supabase/03-storage.sql` ตามลำดับ
6. ตรวจ Table Editor ว่ามี products 40 รายการ และ Storage มี bucket ชื่อ factorboxes แบบ private

ใช้ SQL กับโปรเจกต์ใหม่ ไม่ควรรวมกับตารางชื่อเดียวกันของระบบอื่น

## 2. เตรียมค่าที่ต้องใส่ใน Vercel

| ชื่อตัวแปร (ต้องตรงทุกตัว) | ใส่อะไร |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Project URL จาก Supabase |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Publishable key หรือ legacy anon key |
| SUPABASE_SERVICE_ROLE_KEY | service_role key ฝั่งเซิร์ฟเวอร์ จาก Settings > API Keys > legacy keys |
| DATABASE_URL | Connect > Transaction pooler > URI ใส่รหัสผ่านฐานข้อมูลจริง ใช้พอร์ต 6543 |
| ADMIN_EMAIL | อีเมลของเจ้าของร้านที่จะสมัครบัญชีแอดมิน |

DATABASE_URL ให้คัดลอก host จริงจาก Supabase อย่าใช้ YOUR_PROJECT หรือ YOUR_POOLER_HOST ตามตัวอย่าง
หากรหัสผ่านมี @ # / ? : ต้องแปลงเป็น URL encoding ก่อนใส่ใน URI
ใช้ TLS โดยเพิ่ม `?sslmode=verify-full` ท้าย URI (หรือ `&sslmode=verify-full` ถ้ามีพารามิเตอร์อื่นแล้ว)
Database password คือรหัสที่ตั้งตอนสร้าง Supabase ไม่ใช่รหัสผ่านสมาชิก
ห้ามใส่ service_role key หรือ DATABASE_URL ในตัวแปรที่ขึ้นต้น NEXT_PUBLIC_

## 3. อัปโหลด GitHub

1. แตก ZIP ก่อน — ไม่อัปโหลด ZIP ทั้งก้อนเป็นโค้ด
2. เข้า https://github.com/new ตั้งชื่อ `factorboxes-shop` แนะนำเลือก Private แล้ว Create repository
3. เลือก uploading an existing file หรือ Add file > Upload files
4. เปิดโฟลเดอร์ที่แตกไฟล์แล้ว อัปโหลดไฟล์และโฟลเดอร์ด้านใน ให้ `package.json` อยู่หน้าแรกของ repository
5. ถ้าอัปโหลดครั้งเดียวไม่ได้ ให้แบ่งเป็นรอบ: ไฟล์หลักก่อน แล้ว app, lib, components, hooks, public, vendor, supabase, tests ทีละโฟลเดอร์ และ Commit changes ทุกครั้ง
6. `.env.example` เป็นเพียงตัวอย่าง อัปโหลดได้ แต่ห้ามอัปโหลด `.env.local` ที่มีรหัสจริง
7. ไม่ต้องอัปโหลด node_modules หรือ .next หากคุณเคยรันบนเครื่อง

ถ้าหน้า GitHub บนมือถือไม่ยอมอัปโหลดโฟลเดอร์ ให้ทำขั้นตอนนี้บนคอมพิวเตอร์ จะรักษาโครงสร้างโฟลเดอร์ได้ง่ายกว่า
ไฟล์หลักที่ต้องมี: package.json, package-lock.json, tsconfig.json, next.config.ts, next-env.d.ts, postcss.config.mjs, proxy.ts

## 4. เชื่อม Vercel

1. เข้า https://vercel.com/new แล้วเชื่อมบัญชี GitHub
2. Import repository factorboxes-shop
3. Framework Preset เลือก Next.js
4. Root Directory ต้องเป็นโฟลเดอร์ที่มี package.json ถ้าวางตามคู่มือให้ใช้ค่าเริ่มต้น
5. Build Command ใช้ `npm run build`, Install Command ใช้ `npm ci`, Output Directory ใช้ค่าเริ่มต้น
6. เพิ่ม Environment Variables ทั้ง 5 ตัวจากข้อ 2 ให้ครบ เลือก Production และ Preview ตามที่ต้องการใช้
7. กด Deploy แล้วรอจนสำเร็จ จากนั้นเก็บ URL ของเว็บ เช่น https://factorboxes-shop.vercel.app
8. ถ้าเปลี่ยนค่าตัวแปรภายหลัง ให้ Redeploy เพื่อให้ค่าถูกใช้ในเว็บรุ่นใหม่

## 5. เปิดระบบสมัครสมาชิกและยืนยันอีเมล

1. Supabase > Authentication > Providers เปิด Email และเปิด Confirm email
2. Authentication > URL Configuration ตั้ง Site URL เป็น URL เว็บ Vercel ของคุณ
3. เพิ่ม Redirect URLs เป็น `https://ชื่อเว็บของคุณ/auth/callback` และ `https://ชื่อเว็บของคุณ/auth/callback?next=/login%3Fmode%3Dpassword`
4. ตั้ง Custom SMTP สำหรับส่งอีเมลยืนยันและกู้รหัสผ่านให้ลูกค้าจริง บริการส่งเมลเริ่มต้นของ Supabase มีข้อจำกัดสำหรับทดลอง
5. สำหรับการยืนยันข้ามเครื่อง/เบราว์เซอร์ แก้ลิงก์ใน template Confirm signup เป็น:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">ยืนยันอีเมล</a>
```

6. แก้ลิงก์ใน template Reset password เป็น:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">ตั้งรหัสผ่านใหม่</a>
```

## 6. เข้าแอดมินครั้งแรก

1. เปิดเว็บ `/login` > สมัครสมาชิก ด้วยอีเมลเดียวกับ ADMIN_EMAIL และตั้งรหัสผ่านของคุณเอง
2. เปิดอีเมลยืนยัน แล้วล็อกอิน
3. เปิด `/account` กรอกชื่อ เบอร์โทร และที่อยู่จัดส่ง
4. เปิด `/admin` จะได้สิทธิ์เจ้าของร้านโดยอัตโนมัติ
5. ตั้งชื่อบริษัท เลขผู้เสียภาษี ที่อยู่ บัญชีรับเงิน LINE เบอร์โทร และแบนเนอร์ให้ถูกต้อง
6. เพิ่มแอดมินคนอื่น: ให้เขาสมัคร ยืนยันอีเมล และบันทึกหน้าสมาชิกก่อน จากนั้นเจ้าของเลือกในเมนูแอดมินและสิทธิ์

ไม่มีรหัสผ่านแอดมินเริ่มต้นที่ใช้ร่วมกัน เจ้าของตั้งรหัสผ่านตอนสมัคร

## 7. ทดสอบก่อนเปิดรับออเดอร์

- สมัคร ยืนยันอีเมล ล็อกอิน ออกจากระบบ และกู้รหัสผ่าน
- เลือกสินค้าหลายหมวด ตรวจราคาแต่ละเรท และ CODE
- สั่งซื้อ แนบสลิปไม่เกิน 4 MiB ตรวจสลิปในหลังบ้าน และพิมพ์เอกสาร
- เปลี่ยนรูปสินค้า แบนเนอร์ และตรวจการแสดงผลหน้าร้าน
- ตรวจสรุปยอดขายและ VAT ของออเดอร์ชำระแล้ว
- ทดลองบัญชีผู้ดูแลสิทธิ์จำกัดว่าเข้าเฉพาะส่วนที่ได้รับสิทธิ์

## ข้อมูลที่ต้องย้ายต่างหาก

ZIP มีโค้ด รูปเริ่มต้น โลโก้ และสินค้า 40 รายการจากใบราคาเท่านั้น
ข้อมูลสดใน Sites ไม่ถูกดึงมา: ออเดอร์ สมาชิก คูปอง รูปที่อัปโหลด และการตั้งค่าภายหลัง
บัญชีสมาชิกเดิมเป็นคนละระบบกับ Supabase ต้องสมัครใหม่หรือวางแผนย้ายบัญชีแยก
เว็บเดิมยังอยู่ตามปกติ ชุดนี้ไม่ได้เปลี่ยนหรือปิดเว็บเดิม

## ถ้าพบปัญหา

- Build หา package.json ไม่เจอ: ตรวจ Root Directory และโครงสร้าง GitHub
- โหลดสินค้าหรือบันทึกไม่ได้: ตรวจ DATABASE_URL รหัสผ่าน และรัน SQL ทั้งสามไฟล์
- เข้าแอดมินไม่ได้: ตรวจ ADMIN_EMAIL ให้ตรงบัญชีที่ยืนยันอีเมลแล้ว จากนั้น Redeploy
- ไม่ได้อีเมล: ตรวจ Spam, SMTP และ Supabase Auth logs
- อัปโหลดรูปไม่ได้: ตรวจ service_role key, bucket factorboxes และขนาดไม่เกิน 4 MiB

โค้ดผ่านการตรวจชนิดข้อมูล build และทดสอบ PostgreSQL ในเครื่องแล้ว
ยังไม่ได้ทดสอบกับบัญชี Supabase/Vercel ของคุณ เพราะยังไม่ได้เชื่อมบัญชีหรือใส่ค่าจริง
