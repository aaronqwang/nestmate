import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const AVAILABILITY_TERMS = ['Fall', 'Winter', 'Spring', 'Fall & Winter', 'Winter & Spring', 'Full Year'];
const LISTING_TYPES = ['Looking for Roommate', 'Offering Sublet/Lease'];

async function addAvailabilityData() {
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

  console.log('Adding availability and listing type data...\n');

  // Get all users
  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email, availability_term, listing_type')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No users found.');
    return;
  }

  console.log(`Found ${users.length} users. Updating...\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const user of users) {
    try {
      // Check if user already has these fields
      const needsUpdate = !user.availability_term || !user.listing_type;
      
      if (!needsUpdate) {
        console.log(`⏭️  Skipped: ${user.full_name || user.email} (already has data)`);
        skipCount++;
        continue;
      }

      const updates: any = {};
      
      if (!user.availability_term) {
        updates.availability_term = faker.helpers.arrayElement(AVAILABILITY_TERMS);
      }
      
      if (!user.listing_type) {
        updates.listing_type = faker.helpers.arrayElement(LISTING_TYPES);
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ Failed to update ${user.full_name || user.email}:`, updateError.message);
        failCount++;
      } else {
        console.log(`✅ Updated: ${user.full_name || user.email} (${updates.listing_type}, ${updates.availability_term})`);
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
  console.log(`\n✨ Availability and listing type data added!`);
}

addAvailabilityData();
