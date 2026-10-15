-- Update National Children's Day (วันเด็ก) from '2 มกราคม' to the 2nd Saturday of January (10 January 2026)
UPDATE calendar_events
SET approx_date_th = 'วันเสาร์ที่ 10 มกราคม (เสาร์ที่ 2 ของเดือนมกราคม)',
    approx_date_en = 'Saturday, January 10 (2nd Saturday of January)'
WHERE title_th = 'วันเด็ก';
