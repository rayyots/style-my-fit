-- Drop columns that referenced external purchases
ALTER TABLE public.products DROP COLUMN IF EXISTS purchase_type;
ALTER TABLE public.products DROP COLUMN IF EXISTS external_url;

-- Drop the now-unused enum
DROP TYPE IF EXISTS public.purchase_type;