import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MAJORS = [
  'Accounting and Financial Management',
  'Anthropology',
  'Applied Mathematics',
  'Architectural Engineering',
  'Architecture',
  'Biochemistry',
  'Biology',
  'Biomedical Engineering',
  'Business Administration',
  'Chemical Engineering',
  'Chemistry',
  'Civil Engineering',
  'Computer Engineering',
  'Computer Science',
  'Data Science',
  'Economics',
  'Electrical Engineering',
  'English',
  'Environmental Engineering',
  'Fine Arts',
  'Geography and Environmental Management',
  'Health Sciences',
  'History',
  'Kinesiology',
  'Management Engineering',
  'Mathematical Economics',
  'Mathematics',
  'Mechanical Engineering',
  'Mechatronics Engineering',
  'Nanotechnology Engineering',
  'Philosophy',
  'Physics',
  'Psychology',
  'Software Engineering',
  'Statistics',
  'Systems Design Engineering'
];

const TERMS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Graduate'];

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const AVAILABILITY_TERMS = ['Fall', 'Winter', 'Spring', 'Fall & Winter', 'Winter & Spring', 'Full Year'];

const LISTING_TYPES = ['Looking for Roommate', 'Offering Sublet/Lease'];

const HAS_PLACE_OPTIONS = ['Have a place', 'Need a place', 'Flexible'];

const PROMPTS = [
  'My ideal living situation is...',
  'I\'m looking for a roommate who...',
  'My living habits include...',
  'On a typical weekday, you\'ll find me...',
  'My perfect weekend involves...',
  'I keep my space...',
  'When it comes to guests and parties...',
  'My sleep schedule is...',
  'Deal breakers for me are...',
  'What makes me a great roommate is...'
];

const PROMPT_ANSWERS = {
  'My ideal living situation is...': [
    'A quiet apartment close to campus where I can focus on my studies.',
    'A lively place with roommates who like to socialize and cook together.',
    'Somewhere clean and organized with good natural light.',
    'A cozy spot near transit where we respect each other\'s space.',
    'A sustainable household with shared values about the environment.'
  ],
  'I\'m looking for a roommate who...': [
    'Is clean, respectful, and communicative about any issues.',
    'Shares similar study habits and academic goals.',
    'Enjoys cooking and sharing meals together.',
    'Is chill and easy-going but responsible.',
    'Values quiet time and personal space.'
  ],
  'My living habits include...': [
    'Cooking healthy meals, keeping things tidy, and morning workouts.',
    'Late night studying, listening to music, and weekend cooking.',
    'Early mornings, meal prepping, and keeping a clean space.',
    'Regular cleaning schedule, quiet evenings, and occasional guests.',
    'Gaming sessions, ordering takeout, and keeping my room organized.'
  ],
  'On a typical weekday, you\'ll find me...': [
    'In class during the day, at the library studying, then relaxing at home.',
    'Working out in the morning, attending lectures, then working on projects.',
    'At labs and lectures, grabbing coffee with friends, then studying.',
    'Attending classes, working part-time, and doing homework.',
    'In the library most of the day, then cooking dinner and unwinding.'
  ],
  'My perfect weekend involves...': [
    'Sleeping in, brunch with friends, and catching up on shows.',
    'Hiking or exploring the city, then relaxing at home.',
    'Meal prepping, studying ahead, and hanging out with roommates.',
    'Playing sports, going out with friends, and maybe a house party.',
    'Trying new restaurants, going to the gym, and doing laundry.'
  ],
  'I keep my space...': [
    'Very clean and organized. Everything has its place.',
    'Moderately tidy. I clean regularly but I\'m not obsessive.',
    'Clean and minimalist. I don\'t like clutter.',
    'Pretty organized with a weekly cleaning routine.',
    'Neat enough - I clean up after myself but I\'m not a neat freak.'
  ],
  'When it comes to guests and parties...': [
    'I rarely host but I\'m fine with occasional guests.',
    'I love having friends over on weekends but always give notice.',
    'Prefer keeping it quiet - maybe small gatherings occasionally.',
    'I host game nights and study sessions pretty regularly.',
    'Not a party person but okay with guests as long as there\'s communication.'
  ],
  'My sleep schedule is...': [
    'Pretty regular - in bed by 11pm, up at 7am.',
    'Night owl here - usually up until 2am, wake around 10am.',
    'Early bird! Asleep by 10pm, up at 6am.',
    'Depends on my schedule but usually midnight to 8am.',
    'Inconsistent due to co-op/classes but I\'m quiet either way.'
  ],
  'Deal breakers for me are...': [
    'Smoking, excessive noise late at night, and poor hygiene.',
    'Lack of communication and passive aggressive behavior.',
    'Messiness in shared spaces and not doing dishes.',
    'Disrespecting boundaries and not paying bills on time.',
    'Drama, unreliability, and not cleaning up after yourself.'
  ],
  'What makes me a great roommate is...': [
    'I\'m responsible, clean, and always communicate openly.',
    'I\'m laid back, respectful, and easy to get along with.',
    'I pay bills on time, respect quiet hours, and help with chores.',
    'I\'m friendly, organized, and good at resolving conflicts.',
    'I\'m considerate, reliable, and keep shared spaces clean.'
  ]
};

