-- Run before uploading this update. Existing orders receive numbers oldest first.
BEGIN;
LOCK TABLE public.orders IN ACCESS EXCLUSIVE MODE;
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq AS BIGINT MINVALUE 0 START WITH 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_no BIGINT;
SELECT setval('public.order_number_seq',GREATEST(COALESCE((SELECT MAX(order_no)+1 FROM public.orders),0),(SELECT CASE WHEN is_called THEN last_value+1 ELSE last_value END FROM public.order_number_seq)),false);
DO $$ DECLARE item RECORD; BEGIN
 FOR item IN SELECT id FROM public.orders WHERE order_no IS NULL ORDER BY created,id LOOP
  UPDATE public.orders SET order_no=nextval('public.order_number_seq') WHERE id=item.id;
 END LOOP;
END $$;
ALTER TABLE public.orders ALTER COLUMN order_no SET DEFAULT nextval('public.order_number_seq');
ALTER TABLE public.orders ALTER COLUMN order_no SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_no ON public.orders(order_no);
REVOKE ALL ON SEQUENCE public.order_number_seq FROM anon,authenticated;
COMMIT;
