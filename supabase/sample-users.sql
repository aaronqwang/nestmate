-- Sample Users for NestMate
-- Note: These users need to be created through Supabase Auth first, then profiles updated
-- Run this after creating auth users with these emails

-- Insert sample user profiles
-- Make sure to create these users in Supabase Auth Dashboard first with password: TestPassword123!

INSERT INTO public.users (id, email, full_name, profile_photo, major, term, bio, prompts, profile_completed) 
VALUES 
  -- User 1
  (gen_random_uuid(), 'emily.chen@uwaterloo.ca', 'Emily Chen', 
   'https://i.pravatar.cc/300?img=1',
   'Computer Science', '2B',
   'Looking for a clean and quiet roommate for Spring term!',
   '[
     {"prompt": "My ideal living situation is...", "answer": "A quiet apartment close to campus where I can focus on my studies but also have fun on weekends."},
     {"prompt": "I keep my space...", "answer": "Very organized and clean. I do dishes right away and vacuum weekly."},
     {"prompt": "My sleep schedule is...", "answer": "Usually in bed by 11pm, up at 7am for morning classes."}
   ]'::jsonb, true),

  -- User 2
  (gen_random_uuid(), 'james.park@uwaterloo.ca', 'James Park',
   'https://i.pravatar.cc/300?img=12',
   'Mechanical Engineering', '3A',
   'Chill engineering student looking for roommates!',
   '[
     {"prompt": "My living habits include...", "answer": "I cook a lot and love sharing meals. Pretty social but respect quiet hours."},
     {"prompt": "On a typical weekday, you''ll find me...", "answer": "At the gym in the morning, in class, then working on projects or gaming."},
     {"prompt": "When it comes to guests and parties...", "answer": "I like having friends over on weekends but always give a heads up."}
   ]'::jsonb, true),

  -- User 3
  (gen_random_uuid(), 'sarah.williams@uwaterloo.ca', 'Sarah Williams',
   'https://i.pravatar.cc/300?img=5',
   'Mathematics', '1B',
   'First year math student seeking a study buddy roommate!',
   '[
     {"prompt": "I''m looking for a roommate who...", "answer": "Is also serious about academics but knows how to have a good time."},
     {"prompt": "My perfect weekend involves...", "answer": "Brunch with friends, studying at a cafe, and Netflix marathons."},
     {"prompt": "Deal breakers for me are...", "answer": "Smoking, loud music late at night, and messiness."}
   ]'::jsonb, true),

  -- User 4
  (gen_random_uuid(), 'michael.zhang@uwaterloo.ca', 'Michael Zhang',
   'https://i.pravatar.cc/300?img=15',
   'Software Engineering', '2A',
   'Software eng student, into gaming and coding!',
   '[
     {"prompt": "What makes me a great roommate is...", "answer": "I''m low maintenance, always pay rent on time, and I can fix your computer."},
     {"prompt": "My sleep schedule is...", "answer": "Night owl - usually coding until 2am, wake up around 10am."},
     {"prompt": "I keep my space...", "answer": "Moderately clean. I clean up after myself but I''m not obsessive about it."}
   ]'::jsonb, true),

  -- User 5
  (gen_random_uuid(), 'olivia.martinez@uwaterloo.ca', 'Olivia Martinez',
   'https://i.pravatar.cc/300?img=9',
   'Environmental Engineering', '3B',
   'Eco-conscious student looking for like-minded roommates!',
   '[
     {"prompt": "My ideal living situation is...", "answer": "A sustainable household with recycling, composting, and minimal waste."},
     {"prompt": "My living habits include...", "answer": "Vegetarian cooking, yoga in the mornings, and lots of plants!"},
     {"prompt": "I''m looking for a roommate who...", "answer": "Cares about the environment and wants to reduce our carbon footprint together."}
   ]'::jsonb, true),

  -- User 6
  (gen_random_uuid(), 'david.lee@uwaterloo.ca', 'David Lee',
   'https://i.pravatar.cc/300?img=13',
   'Business Administration', '4A',
   'Final year business student, mature and responsible.',
   '[
     {"prompt": "On a typical weekday, you''ll find me...", "answer": "Either at networking events, studying at the library, or working on my startup."},
     {"prompt": "When it comes to guests and parties...", "answer": "Rarely host, prefer quiet evenings. I''m usually out socializing elsewhere."},
     {"prompt": "What makes me a great roommate is...", "answer": "Very responsible, organized, and easy to communicate with."}
   ]'::jsonb, true),

  -- User 7
  (gen_random_uuid(), 'sophia.brown@uwaterloo.ca', 'Sophia Brown',
   'https://i.pravatar.cc/300?img=23',
   'Health Sciences', '2B',
   'Health sci student, love cooking and staying active!',
   '[
     {"prompt": "My perfect weekend involves...", "answer": "Trying new recipes, going for runs, and catching up with friends."},
     {"prompt": "I keep my space...", "answer": "Clean and cozy. I love decorating and making our place feel like home."},
     {"prompt": "My living habits include...", "answer": "Early riser, love cooking healthy meals, and I''m pretty quiet overall."}
   ]'::jsonb, true),

  -- User 8
  (gen_random_uuid(), 'ryan.kumar@uwaterloo.ca', 'Ryan Kumar',
   'https://i.pravatar.cc/300?img=33',
   'Electrical Engineering', '3A',
   'Electrical eng student, into music and sports.',
   '[
     {"prompt": "On a typical weekday, you''ll find me...", "answer": "In labs during the day, playing intramural sports in the evening."},
     {"prompt": "My sleep schedule is...", "answer": "Pretty regular - sleep around midnight, wake up at 7:30am."},
     {"prompt": "When it comes to guests and parties...", "answer": "Love hosting game nights and movie marathons with friends!"}
   ]'::jsonb, true),

  -- User 9
  (gen_random_uuid(), 'amanda.wilson@uwaterloo.ca', 'Amanda Wilson',
   'https://i.pravatar.cc/300?img=20',
   'Psychology', '1A',
   'Psychology major, friendly and easy-going!',
   '[
     {"prompt": "I''m looking for a roommate who...", "answer": "Is friendly, communicative, and respectful of shared spaces."},
     {"prompt": "My ideal living situation is...", "answer": "A comfortable place where we can be friends but also have our own space."},
     {"prompt": "Deal breakers for me are...", "answer": "Passive aggressiveness and poor communication."}
   ]'::jsonb, true),

  -- User 10
  (gen_random_uuid(), 'alex.johnson@uwaterloo.ca', 'Alex Johnson',
   'https://i.pravatar.cc/300?img=14',
   'Nanotechnology Engineering', '2A',
   'Nanotech eng student, big on cleanliness and schedules.',
   '[
     {"prompt": "What makes me a great roommate is...", "answer": "I''m organized, respectful, and always communicate openly about any issues."},
     {"prompt": "I keep my space...", "answer": "Spotless. I have a cleaning schedule and stick to it religiously."},
     {"prompt": "My living habits include...", "answer": "Meal prepping on Sundays, studying with music, and going to bed early."}
   ]'::jsonb, true);
