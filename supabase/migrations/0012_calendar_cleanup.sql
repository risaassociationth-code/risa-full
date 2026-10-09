-- 0011 stored "\n" as literal backslash-n; convert to real line breaks.
UPDATE calendar_events
SET body_th = replace(body_th, '\n', E'\n'),
    body_en = replace(body_en, '\n', E'\n')
WHERE body_th LIKE '%\\n%' OR body_en LIKE '%\\n%';

-- The public nav is defined in code (src/lib/site-scope.ts), not nav_items.
DELETE FROM nav_items WHERE href = '/calendar';
