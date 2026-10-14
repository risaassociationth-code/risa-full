CREATE TABLE IF NOT EXISTS public.site_visits (
  id text PRIMARY KEY DEFAULT 'global',
  total_views bigint NOT NULL DEFAULT 1580,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.site_visits (id, total_views)
VALUES ('global', 1580)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.active_visitors (
  session_id text PRIMARY KEY,
  last_seen timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_active_visitors_last_seen ON public.active_visitors (last_seen);
