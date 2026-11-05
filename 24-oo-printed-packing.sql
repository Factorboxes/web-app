BEGIN;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.settings WHERE id='single-price-20261105') THEN
  RAISE EXCEPTION 'กรุณารัน SQL23 ชุดราคาใหม่ก่อน';
 END IF;
END $$;
INSERT INTO public.settings(id,value)
VALUES('packing-20261105','{"OO-P":{"capacity":800,"weightKg":25}}')
ON CONFLICT(id) DO UPDATE SET value=jsonb_set(public.settings.value::jsonb,'{OO-P}','{"capacity":800,"weightKg":25}'::jsonb,true)::text;
COMMIT;
SELECT 'ตั้งกล่อง 00 พิมพ์ 800 ใบต่อห่อแล้ว กรุณารีเฟรชหน้าร้านและตะกร้า' AS result;
