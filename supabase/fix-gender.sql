-- First, drop the gender check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_gender_check;

-- Update all "other" values to random valid genders
-- We'll update in batches to assign different genders

-- Update first 10 to Male
UPDATE public.users 
SET gender = 'Male'
WHERE gender = 'other'
AND id IN (
  SELECT id FROM public.users 
  WHERE gender = 'other'
  LIMIT 10
);

-- Update next 10 to Female  
UPDATE public.users 
SET gender = 'Female'
WHERE gender = 'other'
AND id IN (
  SELECT id FROM public.users 
  WHERE gender = 'other'
  LIMIT 10
);

-- Update next 10 to Non-binary
UPDATE public.users 
SET gender = 'Non-binary'
WHERE gender = 'other'
AND id IN (
  SELECT id FROM public.users 
  WHERE gender = 'other'
  LIMIT 10
);

-- Update remaining to 'Prefer not to say'
UPDATE public.users 
SET gender = 'Prefer not to say'
WHERE gender = 'other';

-- Re-add the check constraint
ALTER TABLE public.users 
ADD CONSTRAINT users_gender_check 
CHECK (gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other'));

-- Verify the update
SELECT gender, COUNT(*) as count
FROM public.users
GROUP BY gender
ORDER BY count DESC;
