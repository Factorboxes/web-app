-- FACTORBOXES notifications v1. Additive migration; no historical pushes.
BEGIN;
CREATE TABLE IF NOT EXISTS public.fb_notification_preferences (
 member_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 orders boolean NOT NULL DEFAULT true, marketing boolean NOT NULL DEFAULT false,
 cart_reminders boolean NOT NULL DEFAULT false, reorder_reminders boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fb_push_subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), member_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 endpoint text NOT NULL UNIQUE, p256dh text NOT NULL, auth text NOT NULL,
 active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fb_notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), member_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('received','paid','packing','shipped','coupon','promotion','cart','reorder','test')),
 title text NOT NULL, body text NOT NULL, url text NOT NULL,
 event_key text NOT NULL, source_id text NOT NULL DEFAULT '', marketing boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days', read_at timestamptz,
 UNIQUE(member_id,event_key)
);
CREATE TABLE IF NOT EXISTS public.fb_push_deliveries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), notification_id uuid NOT NULL REFERENCES public.fb_notifications(id) ON DELETE CASCADE,
 subscription_id uuid NOT NULL REFERENCES public.fb_push_subscriptions(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','accepted','skipped','failed')),
 attempts int NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(), locked_until timestamptz, lease uuid,
 accepted_at timestamptz, error_code text,
 UNIQUE(notification_id,subscription_id)
);
CREATE TABLE IF NOT EXISTS public.fb_notification_carts (
 member_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 revision uuid NOT NULL DEFAULT gen_random_uuid(), checkout_key uuid NOT NULL, items jsonb NOT NULL DEFAULT '[]', fingerprint text NOT NULL,
 item_count int NOT NULL DEFAULT 0, activity_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fb_notification_campaigns (
 id uuid PRIMARY KEY, created_by uuid NOT NULL REFERENCES auth.users(id), kind text NOT NULL,
 title text NOT NULL, body text NOT NULL, url text NOT NULL, coupon_code text,
 created_at timestamptz NOT NULL DEFAULT now(), recipients int NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.fb_notification_marketing_days (
 member_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, day date NOT NULL,
 notification_id uuid NOT NULL REFERENCES public.fb_notifications(id) ON DELETE CASCADE, PRIMARY KEY(member_id,day)
);
ALTER TABLE public.fb_notification_marketing_days ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fb_notification_marketing_days FROM anon,authenticated;
CREATE TABLE IF NOT EXISTS public.fb_notification_settings (
 id int PRIMARY KEY CHECK(id=1), cart_enabled boolean NOT NULL DEFAULT false,
 reorder_enabled boolean NOT NULL DEFAULT false, cart_hours int NOT NULL DEFAULT 3 CHECK(cart_hours BETWEEN 1 AND 168),
 reorder_days int NOT NULL DEFAULT 30 CHECK(reorder_days BETWEEN 7 AND 365), last_job_at timestamptz
);
INSERT INTO public.fb_notification_settings(id) VALUES(1) ON CONFLICT DO NOTHING;
CREATE INDEX IF NOT EXISTS fb_notification_inbox ON public.fb_notifications(member_id,created_at DESC);
CREATE INDEX IF NOT EXISTS fb_push_due ON public.fb_push_deliveries(status,available_at);
CREATE INDEX IF NOT EXISTS fb_push_member ON public.fb_push_subscriptions(member_id) WHERE active;
CREATE INDEX IF NOT EXISTS fb_notification_cart_due ON public.fb_notification_carts(activity_at) WHERE item_count>0;
ALTER TABLE public.fb_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_push_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_notification_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_notification_settings ENABLE ROW LEVEL SECURITY;
-- Access exclusively through the authenticated server APIs; never through the public browser key.
REVOKE ALL ON public.fb_notification_preferences,public.fb_push_subscriptions,public.fb_notifications,public.fb_push_deliveries,public.fb_notification_carts,public.fb_notification_campaigns,public.fb_notification_settings FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.fb_add_notification(
 who uuid, category text, heading text, message text, target text, dedupe text,
 source text DEFAULT '', is_marketing boolean DEFAULT false, expiry timestamptz DEFAULT now()+interval '7 days'
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE nid uuid;
BEGIN
 IF is_marketing AND NOT EXISTS(SELECT 1 FROM public.fb_notification_preferences WHERE member_id=who AND marketing) THEN RETURN NULL; END IF;
 INSERT INTO public.fb_notifications(member_id,kind,title,body,url,event_key,source_id,marketing,expires_at)
 VALUES(who,category,heading,message,target,dedupe,source,is_marketing,expiry)
 ON CONFLICT(member_id,event_key) DO NOTHING RETURNING id INTO nid;
 IF nid IS NULL THEN RETURN NULL; END IF;
 INSERT INTO public.fb_push_deliveries(notification_id,subscription_id)
 SELECT nid,s.id FROM public.fb_push_subscriptions s LEFT JOIN public.fb_notification_preferences p ON p.member_id=s.member_id
 WHERE s.member_id=who AND s.active AND (CASE WHEN is_marketing THEN COALESCE(p.marketing,false) ELSE COALESCE(p.orders,true) END);
 RETURN nid;
END $$;
REVOKE ALL ON FUNCTION public.fb_add_notification(uuid,text,text,text,text,text,text,boolean,timestamptz) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.fb_order_notifications()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE who uuid; label text; target text;
BEGIN
 SELECT id INTO who FROM auth.users WHERE id::text=NEW.member_id;
 IF who IS NULL THEN RETURN NEW; END IF;
 label:=CASE WHEN NEW.order_no IS NOT NULL THEN lpad(NEW.order_no::text,greatest(4,length(NEW.order_no::text)),'0') ELSE 'FB-'||upper(left(NEW.id,8)) END;
 target:='/account/orders/'||NEW.id;
 IF TG_OP='INSERT' THEN
  PERFORM public.fb_add_notification(who,'received','✅ รับคำสั่งซื้อแล้ว','ออเดอร์ '||label||' ร้านได้รับคำสั่งซื้อของคุณแล้ว',target,'received:'||NEW.id,NEW.id);
  DELETE FROM public.fb_notification_carts WHERE member_id=who;
 END IF;
 IF NEW.status='ยกเลิก' THEN RETURN NEW; END IF;
 IF NEW.payment='ชำระแล้ว' AND (TG_OP='INSERT' OR OLD.payment IS DISTINCT FROM NEW.payment) THEN
  PERFORM public.fb_add_notification(who,'paid','💰 ยืนยันการชำระเงินแล้ว','ออเดอร์ '||label||' ร้านตรวจสอบยอดชำระเรียบร้อยแล้ว',target,'paid:'||NEW.id,NEW.id);
 END IF;
 IF NEW.status IN ('กำลังแพ็ก','กำลังแพ็ค','กำลังแพ็คสินค้า') AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
  PERFORM public.fb_add_notification(who,'packing','📦 กำลังแพ็คสินค้า','ออเดอร์ '||label||' กำลังเตรียมสินค้าเพื่อจัดส่ง',target,'packing:'||NEW.id,NEW.id);
 END IF;
 IF NEW.status IN ('จัดส่งแล้ว','ส่งสำเร็จ') AND NULLIF(trim(NEW.tracking),'') IS NOT NULL
 AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status OR OLD.tracking IS DISTINCT FROM NEW.tracking OR OLD.carrier IS DISTINCT FROM NEW.carrier) THEN
  PERFORM public.fb_add_notification(who,'shipped','🚚 จัดส่งแล้ว','ออเดอร์ '||label||' · '||NEW.carrier||' · Tracking: '||NEW.tracking,target,'shipped:'||NEW.id||':'||md5(NEW.carrier||'|'||NEW.tracking),NEW.id);
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.fb_order_notifications() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS fb_order_notification_events ON public.orders;
CREATE TRIGGER fb_order_notification_events AFTER INSERT OR UPDATE OF status,payment,tracking,carrier ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fb_order_notifications();
COMMIT;
SELECT 'ระบบแจ้งเตือนพร้อมตั้งค่า ไม่ส่งย้อนหลังอัตโนมัติ' AS result;
