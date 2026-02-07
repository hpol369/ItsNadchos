-- Add Nadhira5 as the only paid photo (10 nadchos/credits)

-- First, deactivate all existing photos so only the new one is available
UPDATE nacho_photos SET is_active = FALSE;

-- Insert Nadhira Photo 5
-- Note: You must upload Nadhira5.jpg to Supabase Storage bucket 'nacho_photos' first
INSERT INTO nacho_photos (pack_id, storage_path, description, sort_order, is_active)
VALUES (
  'tier1',           -- Uses existing pack (required by foreign key)
  'Nadhira5.jpg',    -- Storage path in Supabase bucket 'nacho_photos'
  'Nadhira Photo 5', -- Description shown in gallery
  1,                 -- Sort order
  TRUE               -- Active and visible
);
