-- Remove MMS Hub prefixes, source notice banners, image alt labels, and tags
-- from existing news and activities records in the database.
-- Uses valid PostgreSQL ARE regular expressions (no [\s\S] inside bracket expressions).

update news
set
  excerpt_th = regexp_replace(excerpt_th, '^(จาก[[:space:]]*MMS[- ]*Hub[[:space:]]*·[[:space:]]*|MMS[- ]*Hub[[:space:]]*·[[:space:]]*(Original-language source:[[:space:]]*)?)', '', 'i'),
  excerpt_en = regexp_replace(excerpt_en, '^(จาก[[:space:]]*MMS[- ]*Hub[[:space:]]*·[[:space:]]*|MMS[- ]*Hub[[:space:]]*·[[:space:]]*(Original-language source:[[:space:]]*)?)', '', 'i'),
  body_th = replace(
    regexp_replace(
      regexp_replace(body_th, '<div[^>]*class="[^"]*mms-source-notice[^"]*"[^>]*>.*?</div>', '', 'gi'),
      '<p[^>]*>(?:(?!</p>).)*(?:เนื้อหาจากเครือข่าย|Reproduced from MMS|ไม่ใช่ประกาศหรือผลงานของ RISA)(?:(?!</p>).)*</p>',
      '',
      'gi'
    ),
    'alt="ภาพประกอบจาก MMS Hub"',
    'alt="ภาพประกอบกิจกรรม"'
  ),
  body_en = replace(
    regexp_replace(
      regexp_replace(body_en, '<div[^>]*class="[^"]*mms-source-notice[^"]*"[^>]*>.*?</div>', '', 'gi'),
      '<p[^>]*>(?:(?!</p>).)*(?:เนื้อหาจากเครือข่าย|Reproduced from MMS|ไม่ใช่ประกาศหรือผลงานของ RISA)(?:(?!</p>).)*</p>',
      '',
      'gi'
    ),
    'alt="ภาพประกอบจาก MMS Hub"',
    'alt="ภาพประกอบกิจกรรม"'
  ),
  tags = array_remove(array_remove(tags, 'MMS Hub'), 'MMS-HUB')
where
  excerpt_th ~* 'mms[- ]*hub'
  or excerpt_en ~* 'mms[- ]*hub'
  or body_th ~* 'mms-source-notice|ภาพประกอบจาก MMS Hub|Reproduced from MMS|เนื้อหาจากเครือข่าย'
  or body_en ~* 'mms-source-notice|ภาพประกอบจาก MMS Hub|Reproduced from MMS|เนื้อหาจากเครือข่าย'
  or 'MMS Hub' = any(tags)
  or 'MMS-HUB' = any(tags);

update activities
set
  excerpt_th = regexp_replace(excerpt_th, '^(จาก[[:space:]]*MMS[- ]*Hub[[:space:]]*·[[:space:]]*|MMS[- ]*Hub[[:space:]]*·[[:space:]]*(Original-language source:[[:space:]]*)?)', '', 'i'),
  excerpt_en = regexp_replace(excerpt_en, '^(จาก[[:space:]]*MMS[- ]*Hub[[:space:]]*·[[:space:]]*|MMS[- ]*Hub[[:space:]]*·[[:space:]]*(Original-language source:[[:space:]]*)?)', '', 'i'),
  body_th = replace(
    regexp_replace(
      regexp_replace(body_th, '<div[^>]*class="[^"]*mms-source-notice[^"]*"[^>]*>.*?</div>', '', 'gi'),
      '<p[^>]*>(?:(?!</p>).)*(?:เนื้อหาจากเครือข่าย|Reproduced from MMS|ไม่ใช่ประกาศหรือผลงานของ RISA)(?:(?!</p>).)*</p>',
      '',
      'gi'
    ),
    'alt="ภาพประกอบจาก MMS Hub"',
    'alt="ภาพประกอบกิจกรรม"'
  ),
  body_en = replace(
    regexp_replace(
      regexp_replace(body_en, '<div[^>]*class="[^"]*mms-source-notice[^"]*"[^>]*>.*?</div>', '', 'gi'),
      '<p[^>]*>(?:(?!</p>).)*(?:เนื้อหาจากเครือข่าย|Reproduced from MMS|ไม่ใช่ประกาศหรือผลงานของ RISA)(?:(?!</p>).)*</p>',
      '',
      'gi'
    ),
    'alt="ภาพประกอบจาก MMS Hub"',
    'alt="ภาพประกอบกิจกรรม"'
  )
where
  excerpt_th ~* 'mms[- ]*hub'
  or excerpt_en ~* 'mms[- ]*hub'
  or body_th ~* 'mms-source-notice|ภาพประกอบจาก MMS Hub|Reproduced from MMS|เนื้อหาจากเครือข่าย'
  or body_en ~* 'mms-source-notice|ภาพประกอบจาก MMS Hub|Reproduced from MMS|เนื้อหาจากเครือข่าย';
