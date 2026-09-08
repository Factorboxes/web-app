BEGIN;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS starts_at text;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_uses bigint CHECK(max_uses>0);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS per_member bigint CHECK(per_member>0);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_total bigint NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS public.coupon_redemptions(order_id text PRIMARY KEY,code text NOT NULL,member_id text,created text NOT NULL);
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coupon_redemptions FROM anon,authenticated;
CREATE INDEX IF NOT EXISTS coupon_member_usage ON public.coupon_redemptions(code,member_id);
-- Retain usage even if an order is cancelled/deleted: no foreign-key cascade.
LOCK TABLE public.orders IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.coupons IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO public.coupon_redemptions(order_id,code,member_id,created)
SELECT o.id,o.coupon_code,o.member_id,o.created FROM public.orders o JOIN public.coupons c ON c.code=o.coupon_code
ON CONFLICT(order_id) DO NOTHING;
UPDATE public.coupons c SET used_total=(SELECT count(*) FROM public.coupon_redemptions r WHERE r.code=c.code);
CREATE OR REPLACE FUNCTION public.factorboxes_reserve_coupon()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c public.coupons%ROWTYPE; personal bigint; amount bigint; discount bigint;
BEGIN
 IF COALESCE(NEW.coupon_code,'')='' THEN RETURN NEW;END IF;
 SELECT * INTO c FROM public.coupons WHERE code=NEW.coupon_code FOR UPDATE;
 IF NOT FOUND OR c.active<>1 THEN RAISE EXCEPTION 'CODE ไม่พร้อมใช้งาน กรุณาเลือกใหม่';END IF;
 IF c.starts_at IS NOT NULL AND c.starts_at::timestamptz>clock_timestamp() THEN RAISE EXCEPTION 'CODE ยังไม่เริ่มใช้งาน';END IF;
 IF c.ends_at IS NOT NULL AND c.ends_at::timestamptz<clock_timestamp() THEN RAISE EXCEPTION 'CODE หมดอายุแล้ว';END IF;
 IF c.max_uses IS NOT NULL AND c.used_total>=c.max_uses THEN RAISE EXCEPTION 'CODE นี้สิทธิ์เต็มแล้ว';END IF;
 IF c.per_member IS NOT NULL THEN
  IF NEW.member_id IS NULL THEN RAISE EXCEPTION 'กรุณาเข้าสู่ระบบเพื่อใช้ CODE นี้';END IF;
  SELECT count(*) INTO personal FROM public.coupon_redemptions WHERE code=c.code AND member_id=NEW.member_id;
  IF personal>=c.per_member THEN RAISE EXCEPTION 'คุณใช้ CODE นี้ครบจำนวนครั้งแล้ว';END IF;
 END IF;
 amount:=NEW.subtotal+NEW.coupon_discount;
 IF amount<c.minimum THEN RAISE EXCEPTION 'ยอดสินค้าไม่ถึงขั้นต่ำของ CODE';END IF;
 discount:=LEAST(amount,CASE WHEN c.kind='fixed' THEN c.value ELSE round(amount::numeric*c.value/10000)::bigint END);
 IF NEW.coupon_discount<>discount THEN RAISE EXCEPTION 'เงื่อนไข CODE เปลี่ยนแล้ว กรุณาใช้ CODE ใหม่ในตะกร้า';END IF;
 IF EXISTS(SELECT 1 FROM public.coupon_redemptions WHERE order_id=NEW.id) THEN RAISE EXCEPTION 'เลขคำสั่งซื้อนี้เคยใช้ CODE แล้ว กรุณาสร้างคำสั่งซื้อใหม่';END IF;
 INSERT INTO public.coupon_redemptions VALUES(NEW.id,c.code,NEW.member_id,NEW.created);
 UPDATE public.coupons SET used_total=used_total+1 WHERE code=c.code;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.factorboxes_reserve_coupon() FROM PUBLIC;
DROP TRIGGER IF EXISTS factorboxes_coupon_quota ON public.orders;
CREATE TRIGGER factorboxes_coupon_quota AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.factorboxes_reserve_coupon();
COMMIT;
