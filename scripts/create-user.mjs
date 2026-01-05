import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local manually
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
// Service role key is required for admin operations
const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_KEY in .env.local');
  console.log('Add this line to your .env.local:');
  console.log('SUPABASE_SERVICE_KEY=your_service_role_key_here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUserWithProfile() {
  const userEmail = 'admin@demo.com';
  const userPassword = 'Demo@123!'; // Temporary password - user should change it
  const orgId = '7b002b31-8732-4664-a40e-6b5128c73873'; // Demo Fleet Services org

  console.log('Creating user:', userEmail);

  // 1. Create the auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userEmail,
    password: userPassword,
    email_confirm: true // Auto-confirm email
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    return;
  }

  console.log('Auth user created:', authData.user.id);

  // 2. Create the profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .insert([{
      id: authData.user.id,
      org_id: orgId,
      full_name: 'Demo Admin',
      role: 'Superadmin'
    }])
    .select();

  if (profileError) {
    console.error('Error creating profile:', profileError);
    return;
  }

  console.log('Profile created:', profileData);

  console.log('\n========================================');
  console.log('User created successfully!');
  console.log('========================================');
  console.log('Email:', userEmail);
  console.log('Password:', userPassword);
  console.log('Role: Superadmin');
  console.log('Organization: Demo Fleet Services');
  console.log('========================================');
  console.log('Note: User should change password after first login');
}

createUserWithProfile();
