INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types) VALUES ('factorboxes','factorboxes',false,4194304,ARRAY['image/jpeg','image/png','image/webp']) ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=4194304,allowed_mime_types=excluded.allowed_mime_types;
-- No browser read/write policies: only authenticated application server routes access storage.
