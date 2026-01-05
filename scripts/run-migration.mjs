import { createClient } from '@supabase/supabase-js';
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('========================================');
  console.log('Running Migration: Add Insurance Records');
  console.log('========================================\n');

  // Read the SQL migration file
  const migrationPath = resolve(__dirname, 'migrations', '001_add_insurance_records.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  // Split into individual statements (simple split by semicolon followed by newlines)
  const statements = migrationSQL
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute.\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\n/g, ' ') + '...';

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Try direct query via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql: statement })
        });

        if (!response.ok) {
          throw new Error(error.message);
        }
      }

      console.log(`✓ [${i + 1}/${statements.length}] ${preview}`);
      successCount++;
    } catch (err) {
      console.log(`✗ [${i + 1}/${statements.length}] ${preview}`);
      console.log(`  Error: ${err.message}\n`);
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log(`Migration Complete: ${successCount} succeeded, ${errorCount} failed`);
  console.log('========================================');
}

// Alternative: Run SQL directly via the Supabase Management API
async function runMigrationDirect() {
  console.log('========================================');
  console.log('Running Migration via Supabase SQL');
  console.log('========================================\n');

  const migrationPath = resolve(__dirname, 'migrations', '001_add_insurance_records.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  // Execute via pg (Supabase's postgres connection)
  const { data, error } = await supabase.from('insurance_records').select('id').limit(1);

  if (error && error.code === '42P01') {
    // Table doesn't exist, we need to run the migration
    console.log('insurance_records table does not exist. Please run the migration SQL manually:');
    console.log('\n1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy and paste the contents of:');
    console.log(`   ${migrationPath}`);
    console.log('3. Click "Run"\n');
    console.log('Migration SQL has been saved to the file above.');
  } else if (error) {
    console.log('Error checking table:', error.message);
  } else {
    console.log('insurance_records table already exists!');

    // Check maintenance_records for new columns
    const { data: maintData, error: maintError } = await supabase
      .from('maintenance_records')
      .select('arrival_mileage')
      .limit(1);

    if (maintError && maintError.message.includes('arrival_mileage')) {
      console.log('maintenance_records needs the arrival_mileage column added.');
    } else {
      console.log('maintenance_records table is up to date.');
    }
  }
}

// Check current state and provide instructions
async function checkAndMigrate() {
  console.log('Checking database state...\n');

  // Check if insurance_records exists
  const { data, error } = await supabase.from('insurance_records').select('id').limit(1);

  if (error && error.code === '42P01') {
    console.log('❌ insurance_records table does NOT exist\n');
    console.log('To create the table, run this SQL in Supabase Dashboard > SQL Editor:\n');
    console.log('----------------------------------------');

    const migrationPath = resolve(__dirname, 'migrations', '001_add_insurance_records.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(migrationSQL);

    console.log('----------------------------------------');
    console.log('\nOr copy from: scripts/migrations/001_add_insurance_records.sql');
  } else if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('✓ insurance_records table exists');

    // Count records
    const { count } = await supabase
      .from('insurance_records')
      .select('*', { count: 'exact', head: true });
    console.log(`  Current records: ${count || 0}`);
  }

  // Check maintenance_records
  const { data: maintData, error: maintError } = await supabase
    .from('maintenance_records')
    .select('*')
    .limit(1);

  if (maintError) {
    console.log('❌ Error checking maintenance_records:', maintError.message);
  } else {
    const hasArrivalMileage = maintData?.[0]?.hasOwnProperty('arrival_mileage');
    if (hasArrivalMileage) {
      console.log('✓ maintenance_records has arrival_mileage column');
    } else {
      console.log('❌ maintenance_records missing arrival_mileage column');
    }
  }
}

checkAndMigrate();
