-- Make birthdate column nullable (not required)
ALTER TABLE public.users ALTER COLUMN birthdate DROP NOT NULL;
