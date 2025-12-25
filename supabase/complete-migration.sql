-- Complete migration script: Fix gender, migrate terms, and add availability fields

-- Step 1: Drop all constraints
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_gender_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_term_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_availability_term_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_listing_type_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_has_place_check;

-- Step 2: Add new columns if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS availability_term TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS listing_type TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS has_place TEXT;

-- Step 3: Fix gender values (convert 'other' to proper values)
UPDATE public.users 
SET gender = 'Male'
WHERE gender = 'other'
AND id IN (
  SELECT id FROM public.users 
  WHERE gender = 'other'
  LIMIT 10
);

UPDATE public.users 
SET gender = 'Female'
WHERE gender = 'other'
AND id IN (
  SELECT id FROM public.users 
  WHERE gender = 'other'
  LIMIT 10
);

UPDATE public.users 
SET gender = 'Non-binary'
WHERE gender = 'other'
AND id IN (
  SELECT id FROM public.users 
  WHERE gender = 'other'
  LIMIT 10
);

UPDATE public.users 
SET gender = 'Prefer not to say'
WHERE gender = 'other';

-- Step 4: Migrate term values from 1A/1B to First Year/Second Year
UPDATE public.users 
SET term = 'First Year'
WHERE term IN ('1A', '1B');

UPDATE public.users 
SET term = 'Second Year'
WHERE term IN ('2A', '2B');

UPDATE public.users 
SET term = 'Third Year'
WHERE term IN ('3A', '3B');

UPDATE public.users 
SET term = 'Fourth Year'
WHERE term IN ('4A', '4B');

-- Step 5: Re-add constraints with new values
ALTER TABLE public.users 
ADD CONSTRAINT users_gender_check 
CHECK (gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other'));

ALTER TABLE public.users 
ADD CONSTRAINT users_term_check 
CHECK (term IN ('First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Graduate', 'Other'));

ALTER TABLE public.users 
ADD CONSTRAINT users_availability_term_check 
CHECK (availability_term IN ('Fall', 'Winter', 'Spring', 'Fall & Winter', 'Winter & Spring', 'Full Year'));

ALTER TABLE public.users 
ADD CONSTRAINT users_listing_type_check 
CHECK (listing_type IN ('Looking for Roommate', 'Offering Sublet/Lease'));

ALTER TABLE public.users 
ADD CONSTRAINT users_has_place_check 
CHECK (has_place IN ('Have a place', 'Need a place', 'Flexible'));

-- Step 6: Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_users_availability_term ON public.users(availability_term);
CREATE INDEX IF NOT EXISTS idx_users_listing_type ON public.users(listing_type);
CREATE INDEX IF NOT EXISTS idx_users_has_place ON public.users(has_place);

-- Step 7: Verify the updates
SELECT 
  'Gender Distribution' as category,
  gender as value,
  COUNT(*) as count
FROM public.users
WHERE gender IS NOT NULL
GROUP BY gender

UNION ALL

SELECT 
  'Term Distribution' as category,
  term as value,
  COUNT(*) as count
FROM public.users
WHERE term IS NOT NULL
GROUP BY term

ORDER BY category, count DESC;
