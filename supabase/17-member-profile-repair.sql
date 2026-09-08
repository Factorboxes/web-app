-- Run once in Supabase SQL Editor. Safe to run again.
-- Fill only empty profile fields from orders linked by member_id.
BEGIN;
CREATE OR REPLACE FUNCTION public.factorboxes_fill_member_from_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE contact_email text; zip text; street text;
BEGIN
 IF NEW.member_id IS NULL THEN RETURN NEW; END IF;
 SELECT email INTO contact_email FROM auth.users WHERE id::text=NEW.member_id;
 IF contact_email IS NULL THEN RETURN NEW; END IF;
 zip:=COALESCE(substring(trim(NEW.address) from '([0-9]{5})$'),'');
 street:=CASE WHEN zip<>'' THEN trim(regexp_replace(trim(NEW.address),'[0-9]{5}$','')) ELSE trim(NEW.address) END;
 INSERT INTO public.members(id,email,name,phone,address,postcode,updated)
 VALUES(NEW.member_id,contact_email,NEW.customer,NEW.phone,street,zip,NEW.created)
 ON CONFLICT(id) DO UPDATE SET
 email=CASE WHEN trim(members.email)='' THEN EXCLUDED.email ELSE members.email END,
 name=CASE WHEN trim(members.name)='' THEN EXCLUDED.name ELSE members.name END,
 phone=CASE WHEN trim(members.phone)='' THEN EXCLUDED.phone ELSE members.phone END,
 address=CASE WHEN trim(members.address)='' THEN EXCLUDED.address ELSE members.address END,
 postcode=CASE WHEN trim(members.address)='' AND trim(members.postcode)='' THEN EXCLUDED.postcode ELSE members.postcode END,
 updated=EXCLUDED.updated
 WHERE trim(members.name)='' OR trim(members.phone)='' OR trim(members.address)='' OR trim(members.email)='';
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.factorboxes_fill_member_from_order() FROM PUBLIC;
DROP TRIGGER IF EXISTS factorboxes_order_member_profile ON public.orders;
CREATE TRIGGER factorboxes_order_member_profile AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.factorboxes_fill_member_from_order();

-- Restore missing fields from each account's most recent non-cancelled order.
WITH latest AS (
 SELECT DISTINCT ON(o.member_id) o.*,u.email AS account_email
 FROM public.orders o JOIN auth.users u ON u.id::text=o.member_id
 WHERE o.status<>'ยกเลิก' AND trim(o.customer)<>'' AND trim(o.phone)<>'' AND trim(o.address)<>''
 ORDER BY o.member_id,o.created DESC,o.id DESC
), source AS (
 SELECT *,COALESCE(substring(trim(address) from '([0-9]{5})$'),'') AS zip FROM latest
)
INSERT INTO public.members(id,email,name,phone,address,postcode,updated)
SELECT member_id,account_email,customer,phone,
 CASE WHEN zip<>'' THEN trim(regexp_replace(trim(address),'[0-9]{5}$','')) ELSE trim(address) END,zip,created FROM source
ON CONFLICT(id) DO UPDATE SET
 email=CASE WHEN trim(members.email)='' THEN EXCLUDED.email ELSE members.email END,
 name=CASE WHEN trim(members.name)='' THEN EXCLUDED.name ELSE members.name END,
 phone=CASE WHEN trim(members.phone)='' THEN EXCLUDED.phone ELSE members.phone END,
 address=CASE WHEN trim(members.address)='' THEN EXCLUDED.address ELSE members.address END,
 postcode=CASE WHEN trim(members.address)='' AND trim(members.postcode)='' THEN EXCLUDED.postcode ELSE members.postcode END,
 updated=EXCLUDED.updated
WHERE trim(members.name)='' OR trim(members.phone)='' OR trim(members.address)='' OR trim(members.email)='';
COMMIT;
