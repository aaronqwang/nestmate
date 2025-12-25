-- Migration to add missing columns to existing users table

-- Add missing columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS major TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS term TEXT CHECK (term IN ('First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Graduate', 'Other'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS availability_term TEXT CHECK (availability_term IN ('Fall', 'Winter', 'Spring', 'Fall & Winter', 'Winter & Spring', 'Full Year'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS listing_type TEXT CHECK (listing_type IN ('Looking for Roommate', 'Offering Sublet/Lease'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS has_place TEXT CHECK (has_place IN ('Have a place', 'Need a place', 'Flexible'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS prompts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
    "budget_range": {"min": 0, "max": 2000},
    "move_in_date": null,
    "lease_duration": null,
    "cleanliness_level": null,
    "noise_tolerance": null,
    "guest_policy": null
}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_gender ON public.users(gender);
CREATE INDEX IF NOT EXISTS idx_users_major ON public.users(major);
CREATE INDEX IF NOT EXISTS idx_users_term ON public.users(term);
CREATE INDEX IF NOT EXISTS idx_users_availability_term ON public.users(availability_term);
CREATE INDEX IF NOT EXISTS idx_users_listing_type ON public.users(listing_type);
CREATE INDEX IF NOT EXISTS idx_users_has_place ON public.users(has_place);
CREATE INDEX IF NOT EXISTS idx_users_location ON public.users(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON public.users(last_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Create other tables if they don't exist

-- Likes table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_from_user ON public.likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_likes_to_user ON public.likes(to_user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at);

-- Matches table
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user1_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    user2_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_user1 ON public.matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON public.matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches(created_at);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_match ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Create triggers and functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.likes 
        WHERE from_user_id = NEW.to_user_id 
        AND to_user_id = NEW.from_user_id
    ) THEN
        INSERT INTO public.matches (user1_id, user2_id)
        VALUES (
            LEAST(NEW.from_user_id, NEW.to_user_id),
            GREATEST(NEW.from_user_id, NEW.to_user_id)
        )
        ON CONFLICT (user1_id, user2_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_match_trigger ON public.likes;
CREATE TRIGGER create_match_trigger AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION create_match_on_mutual_like();

CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users SET last_active = NOW() WHERE id = NEW.from_user_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_last_active_trigger ON public.likes;
CREATE TRIGGER update_last_active_trigger AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION update_last_active();

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own likes" ON public.likes;
CREATE POLICY "Users can view their own likes" ON public.likes
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Users can create their own likes" ON public.likes;
CREATE POLICY "Users can create their own likes" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;
CREATE POLICY "Users can delete their own likes" ON public.likes
    FOR DELETE USING (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
CREATE POLICY "Users can view their own matches" ON public.matches
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can view messages in their matches" ON public.messages;
CREATE POLICY "Users can view messages in their matches" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE id = match_id 
            AND (user1_id = auth.uid() OR user2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can send messages in their matches" ON public.messages;
CREATE POLICY "Users can send messages in their matches" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE id = match_id 
            AND (user1_id = auth.uid() OR user2_id = auth.uid())
        )
    );

-- =====================================================
-- SAMPLE DATA - Insert sample user profiles
-- =====================================================
-- Note: You'll need to create the auth.users first via Supabase Auth Dashboard or API
-- Then update the user profiles here. For now, this is a template.

-- Example: Update existing users with sample data
-- Replace the UUIDs with actual user IDs from your auth.users table

-- Sample profile updates (run these after creating auth users)
-- UPDATE public.users SET 
--   full_name = 'Emily Chen',
--   profile_photo = 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily.chen@uwaterloo.ca',
--   major = 'Computer Science',
--   term = '2B',
--   bio = 'Looking for a clean and quiet roommate for Spring term!',
--   prompts = '[
--     {"prompt": "My ideal living situation is...", "answer": "A quiet apartment close to campus where I can focus on my studies but also have fun on weekends."},
--     {"prompt": "I keep my space...", "answer": "Very organized and clean. I do dishes right away and vacuum weekly."},
--     {"prompt": "My sleep schedule is...", "answer": "Usually in bed by 11pm, up at 7am for morning classes."}
--   ]'::jsonb,
--   profile_completed = true
-- WHERE email = 'emily.chen@uwaterloo.ca';
