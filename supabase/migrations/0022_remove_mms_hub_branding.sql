-- Remove MMS Hub prefixes, source notice banners, image alt labels, and tags
-- from existing news and activities records in the database.

update news
set
  excerpt_th = regexp_replace(excerpt_th, '^(จาก\s*MMS[-\s]*Hub\s*·\s*|MMS[-\s]*Hub\s*·\s*(Original-language source:\s*)?)', '', 'i'),
  excerpt_en = regexp_replace(excerpt_en, '^(จาก\s*MMS[-\s]*Hub\s*·\s*|MMS[-\s]*Hub\s*·\s*(Original-language source:\s*)?)', '', 'i'),
  body_th = replace(
    regexp_replace(body_th, '<div[^>]*class="[^"]*mms-source-notice[^"]*"[^>]*>[\s\S]*?</div>', '', 'gi'),
    'alt="ภาพประกอบจาก MMS Hub"',
    'alt="ภาพประกอบกิจกรรม"'
  ),
  body_en = replace(
    regexp_replace(body_en, '<div[^>]*class="[^"]*mms-source-notice[^"]*"[^>]*>[\s\S]*?</div>', '', 'gi'),
    'alt="ภาพประกอบจาก MMS Hub"',
    'alt="ภาพประกอบกิจกรรม"'
  ),
  tags = array_remove(array_remove(tags, 'MMS Hub'), 'MMS-HUB')
where
  excerpt_th ~* 'mms[-\s]*hub'
  or excerpt_en ~* 'mms[-\s]*hub'
  or body_th ~* 'mms-source-notice|ภาพประกอบจาก MMS Hub'
  or body_en ~* 'mms-source-notice|ภาพประกอบจาก MMS Hub'
  or 'MMS Hub' = any(tags)
  or 'MMS-HUB' = any(tags);

update activities
set
  excerpt_th = regexp_replace(excerpt_th, '^(จาก\s*MMS[-\s]*Hub\s*·\s*|MMS[-\s]*Hub\s*·\s*(Original-language source:\s*)?)', '', 'i'),
  excerpt_en = regexp_replace(excerpt_en, '^(จาก\s*MMS[-\s]*Hub\s*·\s*|MMS[-\s]*Hub\s*·\s*(Original-language source:\s*)?)', '', 'i'),
  body_th = replace(
    regexp_replace(body_th, '<div[^>]*class="[^"]*mms-source-notice[^"]*"[^>]*>[\s\S]*?</div>', '', 'gi'),
    'alt="ภาพประกอบจาก MMS Hub"',
    'alt="ภาพประกอบกิจกรรม"'
  ),
  body_en = replace(
    regexp_replace(body_en, '<div[^>]*class="[^"]*mms-source-notice[^"]*"[^>]*>[\s\S]*?</div>', '', 'gi'),
    'alt="ภาพประกอบจาก MMS Hub"',
    'alt="ภาพประกอบกิจกรรม"'
  )
where
  excerpt_th ~* 'mms[-\s]*hub'
  or excerpt_en ~* 'mms[-\s]*hub'
  or body_th ~* 'mms-source-notice|ภาพประกอบจาก MMS Hub'
  or body_en ~* 'mms-source-notice|ภาพประกอบจาก MMS Hub';
