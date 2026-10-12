alter table public.staff_members add column if not exists tier text not null default 'staff' check (tier in ('head', 'manager', 'staff'));

-- Preserve the existing visual layout by migrating the top 3 sorted items
with ranked as (
  select id, row_number() over (order by sort, created_at) as rk
  from public.staff_members
)
update public.staff_members
set tier = case 
  when ranked.rk = 1 then 'head'
  when ranked.rk in (2, 3) then 'manager'
  else 'staff'
end
from ranked
where public.staff_members.id = ranked.id;
