-- Merge I-New Gen and วันนักประดิษฐ์ into a single February 2027 event
-- (Thailand Inventors' Day 2027 & I-New Gen Award 2027, 2 - 6 February 2027 at BITEC Bangna)
-- and remove any duplicate/October I-New Gen entry.

-- 1. If a separate I-New Gen row exists alongside a วันนักประดิษฐ์ row, delete the duplicate I-New Gen row
DELETE FROM calendar_events
WHERE (title_th ~* 'i[- ]?new[- ]?gen' OR title_en ~* 'i[- ]?new[- ]?gen')
  AND EXISTS (
    SELECT 1 FROM calendar_events
    WHERE title_th ~* 'วันนักประดิษฐ์' OR title_en ~* 'inventor'
  );

-- 2. Update the remaining วันนักประดิษฐ์ (or I-New Gen) row to the unified 2027 event in February
UPDATE calendar_events
SET
  title_th = 'งานวันนักประดิษฐ์ 2570 (I-New Gen Award 2027)',
  title_en = 'Thailand Inventors'' Day 2027 (I-New Gen Award 2027)',
  approx_date_th = '2 - 6 กุมภาพันธ์ 2570',
  approx_date_en = '2 - 6 February 2027',
  body_th = E'ศูนย์นิทรรศการและการประชุมไบเทค บางนา (BITEC Bangna)\nนิทรรศการสิ่งประดิษฐ์\nการประกวด I-New Gen & IPITEx\nเวิร์คช็อป\nผู้เข้าร่วม: นักประดิษฐ์, นักวิจัย, นักเรียน/นักศึกษา, ชาวต่างชาติ (จัดโดย วช.)',
  body_en = E'BITEC Bangna, Bangkok\nInvention Exhibition\nI-New Gen & IPITEx Competitions\nWorkshops\nParticipants: Inventors, Researchers, High school & University students, International delegates (NRCT)',
  sort = 2
WHERE title_th ~* 'วันนักประดิษฐ์|i[- ]?new[- ]?gen'
   OR title_en ~* 'inventor|i[- ]?new[- ]?gen';

-- 3. Re-normalize chronological sort order across the year
UPDATE calendar_events SET sort = CASE
  WHEN title_th ~* 'วันเด็ก' THEN 1
  WHEN title_th ~* 'วันนักประดิษฐ์|i[- ]?new[- ]?gen' THEN 2
  WHEN title_th ~* 'MedSpark|MSIC' THEN 3
  WHEN title_th ~* 'แข่งต่างประเทศ' THEN 4
  WHEN title_th ~* 'STS' THEN 5
  WHEN title_th ~* 'Thailand Research Expo' THEN 6
  WHEN title_th ~* 'สกสว' THEN 7
  WHEN title_th ~* 'กรมวิทย์' THEN 8
  WHEN title_th ~* 'MEDiHack' THEN 9
  ELSE sort
END;
