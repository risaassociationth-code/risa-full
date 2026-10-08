-- Approved contact correction, 2026-10-08. The audit row is the recovery copy
-- and completion marker. Never overwrite a later edit or an unknown address.
do $$
declare
  current_settings settings%rowtype;
  before_values jsonb;
  after_values jsonb;
begin
  select * into strict current_settings from settings where id = true for update;
  if exists (select 1 from audit_log where action = 'release_footer_contact_2026_10_08'
             and entity = 'settings' and entity_id = 'singleton') then
    return;
  end if;

  if current_settings.phone not in ('02-123-4567', '082-793-4431', '')
     or current_settings.email not in ('info@risa.or.th', 'risa.association.th@gmail.com', '')
     or current_settings.address_th not in ('', 'เลขที่ 99 อาคารวิจัยและมาตรฐาน ชั้น 8 ถนนพระรามที่ 6 แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพมหานคร 10400')
     or current_settings.address_en not in ('', '99 Research & Standards Building, 8th Floor, Rama VI Road, Thung Phaya Thai, Ratchathewi, Bangkok 10400')
     or current_settings.facebook_url not in ('', 'https://facebook.com/')
     or current_settings.youtube_url not in ('', 'https://youtube.com/')
     or current_settings.linkedin_url not in ('', 'https://linkedin.com/')
     or (current_settings.map_lat is not null and current_settings.map_lat <> 13.7658)
     or (current_settings.map_lng is not null and current_settings.map_lng <> 100.5354) then
    raise exception 'Footer correction stopped: an affected setting differs from the reviewed demo values. Inspect before retrying.';
  end if;

  select jsonb_build_object(
    'phone', phone, 'email', email, 'address_th', address_th, 'address_en', address_en,
    'facebook_url', facebook_url, 'youtube_url', youtube_url, 'linkedin_url', linkedin_url,
    'map_lat', map_lat, 'map_lng', map_lng
  ) into before_values from settings where id = true;

  update settings set
    phone = '082-793-4431', email = 'risa.association.th@gmail.com',
    address_th = '', address_en = '', facebook_url = '', youtube_url = '', linkedin_url = '',
    map_lat = null, map_lng = null
  where id = true;

  select jsonb_build_object(
    'phone', phone, 'email', email, 'address_th', address_th, 'address_en', address_en,
    'facebook_url', facebook_url, 'youtube_url', youtube_url, 'linkedin_url', linkedin_url,
    'map_lat', map_lat, 'map_lng', map_lng
  ) into after_values from settings where id = true;

  insert into audit_log (actor_email, action, entity, entity_id, before, after)
  values ('authorized-release', 'release_footer_contact_2026_10_08', 'settings', 'singleton', before_values, after_values);
end $$;
