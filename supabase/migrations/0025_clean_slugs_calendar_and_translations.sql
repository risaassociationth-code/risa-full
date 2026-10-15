-- 1. Convert any legacy mms-hub-* slugs in news and activities to canonical risa-* slugs
UPDATE news n
SET slug = regexp_replace(n.slug, '^mms-hub-', 'risa-')
WHERE n.slug LIKE 'mms-hub-%'
  AND NOT EXISTS (
    SELECT 1 FROM news n2
    WHERE n2.slug = regexp_replace(n.slug, '^mms-hub-', 'risa-')
  );

UPDATE activities a
SET slug = regexp_replace(a.slug, '^mms-hub-', 'risa-')
WHERE a.slug LIKE 'mms-hub-%'
  AND NOT EXISTS (
    SELECT 1 FROM activities a2
    WHERE a2.slug = regexp_replace(a.slug, '^mms-hub-', 'risa-')
  );

-- 2. Populate complete event details for calendar_events that were seeded with empty bodies
UPDATE calendar_events
SET
  body_th = E'กิจกรรมส่งเสริมการเรียนรู้วิทยาศาสตร์และนวัตกรรมสำหรับเยาวชน\nเวิร์คช็อปและการทดลองเชิงปฏิบัติการ\nผู้เข้าร่วม: เยาวชน, นักเรียน, ประชาชนทั่วไป',
  body_en = E'Youth Science and Innovation Learning Activities\nHands-on Workshops & Demonstrations\nParticipants: Youth, Students, General Public'
WHERE (title_th ~* 'วันเด็ก' OR title_en ~* 'children')
  AND COALESCE(TRIM(body_th), '') = '';

UPDATE calendar_events
SET
  body_th = E'การประกวดนวัตกรรมเครื่องมือทางการแพทย์ชนิดบุกรุกน้อย ระดับมัธยมศึกษา\nอบรมเชิงปฏิบัติการและนำเสนอผลงาน (Pitching)\nผู้เข้าร่วม: นักเรียนระดับมัธยมศึกษา, นักวิจัยพี่เลี้ยง',
  body_en = E'High School Minimally Invasive Medical Device Innovation Competition\nWorkshops, Mentoring & Final Pitching\nParticipants: High School Students, Research Mentors'
WHERE (title_th ~* 'MedSpark|MSIC' OR title_en ~* 'MedSpark|MSIC')
  AND COALESCE(TRIM(body_th), '') = '';

UPDATE calendar_events
SET
  body_th = E'เวทีความร่วมมือด้านวิทยาศาสตร์ เทคโนโลยี และนวัตกรรมระดับนานาชาติ (STS forum)\nการอบรมเตรียมความพร้อมนักวิจัยรุ่นใหม่ (NRCT YLP Workshop)\nผู้เข้าร่วม: นักวิจัยรุ่นใหม่, ผู้เชี่ยวชาญระดับนานาชาติ',
  body_en = E'Science and Technology in Society (STS) International Forum\nNRCT Young Leaders Program (YLP) Preparatory Workshop\nParticipants: Early-Career Researchers, International Experts'
WHERE (title_th ~* '^STS$' OR title_en ~* '^STS$')
  AND (COALESCE(TRIM(body_th), '') = '' OR body_th ~* '^science and technology society\.?$');

UPDATE calendar_events
SET
  body_th = E'โรงแรมเซ็นทาราแกรนด์ และบางกอกคอนเวนชันเซ็นเตอร์ เซ็นทรัลเวิลด์\nมหกรรมงานวิจัยแห่งชาติ ประจำปี 2569 (จัดโดย วช.)\nการประชุมวิชาการ นิทรรศการผลงานวิจัย และการประกวดนวัตกรรม\nผู้เข้าร่วม: นักวิจัย, คณาจารย์, นักศึกษา, ภาคอุตสาหกรรม',
  body_en = E'Centara Grand & Bangkok Convention Centre at CentralWorld\nThailand Research Expo 2026 (Organized by NRCT)\nAcademic Conferences, Research Exhibition & Innovation Competitions\nParticipants: Researchers, Faculty, Students, Industry Partners'
WHERE (title_th ~* 'Thailand Research Expo' OR title_en ~* 'Thailand Research Expo')
  AND COALESCE(TRIM(body_th), '') = '';

UPDATE calendar_events
SET
  body_th = E'สำนักงานคณะกรรมการส่งเสริมวิทยาศาสตร์ วิจัยและนวัตกรรม (สกสว.)\nการประชุมวิชาการและเวทีแลกเปลี่ยนทิศทางระบบวิทยาศาสตร์ วิจัยและนวัตกรรม (ววน.)\nผู้เข้าร่วม: นักวิจัย, เครือข่ายมหาวิทยาลัย, หน่วยงานภาครัฐและเอกชน',
  body_en = E'Thailand Science Research and Innovation (TSRI)\nAcademic Forum & National Science, Research and Innovation Ecosystem Symposium\nParticipants: Researchers, University Networks, Public & Private Sectors'
WHERE (title_th ~* 'สกสว' OR title_en ~* 'TSRI')
  AND COALESCE(TRIM(body_th), '') = '';

UPDATE calendar_events
SET
  body_th = E'ศูนย์การประชุมอิมแพ็คฟอรั่ม เมืองทองธานี\nการประชุมวิชาการวิทยาศาสตร์การแพทย์ ประจำปี (กรมวิทยาศาสตร์การแพทย์)\nการนำเสนอผลงานวิชาการและนิทรรศการนวัตกรรมด้านวิทยาศาสตร์การแพทย์\nผู้เข้าร่วม: นักวิชาการ, บุคลากรทางการแพทย์, นักวิจัย',
  body_en = E'IMPACT Forum Convention Center, Muang Thong Thani\nAnnual Medical Sciences Conference (Department of Medical Sciences)\nAcademic Presentations & Medical Science Innovation Exhibition\nParticipants: Medical Scientists, Healthcare Professionals, Researchers'
WHERE (title_th ~* 'กรมวิทย์' OR title_en ~* 'Department of Science')
  AND COALESCE(TRIM(body_th), '') = '';

UPDATE calendar_events
SET
  body_th = E'กิจกรรม Hackathon พัฒนานวัตกรรมเครื่องมือแพทย์ชนิดบุกรุกน้อย\nการคิดเชิงออกแบบ (Design Thinking) และการแก้ปัญหาเชิงสร้างสรรค์ร่วมกับผู้เชี่ยวชาญ\nผู้เข้าร่วม: นักเรียนระดับมัธยมศึกษาตอนปลาย, นักศึกษา, นักพัฒนาเทคโนโลยีการแพทย์',
  body_en = E'Minimally Invasive Medical Device Innovation Hackathon\nDesign Thinking, Creative Problem Solving & Expert Mentoring\nParticipants: High School & University Students, Medical Tech Developers'
WHERE (title_th ~* 'MEDiHack' OR title_en ~* 'MEDiHack')
  AND COALESCE(TRIM(body_th), '') = '';
