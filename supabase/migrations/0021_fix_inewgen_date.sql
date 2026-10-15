-- Update I New Gen to 5 - 9 October and place it in October in sort order
UPDATE calendar_events
SET approx_date_th = '5 - 9 ตุลาคม',
    approx_date_en = '5 - 9 October'
WHERE title_th = 'I New Gen';

UPDATE calendar_events SET sort = CASE title_th
  WHEN 'วันเด็ก' THEN 1
  WHEN 'วันนักประดิษฐ์' THEN 2
  WHEN 'MedSpark Innovation Competition (MSIC)' THEN 3
  WHEN 'แข่งต่างประเทศ' THEN 4
  WHEN 'STS' THEN 5
  WHEN 'Thailand Research Expo' THEN 6
  WHEN 'สกสว.' THEN 7
  WHEN 'กรมวิทย์' THEN 8
  WHEN 'I New Gen' THEN 9
  WHEN 'MEDiHack 2027' THEN 10
  ELSE sort
END;
