-- Migrate existing term data from 1A/1B format to First Year/Second Year format

-- First, drop the term check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_term_check;

-- Update 1A and 1B to First Year
UPDATE public.users 
SET term = 'First Year'
WHERE term IN ('1A', '1B');

-- Update 2A and 2B to Second Year
UPDATE public.users 
SET term = 'Second Year'
WHERE term IN ('2A', '2B');

-- Update 3A and 3B to Third Year
UPDATE public.users 
SET term = 'Third Year'
WHERE term IN ('3A', '3B');

-- Update 4A and 4B to Fourth Year
UPDATE public.users 
SET term = 'Fourth Year'
WHERE term IN ('4A', '4B');

-- Graduate and Other stay the same

-- Re-add the check constraint with new values
ALTER TABLE public.users 
ADD CONSTRAINT users_term_check 
CHECK (term IN ('First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Graduate', 'Other'));

-- Verify the update
SELECT term, COUNT(*) as count
FROM public.users
GROUP BY term
ORDER BY count DESC;
