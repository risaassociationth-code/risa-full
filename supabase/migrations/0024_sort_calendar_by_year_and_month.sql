-- Ensure calendar_events sort order puts all 2569 (2026) events chronologically first,
-- followed by 2570 (2027) events chronologically.

UPDATE calendar_events SET sort = CASE
  WHEN title_th ~* 'วันเด็ก' THEN 1
  WHEN title_th ~* 'MedSpark|MSIC' THEN 2
  WHEN title_th ~* 'แข่งต่างประเทศ' THEN 3
  WHEN title_th ~* 'STS' THEN 4
  WHEN title_th ~* 'Thailand Research Expo' THEN 5
  WHEN title_th ~* 'สกสว' THEN 6
  WHEN title_th ~* 'กรมวิทย์' THEN 7
  WHEN title_th ~* 'วันนักประดิษฐ์|i[- ]?new[- ]?gen' THEN 8
  WHEN title_th ~* 'MEDiHack' THEN 9
  ELSE sort
END;
