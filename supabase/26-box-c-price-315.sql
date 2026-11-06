BEGIN;
-- New price is stored as integer satang. Only the standard box C changes.
UPDATE public.products
SET price = 315
WHERE id = 'C' AND price IS DISTINCT FROM 315;
COMMIT;
