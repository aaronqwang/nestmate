import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const TERMS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Graduate'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

async function updateExistingProfiles() {
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

  console.log('Fetching existing profiles...\n');

  // Get all users
  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email, gender, term')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No users found to update.');
    return;
  }

  console.log(`Found ${users.length} users. Updating...\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const user of users) {
    try {
      // Check if user already has gender and term
      const needsUpdate = !user.gender || !user.term;
      
      if (!needsUpdate) {
        console.log(`⏭️  Skipped: ${user.full_name || user.email} (already has gender and term)`);
        skipCount++;
        continue;
      }

      const updates: any = {};
      
      if (!user.gender) {
        updates.gender = faker.helpers.arrayElement(GENDERS);
      }
      
      if (!user.term) {
        updates.term = faker.helpers.arrayElement(TERMS);
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ Failed to update ${user.full_name || user.email}:`, updateError.message);
        failCount++;
      } else {
        const updatedFields = Object.keys(updates).join(', ');
        console.log(`✅ Updated: ${user.full_name || user.email} (${updatedFields})`);
        successCount++;
      }

    } catch (error) {
      console.error(`❌ Error updating ${user.full_name || user.email}:`, error);
      failCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`⏭️  Skipped (already complete): ${skipCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`\n✨ Your filters should now work with existing profiles!`);
}

updateExistingProfiles();
