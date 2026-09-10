-- Member directory repair. Run the entire file in the website's Supabase project.
-- Does not delete accounts, orders, or saved profile fields. Safe to run again.
BEGIN;
CREATE OR REPLACE FUNCTION public.factorboxes_complete_member(
 account_id text, account_email text, recipient text, telephone text, street text, zip text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF account_id IS NULL OR NULLIF(trim(account_email),'') IS NULL THEN RETURN; END IF;
 INSERT INTO public.members(id,email,name,phone,address,postcode,updated)
 VALUES(account_id,trim(account_email),COALESCE(trim(recipient),''),COALESCE(trim(telephone),''),COALESCE(trim(street),''),COALESCE(trim(zip),''),clock_timestamp()::text)
 ON CONFLICT(id) DO UPDATE SET
 email=CASE WHEN COALESCE(trim(members.email),'')='' THEN EXCLUDED.email ELSE members.email END,
 name=CASE WHEN COALESCE(trim(members.name),'')='' THEN EXCLUDED.name ELSE members.name END,
 phone=CASE WHEN COALESCE(trim(members.phone),'')='' THEN EXCLUDED.phone ELSE members.phone END,
 address=CASE WHEN COALESCE(trim(members.address),'')='' THEN EXCLUDED.address ELSE members.address END,
 postcode=CASE WHEN COALESCE(trim(members.postcode),'')='' AND (COALESCE(trim(members.address),'')='' OR trim(members.address)=EXCLUDED.address) THEN EXCLUDED.postcode ELSE members.postcode END,
 updated=EXCLUDED.updated
 WHERE (COALESCE(trim(members.email),'')='' AND EXCLUDED.email<>'')
 OR (COALESCE(trim(members.name),'')='' AND EXCLUDED.name<>'')
 OR (COALESCE(trim(members.phone),'')='' AND EXCLUDED.phone<>'')
 OR (COALESCE(trim(members.address),'')='' AND EXCLUDED.address<>'')
 OR (COALESCE(trim(members.postcode),'')='' AND EXCLUDED.postcode<>'' AND (COALESCE(trim(members.address),'')='' OR trim(members.address)=EXCLUDED.address));
END $$;
REVOKE ALL ON FUNCTION public.factorboxes_complete_member(text,text,text,text,text,text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.factorboxes_sync_auth_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE recipient text; telephone text;
BEGIN
 recipient:=left(COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'),''),NULLIF(trim(NEW.raw_user_meta_data->>'name'),''),''),100);
 telephone:=regexp_replace(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'phone',''),'[[:space:]()-]','','g'),'^\+66','0');
 IF telephone !~ '^0[0-9]{8,9}$' THEN telephone:=''; END IF;
 PERFORM public.factorboxes_complete_member(NEW.id::text,NEW.email,recipient,telephone,'','');
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.factorboxes_sync_auth_member() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS factorboxes_auth_member_profile ON auth.users;
CREATE TRIGGER factorboxes_auth_member_profile AFTER INSERT OR UPDATE OF email,raw_user_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.factorboxes_sync_auth_member();

-- Include existing accounts even when they have never saved a shipping address.
DO $$ DECLARE u record; recipient text; telephone text;
BEGIN
 FOR u IN SELECT id,email,raw_user_meta_data FROM auth.users WHERE email IS NOT NULL LOOP
  recipient:=left(COALESCE(NULLIF(trim(u.raw_user_meta_data->>'full_name'),''),NULLIF(trim(u.raw_user_meta_data->>'name'),''),''),100);
  telephone:=regexp_replace(regexp_replace(COALESCE(u.raw_user_meta_data->>'phone',''),'[[:space:]()-]','','g'),'^\+66','0');
  IF telephone !~ '^0[0-9]{8,9}$' THEN telephone:=''; END IF;
  PERFORM public.factorboxes_complete_member(u.id::text,u.email,recipient,telephone,'','');
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.factorboxes_fill_member_from_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE account_email text; zip text; street text;
BEGIN
 IF NEW.member_id IS NULL OR NEW.status='ยกเลิก' THEN RETURN NEW; END IF;
 SELECT email INTO account_email FROM auth.users WHERE id::text=NEW.member_id;
 IF account_email IS NULL THEN RETURN NEW; END IF;
 zip:=COALESCE(substring(trim(NEW.address) from '([0-9]{5})$'),'');
 street:=CASE WHEN zip<>'' THEN trim(regexp_replace(trim(NEW.address),'[0-9]{5}$','')) ELSE trim(NEW.address) END;
 PERFORM public.factorboxes_complete_member(NEW.member_id,account_email,NEW.customer,NEW.phone,street,zip);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.factorboxes_fill_member_from_order() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS factorboxes_order_member_profile ON public.orders;
CREATE TRIGGER factorboxes_order_member_profile AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.factorboxes_fill_member_from_order();

-- Recover only from orders already linked to the same authenticated account ID.
-- No matching by phone, email, or customer name; guest orders stay unlinked.
DO $$ DECLARE o record; zip text; street text;
BEGIN
 FOR o IN
 SELECT DISTINCT ON (orders.member_id) orders.*,u.email AS account_email
 FROM public.orders JOIN auth.users u ON u.id::text=orders.member_id
 WHERE orders.status<>'ยกเลิก' AND NULLIF(trim(orders.address),'') IS NOT NULL
 ORDER BY orders.member_id,orders.created DESC,orders.id DESC
 LOOP
  zip:=COALESCE(substring(trim(o.address) from '([0-9]{5})$'),'');
  street:=CASE WHEN zip<>'' THEN trim(regexp_replace(trim(o.address),'[0-9]{5}$','')) ELSE trim(o.address) END;
  PERFORM public.factorboxes_complete_member(o.member_id,o.account_email,o.customer,o.phone,street,zip);
 END LOOP;
END $$;
COMMIT;
-- Display only counts for verification (no personal information).
SELECT count(*) AS member_total,
 count(*) FILTER(WHERE NULLIF(trim(name),'') IS NOT NULL AND NULLIF(trim(phone),'') IS NOT NULL AND NULLIF(trim(address),'') IS NOT NULL AND trim(postcode) ~ '^[0-9]{5}$') AS ready_to_ship,
 count(*) FILTER(WHERE COALESCE(trim(name),'')='' OR COALESCE(trim(phone),'')='' OR COALESCE(trim(address),'')='' OR COALESCE(trim(postcode),'') !~ '^[0-9]{5}$') AS awaiting_details
FROM public.members;
