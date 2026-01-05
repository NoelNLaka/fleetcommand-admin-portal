import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local
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
const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;

// Extract project ref from URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

async function executeSql(sql, description) {
  console.log(`Executing: ${description}...`);

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  });

  return response;
}

async function runMigration() {
  console.log('========================================');
  console.log('Executing Migration Scripts');
  console.log('========================================\n');

  // Step 1: Create insurance_records table
  console.log('Step 1: Creating insurance_records table...');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS insurance_records (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      org_id UUID NOT NULL,
      vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('insurance', 'registration', 'safety_sticker')),
      date_renewed DATE NOT NULL,
      expiry_date DATE NOT NULL,
      provider VARCHAR(255),
      policy_number VARCHAR(100),
      cost DECIMAL(10, 2),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Using supabase-js to try creating via a workaround
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Try inserting a test record to force table creation (this won't work, but let's see)
  // We need to use the SQL Editor approach

  console.log('\n========================================');
  console.log('MANUAL STEP REQUIRED');
  console.log('========================================\n');
  console.log('Please run the following SQL in your Supabase Dashboard:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
  console.log('2. Copy and paste the SQL below, then click "Run"\n');
  console.log('========================================\n');

  const migrationPath = resolve(__dirname, 'migrations', '001_add_insurance_records.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  console.log(migrationSQL);

  console.log('\n========================================');
  console.log('After running the SQL, press Enter to continue...');
  console.log('========================================\n');
}

runMigration();
