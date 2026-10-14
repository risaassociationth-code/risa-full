ALTER TABLE public.site_visits ALTER COLUMN total_views SET DEFAULT 1;

UPDATE public.site_visits
SET total_views = 1,
    updated_at = now()
WHERE id = 'global';

DELETE FROM public.active_visitors;
