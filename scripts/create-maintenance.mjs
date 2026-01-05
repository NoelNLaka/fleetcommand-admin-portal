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

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

const ORG_ID = '7b002b31-8732-4664-a40e-6b5128c73873';

async function createMaintenanceRecords() {
  console.log('Fetching vehicles...');

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, name')
    .eq('org_id', ORG_ID);

  if (!vehicles || vehicles.length === 0) {
    console.error('No vehicles found');
    return;
  }

  const mustangId = vehicles.find(v => v.name.includes('Mustang'))?.id;
  const bmwId = vehicles.find(v => v.name.includes('BMW'))?.id;
  const teslaId = vehicles.find(v => v.name.includes('Tesla'))?.id;

  const maintenanceRecords = [
    {
      org_id: ORG_ID,
      vehicle_id: mustangId,
      service_type: 'Brake Pad Replacement',
      status: 'in_shop',
      assignee_name: 'Tony Martinez',
      cost_estimate: '450.00',
      scheduled_date: '2026-01-04'
    },
    {
      org_id: ORG_ID,
      vehicle_id: bmwId,
      service_type: 'Oil Change & Filter',
      status: 'scheduled',
      assignee_name: 'Mike Wilson',
      cost_estimate: '185.00',
      scheduled_date: '2026-01-12'
    },
    {
      org_id: ORG_ID,
      vehicle_id: teslaId,
      service_type: 'Tire Rotation',
      status: 'done',
      assignee_name: 'Tony Martinez',
      cost_estimate: '75.00',
      scheduled_date: '2025-12-28'
    },
    {
      org_id: ORG_ID,
      vehicle_id: mustangId,
      service_type: 'Annual Inspection',
      status: 'overdue',
      assignee_name: 'Service Dept',
      cost_estimate: '120.00',
      scheduled_date: '2025-12-15'
    }
  ];

  console.log('Creating maintenance records...\n');

  const { data, error } = await supabase
    .from('maintenance_records')
    .insert(maintenanceRecords)
    .select(`
      *,
      vehicle:vehicles(name)
    `);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Maintenance records created:');
  data.forEach(m => {
    console.log(`  - ${m.vehicle?.name}: ${m.service_type}`);
    console.log(`    Status: ${m.status} | Assignee: ${m.assignee_name} | Est: $${m.cost_estimate}`);
  });
}

createMaintenanceRecords();
