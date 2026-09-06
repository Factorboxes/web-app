-- FACTORBOXES: run once on a NEW Supabase project.
BEGIN;

CREATE TABLE IF NOT EXISTS public."products" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "price" BIGINT NOT NULL,
  "active" BIGINT NOT NULL DEFAULT 1,
  "sku" TEXT,
  "category" TEXT NOT NULL DEFAULT 'กล่อง'
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_products_sku" ON public."products" ("sku");

ALTER TABLE public."products" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public."products" FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public."orders" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "token" TEXT NOT NULL,
  "created" TEXT NOT NULL,
  "customer" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "tax" TEXT NOT NULL,
  "items" TEXT NOT NULL,
  "subtotal" BIGINT NOT NULL,
  "shipping" BIGINT NOT NULL,
  "vat" BIGINT NOT NULL,
  "total" BIGINT NOT NULL,
  "status" TEXT NOT NULL,
  "carrier" TEXT NOT NULL,
  "tracking" TEXT NOT NULL,
  "payment" TEXT NOT NULL,
  "member_id" TEXT,
  "transferred_at" TEXT,
  "coupon_code" TEXT NOT NULL DEFAULT '',
  "coupon_discount" BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "idx_orders_member_id_created" ON public."orders" ("member_id","created");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_orders_token" ON public."orders" ("token");

ALTER TABLE public."orders" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public."orders" FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public."settings" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "value" TEXT NOT NULL
);

ALTER TABLE public."settings" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public."settings" FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public."members" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "postcode" TEXT NOT NULL,
  "updated" TEXT NOT NULL
);

ALTER TABLE public."members" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public."members" FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public."slips" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "order_id" TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "mime" TEXT NOT NULL,
  "created" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "reviewed" TEXT,
  "transferred_at" TEXT,
  FOREIGN KEY ("order_id") REFERENCES "orders"("id")
);

CREATE INDEX IF NOT EXISTS "idx_slips_order_id_status" ON public."slips" ("order_id","status");

ALTER TABLE public."slips" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public."slips" FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public."documents" (
  "id" BIGSERIAL PRIMARY KEY NOT NULL,
  "order_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "created" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  FOREIGN KEY ("order_id") REFERENCES "orders"("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_documents_order_id_type" ON public."documents" ("order_id","type");

ALTER TABLE public."documents" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public."documents" FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public."product_images" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "product_id" TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "mime" TEXT NOT NULL,
  "slot" BIGINT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_product_images_product_id_slot" ON public."product_images" ("product_id","slot");

ALTER TABLE public."product_images" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public."product_images" FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public."coupons" (
  "code" TEXT PRIMARY KEY NOT NULL,
  "kind" TEXT NOT NULL,
  "value" BIGINT NOT NULL,
  "minimum" BIGINT NOT NULL DEFAULT 0,
  "active" BIGINT NOT NULL DEFAULT 1,
  "ends_at" TEXT
);

ALTER TABLE public."coupons" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public."coupons" FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public."admin_users" (
  "member_id" TEXT PRIMARY KEY NOT NULL,
  "permissions" TEXT NOT NULL,
  "active" BIGINT NOT NULL DEFAULT 1,
  "updated" TEXT NOT NULL,
  FOREIGN KEY ("member_id") REFERENCES "members"("id")
);

ALTER TABLE public."admin_users" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public."admin_users" FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created);

COMMIT;
