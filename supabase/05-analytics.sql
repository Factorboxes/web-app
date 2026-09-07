-- Run once in Supabase SQL Editor. Safe to rerun; preserves existing statistics.
CREATE TABLE IF NOT EXISTS public.site_visits (
 day date NOT NULL,
 visitor uuid NOT NULL,
 path text NOT NULL CHECK (path IN ('/','/login','/account','/account/orders','/track')),
 views bigint NOT NULL DEFAULT 1 CHECK (views > 0),
 last_seen timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(day,visitor,path)
);
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.site_visits FROM anon,authenticated;
