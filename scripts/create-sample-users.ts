import { createClient } from '@supabase/supabase-js';

// Sample users data
const sampleUsers = [
  {
    email: 'emily.chen@uwaterloo.ca',
    password: 'TestPassword123!',
    full_name: 'Emily Chen',
    major: 'Computer Science',
    term: '2B',
    bio: 'Looking for a clean and quiet roommate for Spring term!',
    prompts: [
      { prompt: "My ideal living situation is...", answer: "A quiet apartment close to campus where I can focus on my studies but also have fun on weekends." },
      { prompt: "I keep my space...", answer: "Very organized and clean. I do dishes right away and vacuum weekly." },
      { prompt: "My sleep schedule is...", answer: "Usually in bed by 11pm, up at 7am for morning classes." }
    ]
  },
  {
    email: 'james.park@uwaterloo.ca',
    password: 'TestPassword123!',
    full_name: 'James Park',
    major: 'Mechanical Engineering',
    term: '3A',
    bio: 'Chill engineering student looking for roommates!',
    prompts: [
      { prompt: "My living habits include...", answer: "I cook a lot and love sharing meals. Pretty social but respect quiet hours." },
      { prompt: "On a typical weekday, you'll find me...", answer: "At the gym in the morning, in class, then working on projects or gaming." },
      { prompt: "When it comes to guests and parties...", answer: "I like having friends over on weekends but always give a heads up." }
    ]
  },
  {
    email: 'sarah.williams@uwaterloo.ca',
    password: 'TestPassword123!',
    full_name: 'Sarah Williams',
    major: 'Mathematics',
    term: '1B',
    bio: 'First year math student seeking a study buddy roommate!',
    prompts: [
      { prompt: "I'm looking for a roommate who...", answer: "Is also serious about academics but knows how to have a good time." },
      { prompt: "My perfect weekend involves...", answer: "Brunch with friends, studying at a cafe, and Netflix marathons." },
      { prompt: "Deal breakers for me are...", answer: "Smoking, loud music late at night, and messiness." }
    ]
  },
  {
    email: 'michael.zhang@uwaterloo.ca',
    password: 'TestPassword123!',
    full_name: 'Michael Zhang',
    major: 'Software Engineering',
    term: '2A',
    bio: 'Software eng student, into gaming and coding!',
    prompts: [
      { prompt: "What makes me a great roommate is...", answer: "I'm low maintenance, always pay rent on time, and I can fix your computer." },
      { prompt: "My sleep schedule is...", answer: "Night owl - usually coding until 2am, wake up around 10am." },
      { prompt: "I keep my space...", answer: "Moderately clean. I clean up after myself but I'm not obsessive about it." }
    ]
  },
  {
    email: 'olivia.martinez@uwaterloo.ca',
    password: 'TestPassword123!',
    full_name: 'Olivia Martinez',
    major: 'Environmental Engineering',
    term: '3B',
    bio: 'Eco-conscious student looking for like-minded roommates!',
    prompts: [
      { prompt: "My ideal living situation is...", answer: "A sustainable household with recycling, composting, and minimal waste." },
      { prompt: "My living habits include...", answer: "Vegetarian cooking, yoga in the mornings, and lots of plants!" },
      { prompt: "I'm looking for a roommate who...", answer: "Cares about the environment and wants to reduce our carbon footprint together." }
    ]
  },
  {
    email: 'david.lee@uwaterloo.ca',
    password: 'TestPassword123!',
    full_name: 'David Lee',
    major: 'Business Administration',
    term: '4A',
    bio: 'Final year business student, mature and responsible.',
    prompts: [
      { prompt: "On a typical weekday, you'll find me...", answer: "Either at networking events, studying at the library, or working on my startup." },
      { prompt: "When it comes to guests and parties...", answer: "Rarely host, prefer quiet evenings. I'm usually out socializing elsewhere." },
      { prompt: "What makes me a great roommate is...", answer: "Very responsible, organized, and easy to communicate with." }
    ]
  },
  {
    email: 'sophia.brown@uwaterloo.ca',
    password: 'TestPassword123!',
    full_name: 'Sophia Brown',
    major: 'Health Sciences',
    term: '2B',
    bio: 'Health sci student, love cooking and staying active!',
    prompts: [
      { prompt: "My perfect weekend involves...", answer: "Trying new recipes, going for runs, and catching up with friends." },
      { prompt: "I keep my space...", answer: "Clean and cozy. I love decorating and making our place feel like home." },
      { prompt: "My living habits include...", answer: "Early riser, love cooking healthy meals, and I'm pretty quiet overall." }
    ]
  },
  {
    email: 'ryan.kumar@uwaterloo.ca',
    password: 'TestPassword123!',
    full_name: 'Ryan Kumar',
    major: 'Electrical Engineering',
    term: '3A',
    bio: 'Electrical eng student, into music and sports.',
    prompts: [
      { prompt: "On a typical weekday, you'll find me...", answer: "In labs during the day, playing intramural sports in the evening." },
      { prompt: "My sleep schedule is...", answer: "Pretty regular - sleep around midnight, wake up at 7:30am." },
      { prompt: "When it comes to guests and parties...", answer: "Love hosting game nights and movie marathons with friends!" }
    ]
  },
  {
    email: 'amanda.wilson@uwaterloo.ca',
    password: 'TestPassword123!',
    full_name: 'Amanda Wilson',
    major: 'Psychology',
    term: '1A',
    bio: 'Psychology major, friendly and easy-going!',
    prompts: [
      { prompt: "I'm looking for a roommate who...", answer: "Is friendly, communicative, and respectful of shared spaces." },
      { prompt: "My ideal living situation is...", answer: "A comfortable place where we can be friends but also have our own space." },
      { prompt: "Deal breakers for me are...", answer: "Passive aggressiveness and poor communication." }
    ]
  },
  {
    email: 'alex.johnson@uwaterloo.ca',
    password: 'TestPassword123!',
    full_name: 'Alex Johnson',
    major: 'Nanotechnology Engineering',
    term: '2A',
    bio: 'Nanotech eng student, big on cleanliness and schedules.',
    prompts: [
      { prompt: "What makes me a great roommate is...", answer: "I'm organized, respectful, and always communicate openly about any issues." },
      { prompt: "I keep my space...", answer: "Spotless. I have a cleaning schedule and stick to it religiously." },
      { prompt: "My living habits include...", answer: "Meal prepping on Sundays, studying with music, and going to bed early." }
    ]
  }
];

async function createSampleUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Need service role key for admin actions
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('Creating sample users...\n');

  for (const userData of sampleUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name
        }
      });

      if (authError) {
        console.error(`❌ Failed to create auth user for ${userData.email}:`, authError.message);
        continue;
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: userData.full_name,
          profile_photo: `https://i.pravatar.cc/300?u=${userData.email}`,
          major: userData.major,
          term: userData.term,
          bio: userData.bio,
          prompts: userData.prompts,
          profile_completed: true
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error(`❌ Failed to update profile for ${userData.email}:`, updateError.message);
      } else {
        console.log(`✅ Created user: ${userData.full_name} (${userData.email})`);
      }

    } catch (error) {
      console.error(`❌ Error creating ${userData.email}:`, error);
    }
  }

  console.log('\n✅ Sample users creation complete!');
  console.log('Password for all users: TestPassword123!');
}

createSampleUsers();
