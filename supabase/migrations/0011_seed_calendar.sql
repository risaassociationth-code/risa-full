-- Seed the calendar events if empty
INSERT INTO calendar_events (title_th, title_en, approx_date_th, approx_date_en, body_th, body_en, sort, status)
SELECT * FROM (VALUES
  ('I New Gen', 'I New Gen', 'มกราคม - กุมภาพันธ์', 'January - February', 'แข่งนวัตกรรม\nจัดบูธ\nเวิร์คช็อป\nจัดงานแข่ง\nผู้เข้าร่วม: นักวิจัย, ม.ปลาย, ชาวต่างชาติ', 'Innovation Competition\nBooths\nWorkshops\nCompetition Event\nParticipants: Researchers, High school students, Foreigners', 1, 'published'),
  ('กรมวิทย์', 'Department of Science', 'ปลาย มิ.ย.', 'Late June', '', '', 2, 'published'),
  ('Thailand Research Expo', 'Thailand Research Expo', 'มิ.ย.', 'June', '', '', 3, 'published'),
  ('สกสว.', 'TSRI', 'มิ.ย.', 'June', '', '', 4, 'published'),
  ('MedSpark Innovation Competition (MSIC)', 'MedSpark Innovation Competition (MSIC)', 'มี.ค.', 'March', '', '', 5, 'published'),
  ('MEDiHack 2027', 'MEDiHack 2027', 'ต.ค. - พ.ย.', 'October - November', '', '', 6, 'published'),
  ('วันนักประดิษฐ์', 'Inventors'' Day', 'กุมภาพันธ์', 'February', '', '', 7, 'published'),
  ('วันเด็ก', 'Children''s Day', '2 มกราคม', 'January 2', '', '', 8, 'published'),
  ('แข่งต่างประเทศ', 'International Competitions', 'มีนาคม - พฤศจิกายน', 'March - November', '- Geneva (มี.ค.)\n- One stock open house (มี.ค.)\n- โปแลนด์ (มิ.ย.)\n- จีน (มิ.ย.) @ Shanghai\n- ญี่ปุ่น (ก.ค.)\n- เกาหลี (ส.ค.)\n- America (ก.ค.)\n- ไต้หวัน (พ.ย.)\n- ฮ่องกง (พ.ย.)\n- Germany (ต.ค.)', '- Geneva (Mar)\n- One stock open house (Mar)\n- Poland (Jun)\n- China (Jun) @ Shanghai\n- Japan (Jul)\n- Korea (Aug)\n- America (Jul)\n- Taiwan (Nov)\n- Hong Kong (Nov)\n- Germany (Oct)', 9, 'published'),
  ('STS', 'STS', 'เมษายน', 'April', 'Science and technology society.', 'Science and technology society.', 11, 'published')
) AS v(title_th, title_en, approx_date_th, approx_date_en, body_th, body_en, sort, status)
WHERE NOT EXISTS (SELECT 1 FROM calendar_events);

-- Seed the nav item if not exists
INSERT INTO nav_items (id, label_th, label_en, href, sort, status)
SELECT gen_random_uuid(), 'ปฏิทิน', 'Calendar', '/calendar', COALESCE((SELECT MAX(sort) FROM nav_items WHERE parent_id IS NULL), 0) + 1, 'published'
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE href = '/calendar');
