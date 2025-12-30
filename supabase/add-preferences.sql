-- Add preference columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferred_gender TEXT DEFAULT 'No preference',
ADD COLUMN IF NOT EXISTS preferred_term TEXT DEFAULT 'No preference';

-- Update existing users with default preferences
UPDATE users
SET preferred_gender = 'No preference',
    preferred_term = 'No preference'
WHERE preferred_gender IS NULL OR preferred_term IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.preferred_gender IS 'User preference for roommate gender filter in discover page';
COMMENT ON COLUMN users.preferred_term IS 'User preference for roommate academic year filter in discover page';
