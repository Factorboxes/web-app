BEGIN;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.settings WHERE id='single-price-20261105') THEN
 INSERT INTO public.products(id,name,size,price,active,sku,category) VALUES ('SX','กล่อง SX ไม่สกรีน','8.2 × 12.5 × 4.5',58,1,'001','กล่อง'),('OO','กล่อง 00 (ไม่พิมพ์)','9.75 × 14 × 6',77,1,'002','กล่อง'),('OO-P','กล่อง 00','9.75 × 14 × 6',81,1,'003','กล่อง'),('OOO','กล่อง 000','9 × 15 × 11',132,1,'004','กล่อง'),('O','กล่อง 0','11 × 17 × 6',98,1,'005','กล่อง'),('O4','กล่อง 0+4','11 × 17 × 10',118,1,'006','กล่อง'),('AA','กล่อง AA','13 × 17 × 7',123,1,'007','กล่อง'),('A','กล่อง A','14 × 20 × 6',138,1,'008','กล่อง'),('A-PLUS','กล่อง A+ ไม่สกรีน','10.5 × 23 × 6',143,1,'009','กล่อง'),('AB','กล่อง AB','14 × 20 × 9',161,1,'010','กล่อง'),('2A','กล่อง 2A','14 × 20 × 12',177,1,'011','กล่อง'),('2A2','กล่อง 2A+2 ไม่สกรีน','14 × 20 × 14',216,1,'012','กล่อง'),('B','กล่อง B','17 × 25 × 9',217,1,'013','กล่อง'),('CD','กล่อง CD','15 × 15 × 15',192,1,'014','กล่อง'),('2B','กล่อง 2B','17 × 25 × 18',297,1,'015','กล่อง'),('C','กล่อง C','20 × 30 × 11',312,1,'016','กล่อง'),('C8','กล่อง C+8','20 × 30 × 19',399,1,'017','กล่อง'),('2C','กล่อง 2C','20 × 30 × 20',418,1,'018','กล่อง'),('D','กล่อง D','22 × 35 × 14',413,1,'019','กล่อง'),('D7','กล่อง D-7','22 × 35 × 9',356,1,'020','กล่อง'),('D11','กล่อง D+11','22 × 35 × 25',563,1,'021','กล่อง'),('2D','กล่อง 2D','22 × 35 × 28',592,1,'022','กล่อง'),('E','กล่อง E','24 × 40 × 17',527,1,'023','กล่อง'),('F','กล่อง F','31 × 36 × 13',609,1,'024','กล่อง'),('F-LARGE','กล่อง F ใหญ่','32 × 48 × 30',1035,1,'025','กล่อง'),('G','กล่อง G','31 × 35 × 26',789,1,'026','กล่อง'),('P','กล่อง p','31 × 36 × 20',673,1,'027','กล่อง'),('CHOR','กล่อง ฉ','30 × 45 × 22',802,1,'028','กล่อง'),('CHOR8','กล่อง ฉ+8','30 × 45 × 30',932,1,'029','กล่อง'),('7','กล่อง 7','35 × 50 × 32',1193,1,'030','กล่อง'),('H','กล่อง H','41 × 45 × 35',1379,1,'031','กล่อง'),('L-LONG','กล่อง L ยาว','20 × 56 × 15',550,1,'032','กล่อง'),('I-PLUS5','กล่อง I+ 5ชั้น','50 × 60 × 50',5887,1,'033','กล่อง'),('I5','กล่อง I 5ชั้น','45 × 55 × 40',3141,1,'034','กล่อง'),('C5','กล่อง C+5','25 × 30 × 11',413,1,'036','กล่อง'),('S-KERRY','กล่อง S+ kerry','24 × 37 × 14',487,1,'037','กล่อง'),('M-KERRY','กล่อง M kerry','27 × 43 × 20',677,1,'038','กล่อง'),('M-PLUS-KERRY','กล่อง M+ kerry','35 × 45 × 25',994,1,'039','กล่อง'),('L-KERRY','กล่อง L kerry','40 × 50 × 30',1299,1,'040','กล่อง'),('FRUIT-C9','กล่อง C+9 ผลไม้ 5 ชั้น','20 × 30 × 20',835,1,'FRUIT-C9','กล่อง'),('FRUIT-D11','กล่อง D+11 ผลไม้ 5 ชั้น','22 × 35 × 25',1100,1,'FRUIT-D11','กล่อง'),('FRUIT-S','กล่อง S+ ผลไม้ 5 ชั้น','24 × 37 × 14',970,1,'FRUIT-S','กล่อง'),('FRUIT-M','กล่อง M ผลไม้ 5 ชั้น','27 × 43 × 20',1380,1,'FRUIT-M','กล่อง')
 ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,size=EXCLUDED.size,price=EXCLUDED.price,active=EXCLUDED.active;
 UPDATE public.products SET active=0 WHERE id='I3';
 INSERT INTO public.settings(id,value) VALUES ('packing-20261105','{"SX": {"capacity": 1000, "weightKg": 25}, "OO": {"capacity": 800, "weightKg": 25}, "OO-P": {"capacity": null, "weightKg": 25}, "OOO": {"capacity": 600, "weightKg": 25}, "O": {"capacity": 600, "weightKg": 25}, "O4": {"capacity": 500, "weightKg": 25}, "AA": {"capacity": 600, "weightKg": 25}, "A": {"capacity": 400, "weightKg": 25}, "A-PLUS": {"capacity": 500, "weightKg": 25}, "AB": {"capacity": 360, "weightKg": 25}, "2A": {"capacity": 360, "weightKg": 25}, "2A2": {"capacity": 280, "weightKg": 25}, "B": {"capacity": 280, "weightKg": 25}, "CD": {"capacity": 280, "weightKg": 25}, "2B": {"capacity": 180, "weightKg": 25}, "C": {"capacity": 180, "weightKg": 25}, "C8": {"capacity": 100, "weightKg": 25}, "2C": {"capacity": 120, "weightKg": 25}, "D": {"capacity": 120, "weightKg": 25}, "D7": {"capacity": 160, "weightKg": 25}, "D11": {"capacity": 100, "weightKg": 25}, "2D": {"capacity": 80, "weightKg": 25}, "E": {"capacity": 100, "weightKg": 25}, "F": {"capacity": 80, "weightKg": 25}, "F-LARGE": {"capacity": 40, "weightKg": 25}, "G": {"capacity": 70, "weightKg": 25}, "P": {"capacity": 80, "weightKg": 25}, "CHOR": {"capacity": 70, "weightKg": 25}, "CHOR8": {"capacity": 60, "weightKg": 25}, "7": {"capacity": 30, "weightKg": 25}, "H": {"capacity": 20, "weightKg": 25}, "L-LONG": {"capacity": 100, "weightKg": 25}, "I-PLUS5": {"capacity": 10, "weightKg": 25}, "I5": {"capacity": 10, "weightKg": 25}, "C5": {"capacity": 120, "weightKg": 25}, "S-KERRY": {"capacity": 100, "weightKg": 25}, "M-KERRY": {"capacity": 80, "weightKg": 25}, "M-PLUS-KERRY": {"capacity": 50, "weightKg": 25}, "L-KERRY": {"capacity": 20, "weightKg": 25}, "FRUIT-C9": {"capacity": 50, "weightKg": 25}, "FRUIT-D11": {"capacity": 60, "weightKg": 25}, "FRUIT-S": {"capacity": 50, "weightKg": 25}, "FRUIT-M": {"capacity": 50, "weightKg": 25}}') ON CONFLICT(id) DO NOTHING;
 INSERT INTO public.settings(id,value) VALUES ('shop','{"shippingPerParcel":150,"freeShipping":0}') ON CONFLICT(id) DO UPDATE SET value=((public.settings.value::jsonb)||'{"shippingPerParcel":150,"freeShipping":0}'::jsonb)::text;
 INSERT INTO public.settings(id,value) VALUES ('single-price-20261105','{"version":1}') ON CONFLICT(id) DO NOTHING;
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.factorboxes_reserve_coupon()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c public.coupons%ROWTYPE; personal bigint; amount bigint; discount bigint; expected bigint; slot integer; selected text; required_scope text;
BEGIN
 IF COALESCE(NEW.coupon_code,'')='' AND NEW.special_code='' THEN
  IF NEW.coupon_discount<>0 OR NEW.special_discount<>0 THEN RAISE EXCEPTION 'ยอดส่วนลดไม่ถูกต้อง';END IF;
  RETURN NEW;
 END IF;
 IF NEW.coupon_code=NEW.special_code THEN RAISE EXCEPTION 'ใช้รหัสเดียวกันซ้ำสองช่องไม่ได้';END IF;
 -- Stable lock order prevents deadlocks when codes are used concurrently.
 PERFORM code FROM public.coupons WHERE code IN (NEW.coupon_code,NEW.special_code) ORDER BY code FOR UPDATE;
 amount:=NEW.subtotal+NEW.coupon_discount-CASE WHEN (NEW.items::jsonb->0->>'priceBasis')='exclusive-vat-20261105' THEN NEW.vat ELSE 0 END;
 FOR slot IN 1..2 LOOP
  selected:=CASE WHEN slot=1 THEN COALESCE(NEW.coupon_code,'') ELSE NEW.special_code END;
  required_scope:=CASE WHEN slot=1 THEN 'regular' ELSE 'special' END;
  expected:=CASE WHEN slot=1 THEN NEW.coupon_discount-NEW.special_discount ELSE NEW.special_discount END;
  IF selected='' THEN
   IF expected<>0 THEN RAISE EXCEPTION 'ยอดส่วนลดไม่ถูกต้อง';END IF;
   CONTINUE;
  END IF;
  SELECT * INTO c FROM public.coupons WHERE code=selected;
  IF NOT FOUND OR c.active<>1 OR c.scope<>required_scope THEN RAISE EXCEPTION 'CODE ไม่พร้อมใช้งานหรือใช้ผิดช่อง';END IF;
  IF c.starts_at IS NOT NULL AND c.starts_at::timestamptz>clock_timestamp() THEN RAISE EXCEPTION 'CODE ยังไม่เริ่มใช้งาน';END IF;
  IF c.ends_at IS NOT NULL AND c.ends_at::timestamptz<clock_timestamp() THEN RAISE EXCEPTION 'CODE หมดอายุแล้ว';END IF;
  IF c.max_uses IS NOT NULL AND c.used_total>=c.max_uses THEN RAISE EXCEPTION 'CODE นี้สิทธิ์เต็มแล้ว';END IF;
  IF c.per_member IS NOT NULL THEN
   IF NEW.member_id IS NULL THEN RAISE EXCEPTION 'กรุณาเข้าสู่ระบบเพื่อใช้ CODE นี้';END IF;
   SELECT count(*) INTO personal FROM public.coupon_redemptions WHERE code=c.code AND member_id=NEW.member_id;
   IF personal>=c.per_member THEN RAISE EXCEPTION 'คุณใช้ CODE นี้ครบจำนวนครั้งแล้ว';END IF;
  END IF;
  IF amount<c.minimum THEN RAISE EXCEPTION 'ยอดสินค้าไม่ถึงขั้นต่ำของ CODE';END IF;
  discount:=LEAST(amount,CASE WHEN c.kind='fixed' THEN c.value ELSE round(amount::numeric*c.value/10000)::bigint END);
  IF expected<>discount THEN RAISE EXCEPTION 'เงื่อนไข CODE เปลี่ยนแล้ว กรุณาใช้ CODE ใหม่ในตะกร้า';END IF;
  IF EXISTS(SELECT 1 FROM public.coupon_redemptions WHERE order_id=NEW.id AND code=c.code) THEN RAISE EXCEPTION 'เลขคำสั่งซื้อนี้เคยใช้ CODE แล้ว กรุณาสร้างคำสั่งซื้อใหม่';END IF;
  INSERT INTO public.coupon_redemptions VALUES(NEW.id,c.code,NEW.member_id,NEW.created);
  UPDATE public.coupons SET used_total=used_total+1 WHERE code=c.code;
  amount:=amount-discount;
 END LOOP;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.factorboxes_reserve_coupon() FROM PUBLIC;

COMMIT;
SELECT 'ติดตั้งราคาใหม่แล้ว ตั้งค่าขนส่งต่อห่อก่อนเปิดขาย และกรอกจำนวนต่อห่อของกล่อง 00 พิมพ์' AS result;
