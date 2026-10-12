DO $$ 
BEGIN
  -- We forcefully dropped all constraints in 0015, we must restore the others!
  ALTER TABLE public.staff_members ADD CONSTRAINT staff_members_photo_position_check CHECK (photo_position in ('top','center','bottom'));
  ALTER TABLE public.staff_members ADD CONSTRAINT staff_members_status_check CHECK (status in ('draft','published'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
