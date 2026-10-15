-- Arrange calendar_events chronologically by month (January -> December)
UPDATE calendar_events SET sort = CASE title_th
  WHEN 'วันเด็ก' THEN 1
  WHEN 'I New Gen' THEN 2
  WHEN 'วันนักประดิษฐ์' THEN 3
  WHEN 'MedSpark Innovation Competition (MSIC)' THEN 4
  WHEN 'แข่งต่างประเทศ' THEN 5
  WHEN 'STS' THEN 6
  WHEN 'Thailand Research Expo' THEN 7
  WHEN 'สกสว.' THEN 8
  WHEN 'กรมวิทย์' THEN 9
  WHEN 'MEDiHack 2027' THEN 10
  ELSE sort
END;
