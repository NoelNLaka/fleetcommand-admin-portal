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
// Use service role key from env to bypass RLS (add SUPABASE_SERVICE_KEY to .env.local)
const supabaseKey = env.SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createOrganization() {
  // First, let's see existing organizations
  console.log('Fetching existing organizations...');
  const { data: existing, error: fetchError } = await supabase
    .from('organizations')
    .select('*');

  if (fetchError) {
    console.error('Error fetching organizations:', fetchError);
  } else {
    console.log('Existing organizations:', existing);
  }

  // Create a new organization
  const newOrg = {
    name: 'Demo Fleet Services',
    plan_name: 'Pro'
  };

  console.log('\nCreating new organization:', newOrg);

  const { data, error } = await supabase
    .from('organizations')
    .insert([newOrg])
    .select();

  if (error) {
    console.error('Error creating organization:', error);
  } else {
    console.log('Successfully created organization:', data);
  }

  // Fetch all organizations again to confirm
  const { data: allOrgs, error: allError } = await supabase
    .from('organizations')
    .select('*');

  if (!allError) {
    console.log('\nAll organizations now:', allOrgs);
  }
}

createOrganization();
