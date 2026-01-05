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
const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createCustomers() {
  const orgId = '7b002b31-8732-4664-a40e-6b5128c73873'; // Demo Fleet Services

  const customers = [
    {
      org_id: orgId,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 234-5678',
      address: '456 Oak Avenue, Los Angeles, CA 90012',
      license_number: 'D1234567',
      license_state: 'CA',
      license_expiry: '2027-08-15',
      status: 'active'
    },
    {
      org_id: orgId,
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+1 (555) 876-5432',
      address: '789 Pine Street, San Diego, CA 92101',
      license_number: 'D7654321',
      license_state: 'CA',
      license_expiry: '2026-11-20',
      status: 'active'
    }
  ];

  console.log('Creating customers for Demo Fleet Services org...\n');

  const { data, error } = await supabase
    .from('customers')
    .insert(customers)
    .select();

  if (error) {
    console.error('Error creating customers:', error);
    return;
  }

  console.log('Customers created successfully:');
  data.forEach((customer, i) => {
    console.log(`\n${i + 1}. ${customer.name}`);
    console.log(`   ID: ${customer.id}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Phone: ${customer.phone}`);
    console.log(`   License: ${customer.license_state} ${customer.license_number}`);
  });

  // Verify multi-tenancy - show customers by org
  console.log('\n========================================');
  console.log('Verifying multi-tenancy isolation...');
  console.log('========================================\n');

  const { data: allCustomers } = await supabase
    .from('customers')
    .select('id, name, org_id');

  // Group by org_id
  const byOrg = {};
  allCustomers?.forEach(c => {
    if (!byOrg[c.org_id]) byOrg[c.org_id] = [];
    byOrg[c.org_id].push(c.name);
  });

  for (const [orgId, names] of Object.entries(byOrg)) {
    const orgName = orgId === '7b002b31-8732-4664-a40e-6b5128c73873'
      ? 'Demo Fleet Services'
      : 'Actuon Fleet Solutions';
    console.log(`${orgName} (${orgId.slice(0, 8)}...):`);
    names.forEach(name => console.log(`  - ${name}`));
    console.log('');
  }
}

createCustomers();
