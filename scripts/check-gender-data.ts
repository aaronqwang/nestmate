import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkGenderData() {
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

  console.log('Checking gender distribution in database...\n');

  // Get all users with their gender
  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email, gender, term')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No users found.');
    return;
  }

  console.log(`Total users: ${users.length}\n`);

  // Count by gender
  const genderCounts: Record<string, number> = {};
  const noGender: any[] = [];

  users.forEach(user => {
    if (user.gender) {
      genderCounts[user.gender] = (genderCounts[user.gender] || 0) + 1;
    } else {
      noGender.push(user);
    }
  });

  console.log('📊 Gender Distribution:');
  Object.entries(genderCounts).forEach(([gender, count]) => {
    console.log(`   ${gender}: ${count}`);
  });

  if (noGender.length > 0) {
    console.log(`   ❌ No gender set: ${noGender.length}`);
    console.log('\nUsers without gender:');
    noGender.forEach(user => {
      console.log(`   - ${user.full_name || user.email}`);
    });
  }

  // Count by term
  const termCounts: Record<string, number> = {};
  const noTerm: any[] = [];

  users.forEach(user => {
    if (user.term) {
      termCounts[user.term] = (termCounts[user.term] || 0) + 1;
    } else {
      noTerm.push(user);
    }
  });

  console.log('\n📊 Term Distribution:');
  Object.entries(termCounts).forEach(([term, count]) => {
    console.log(`   ${term}: ${count}`);
  });

  if (noTerm.length > 0) {
    console.log(`   ❌ No term set: ${noTerm.length}`);
    console.log('\nUsers without term:');
    noTerm.forEach(user => {
      console.log(`   - ${user.full_name || user.email}`);
    });
  }
}

checkGenderData();
