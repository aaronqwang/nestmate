import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

async function fixGenderValues() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('Fixing gender values...\n');

  // Get all users
  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email, gender')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No users found.');
    return;
  }

  console.log(`Found ${users.length} users. Updating gender values...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    try {
      // Assign a random valid gender
      const newGender = faker.helpers.arrayElement(GENDERS);

      const { error: updateError } = await supabase
        .from('users')
        .update({ gender: newGender })
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ Failed to update ${user.full_name || user.email}:`, updateError.message);
        failCount++;
      } else {
        console.log(`✅ Updated: ${user.full_name || user.email} → ${newGender}`);
        successCount++;
      }

    } catch (error) {
      console.error(`❌ Error updating ${user.full_name || user.email}:`, error);
      failCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`\n✨ Gender filters should now work!`);
}

fixGenderValues();
