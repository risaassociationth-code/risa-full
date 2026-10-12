DO $$ 
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.staff_members'::regclass
      AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE public.staff_members DROP CONSTRAINT ' || quote_ident(rec.conname);
  END LOOP;
END $$;

ALTER TABLE public.staff_members ADD CONSTRAINT staff_members_tier_check CHECK (tier in ('head', 'advisor', 'manager', 'staff'));
