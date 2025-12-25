import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const HAS_PLACE_OPTIONS = ['Have a place', 'Need a place', 'Flexible'];

async function addHousingStatus() {
  console.log('Adding housing status to existing profiles...');

  // Get all users without has_place
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('id, has_place')
    .or('has_place.is.null');

  if (fetchError) {
    console.error('Error fetching users:', fetchError);
    return;
  }

  if (!users || users.length === 0) {
    console.log('All users already have housing status!');
    return;
  }

  console.log(`Found ${users.length} users without housing status`);

  // Update each user
  let successCount = 0;
  let errorCount = 0;

  for (const user of users) {
    const randomHasPlace = HAS_PLACE_OPTIONS[Math.floor(Math.random() * HAS_PLACE_OPTIONS.length)];
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ has_place: randomHasPlace })
      .eq('id', user.id);

    if (updateError) {
      console.error(`Error updating user ${user.id}:`, updateError);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`\nCompleted!`);
  console.log(`✅ Successfully updated: ${successCount} users`);
  console.log(`❌ Failed: ${errorCount} users`);
}

addHousingStatus();
