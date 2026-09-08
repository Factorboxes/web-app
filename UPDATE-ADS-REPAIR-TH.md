# อัปเดตแก้การตรวจ Google Ads — ADS-CHECK-02

รหัสจากไฟล์แนบตรงกับชุดเดิม: AW-16714852853/IW8gCOKL-vAcEPXToaI-
ชุดนี้เพิ่มหน้าตรวจแท็ก /ads-check รอให้สคริปต์ Google โหลดสำเร็จก่อนส่ง Purchase และลองใหม่ขณะหน้าเปิดอยู่เมื่อโหลดช้าหรือออนไลน์กลับมา พร้อมคงรหัสคลิกโฆษณาผ่านการเปลี่ยนหน้าล็อกอินโดยอัตโนมัติ

วิธีอัปโหลด
1. แตก factorboxes-ads-repair.zip
2. อัปโหลดโฟลเดอร์ app, lib และไฟล์ proxy.ts ไปที่ราก Repository เดิม (ตำแหน่งเดียวกับ package.json) รวมเข้าโฟลเดอร์เดิม อย่าให้เป็น app/app หรือ lib/lib
3. Commit changes รอ Vercel ขึ้น Ready ไม่ต้องรัน SQL เพิ่มสำหรับชุดนี้
4. เปิด https://www.factorboxes.com/ads-check ต้องเห็น ADS-CHECK-02 และโหลดสคริปต์ Googleสำเร็จ หาก404หรือไม่เห็นเวอร์ชันใหม่ ให้ตรวจ deployment ก่อน
5. ถ้าโหลดไม่สำเร็จ ตรวจส่วนขยายบล็อกโฆษณา/การบล็อกของเบราว์เซอร์และเครือข่าย แล้วรีเฟรช
6. ไป Google Ads → เป้าหมาย → Conversion → Purchase - Factorboxes → แก้ปัญหา / Troubleshoot เพื่อเปิด Tag Assistant
7. ในเว็บที่ Tag Assistant เชื่อมต่อ เปิดออเดอร์ที่ชำระเงินจริงแล้วในหน้าชำระเงิน ติดตามพัสดุ หรือรายละเอียดออเดอร์ ตรวจ conversion, value, currency และ transaction_id

ไฟล์ที่ต้องอัป: app/layout.tsx, app/google-ads.tsx, app/ads-check/page.tsx, app/use-purchase-conversion.ts, app/payment/payment.tsx, app/track/tracker.tsx, app/account/orders/details.tsx, lib/google-purchase.ts, proxy.ts
มีการตั้งค่าเดิมของเว็บใน layout/proxy หากคุณแก้เองเพิ่มเติม ให้รวมโค้ด ไม่ทับการเปลี่ยนแปลงของคุณ

เงื่อนไขที่ยังใช้
- ยืนยันออเดอร์หรือแนบสลิปอย่างเดียว ยังไม่ส่ง Purchase ต้องชำระแล้วและไม่ยกเลิก
- ลูกค้าต้องเปิดหรือรีเฟรชข้อมูลหลังร้านยืนยันรับเงิน การกดจากหลังบ้านอย่างเดียวไม่ส่ง หากต้องการไม่รอลูกค้ากลับมา ต้องทำ server-side/import conversions เพิ่ม
- ค่า value ใช้ยอดออเดอร์จริงรวมค่าจัดส่งและ VAT หลังส่วนลด แปลงสตางค์เป็นบาท
- เครื่องหมาย callback และโหลดสคริปต์สำเร็จ ไม่ใช่หลักฐานยืนยันว่าบัญชี Google Ads รับ Conversion สำเร็จ
- ออเดอร์ที่เคยส่งในเบราว์เซอร์นี้แล้วไม่เรียกซ้ำ; Google ใช้ transaction_id เดิมช่วยป้องกันซ้ำข้ามหน้า/อุปกรณ์
- หน้าตรวจไม่ส่งยอดซื้อจำลอง และไม่แสดงข้อมูลลูกค้า
- Google ระบุว่าหลังแก้แท็ก หน้าสถานะ/การวินิจฉัยอาจใช้ 24–48 ชั่วโมงอัปเดต ต้องตรวจเหตุการณ์จริงใน Tag Assistant ด้วย

ยังยืนยันสาเหตุบนเว็บจริงไม่ได้ และไม่ได้อัปโหลดหรือแก้บัญชี Google Ads ให้โดยตรง
ทดสอบด้วยข้อมูลจำลองในเครื่อง ไม่ส่งยอดทดสอบไป Google
https://support.google.com/google-ads/answer/9148089?hl=en
https://support.google.com/google-ads/answer/10989978?hl=en
