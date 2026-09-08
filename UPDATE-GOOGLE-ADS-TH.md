# ติดตั้งแท็ก Google Ads

แท็กหลัก: AW-16714852853

วิธีอัปเดตเฉพาะแท็ก (แนะนำถ้าเว็บบน GitHub มีการแก้ไขเพิ่มเติม)
1. แตกไฟล์ factorboxes-google-ads-tag.zip
2. เปิด Repository ของเว็บใน GitHub แล้วเข้าโฟลเดอร์ app
3. อัปโหลด layout.tsx จากโฟลเดอร์ app ของไฟล์ที่แตกไว้ ไปแทน app/layout.tsx เดิม (อย่าสร้าง app/app)
4. Commit changes และรอ Vercel แสดง Ready สำหรับ deployment ใหม่นี้
5. เปิดเว็บจริงแล้วกลับ Google Ads กดทดสอบการติดตั้ง หรือใช้ Google Tag Assistant

ไฟล์ layout.tsx นี้อ้างอิงชุดเว็บล่าสุดที่จัดให้ มี PwaProvider และ BrandingProvider เดิม หาก GitHub ของคุณมีการแก้ layout.tsx เพิ่มเอง ให้รวมเฉพาะ import Script และ Script สองตัวเข้ากับไฟล์เดิมแทนการทับทั้งไฟล์

อีกทางเลือก: ใช้ web-app-main.zip ซึ่งรวมแท็กนี้และระบบเว็บไซต์ชุดก่อนหน้าครบ ไม่ต้องรัน SQL หรือตั้ง Environment Variable เพิ่มสำหรับแท็กนี้

ติดตั้งโดยใช้ next/script ให้โหลดครั้งเดียวต่อเอกสาร ไม่ต้องนำโค้ดแท็กเดียวกันไปวางซ้ำในหน้าอื่น

ยังไม่ได้ตั้งเหตุการณ์ Conversion การซื้อ เพราะต้องใช้ Conversion label ที่ Google Ads สร้างให้ (send_to รูปแบบ AW-16714852853/รหัสเพิ่มเติม) แท็กหลักอย่างเดียวไม่ได้ยืนยันว่าลูกค้าจ่ายเงินสำเร็จ ไม่มีการส่งยอดซื้อสมมติ

ไฟล์นี้ยังไม่ได้อัปโหลดขึ้นเว็บไซต์จริง และยังไม่ได้ยืนยันผลการตรวจจากบัญชี Google Ads ของคุณ

เอกสารอ้างอิง:
https://nextjs.org/docs/app/guides/scripts
https://support.google.com/google-ads/answer/7548399?hl=en
