DO $$ 
BEGIN
  ALTER TABLE public.staff_members DROP CONSTRAINT staff_members_tier_check;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

ALTER TABLE public.staff_members ADD CONSTRAINT staff_members_tier_check CHECK (tier in ('head', 'advisor', 'manager', 'staff'));
