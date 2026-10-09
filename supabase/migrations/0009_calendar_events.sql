CREATE TABLE calendar_events (
    id SERIAL PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'published',
    sort_order INTEGER NOT NULL DEFAULT 0,
    title_th TEXT NOT NULL,
    title_en TEXT NOT NULL,
    approx_date_th TEXT NOT NULL,
    approx_date_en TEXT NOT NULL,
    body_th TEXT,
    body_en TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published calendar events" ON calendar_events FOR SELECT USING (status = 'published');
CREATE POLICY "Admins have full access to calendar events" ON calendar_events TO authenticated USING (true) WITH CHECK (true);