function generateRandomPrompts(count: number = 3) {
  const shuffledPrompts = [...PROMPTS].sort(() => Math.random() - 0.5);
  const selectedPrompts = shuffledPrompts.slice(0, count);
  
  return selectedPrompts.map(prompt => ({
    prompt,
    answer: faker.helpers.arrayElement(PROMPT_ANSWERS[prompt as keyof typeof PROMPT_ANSWERS])
  }));
}

function generateBio() {
  const templates = [
    `${faker.helpers.arrayElement(['Looking for', 'Searching for', 'Seeking'])} a ${faker.helpers.arrayElement(['clean', 'quiet', 'friendly', 'responsible', 'chill'])} roommate for ${faker.helpers.arrayElement(['Fall', 'Winter', 'Spring'])} term!`,
    `${faker.helpers.arrayElement(['Engineering', 'Math', 'Science', 'Arts'])} student, ${faker.helpers.arrayElement(['into gaming and coding', 'love cooking and fitness', 'big on studying and Netflix', 'enjoy music and sports'])}!`,
    `${faker.helpers.arrayElement(['Easy-going', 'Friendly', 'Responsible', 'Mature'])} student looking for roommates!`,
    `${faker.helpers.arrayElement(['Co-op', 'Exchange', 'International'])} student seeking ${faker.helpers.arrayElement(['short-term', 'long-term', '4-month'])} housing!`,
  ];
  
  return faker.helpers.arrayElement(templates);
}

async function createFakeProfiles(count: number = 10) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!');
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log(`Creating ${count} fake profiles...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@uwaterloo.ca`;
    const fullName = `${firstName} ${lastName}`;
    const password = 'TestPassword123!';
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName
        }
      });

      if (authError) {
        console.error(`❌ Failed to create auth user for ${email}:`, authError.message);
        failCount++;
        continue;
      }

      // Generate random profile picture (using DiceBear API for consistent avatars)
      const avatarStyle = faker.helpers.arrayElement(['adventurer', 'avataaars', 'big-smile', 'bottts', 'personas']);
      const profilePhoto = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${email}`;
      
      // Generate additional photos (2-4 photos per profile)
      const photoCount = faker.number.int({ min: 2, max: 4 });
      const additionalPhotos = Array.from({ length: photoCount }, (_, idx) => {
        const photoStyle = faker.helpers.arrayElement(['adventurer', 'avataaars', 'big-smile', 'bottts', 'personas', 'lorelei', 'micah', 'pixel-art']);
        return `https://api.dicebear.com/7.x/${photoStyle}/svg?seed=${email}-${idx}`;
      });

      // Update user profile with fake data
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          profile_photo: profilePhoto,
          photos: additionalPhotos,
          major: faker.helpers.arrayElement(MAJORS),
          term: faker.helpers.arrayElement(TERMS),
          gender: faker.helpers.arrayElement(GENDERS),
          availability_term: faker.helpers.arrayElement(AVAILABILITY_TERMS),
          listing_type: faker.helpers.arrayElement(LISTING_TYPES),
          has_place: faker.helpers.arrayElement(HAS_PLACE_OPTIONS),
          bio: generateBio(),
          prompts: generateRandomPrompts(3),
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error(`❌ Failed to update profile for ${email}:`, updateError.message);
        failCount++;
      } else {
        successCount++;
        console.log(`✅ Created: ${fullName} (${email})`);
      }

    } catch (error) {
      console.error(`❌ Error creating ${email}:`, error);
      failCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully created: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`\n🔑 Password for all users: TestPassword123!`);
}

// Get count from command line args or default to 10
const count = parseInt(process.argv[2]) || 10;
createFakeProfiles(count);
