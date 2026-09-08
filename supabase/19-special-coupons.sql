-- Run 18-coupon-quotas.sql first. Existing codes remain regular.
BEGIN;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'regular' CHECK(scope IN ('regular','special'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS special_code text NOT NULL DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS special_discount bigint NOT NULL DEFAULT 0 CHECK(special_discount>=0);
ALTER TABLE public.coupon_redemptions DROP CONSTRAINT IF EXISTS coupon_redemptions_pkey;
ALTER TABLE public.coupon_redemptions ADD PRIMARY KEY(order_id,code);
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
 amount:=NEW.subtotal+NEW.coupon_discount;
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
