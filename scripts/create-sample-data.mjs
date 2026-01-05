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

const ORG_ID = '7b002b31-8732-4664-a40e-6b5128c73873'; // Demo Fleet Services

async function createVehicles() {
  console.log('Creating vehicles...\n');

  const vehicles = [
    {
      org_id: ORG_ID,
      name: '2024 Tesla Model 3',
      year: '2024',
      trim: 'Long Range',
      plate: 'DEMO-001',
      vin: '5YJ3E1EA1PF000001',
      status: 'available',
      location: 'Los Angeles, CA',
      mileage: '12500',
      daily_rate: '89.00',
      image_url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=300'
    },
    {
      org_id: ORG_ID,
      name: '2023 BMW X5',
      year: '2023',
      trim: 'xDrive40i',
      plate: 'DEMO-002',
      vin: '5UXCR6C55P9000002',
      status: 'rented',
      location: 'San Diego, CA',
      mileage: '28400',
      daily_rate: '129.00',
      image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=300'
    },
    {
      org_id: ORG_ID,
      name: '2024 Toyota Camry',
      year: '2024',
      trim: 'XSE',
      plate: 'DEMO-003',
      vin: '4T1BZ1HK5PU000003',
      status: 'available',
      location: 'Los Angeles, CA',
      mileage: '8200',
      daily_rate: '65.00',
      image_url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=300'
    },
    {
      org_id: ORG_ID,
      name: '2023 Ford Mustang',
      year: '2023',
      trim: 'GT Premium',
      plate: 'DEMO-004',
      vin: '1FA6P8CF5P5000004',
      status: 'maintenance',
      location: 'Service Center',
      mileage: '15800',
      daily_rate: '110.00',
      image_url: 'https://images.unsplash.com/photo-1584345604476-8ec5f82d718c?auto=format&fit=crop&q=80&w=300'
    }
  ];

  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicles)
    .select();

  if (error) {
    console.error('Error creating vehicles:', error);
    return null;
  }

  console.log('Vehicles created:');
  data.forEach(v => console.log(`  - ${v.name} (${v.plate}) - ${v.status}`));
  return data;
}

async function createBookings(vehicles) {
  console.log('\nCreating bookings...\n');

  // Get the customers we created earlier
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name')
    .eq('org_id', ORG_ID);

  if (!customers || customers.length < 2) {
    console.error('Need at least 2 customers to create bookings');
    return null;
  }

  const sarahId = customers.find(c => c.name === 'Sarah Johnson')?.id;
  const michaelId = customers.find(c => c.name === 'Michael Chen')?.id;

  const bmwId = vehicles.find(v => v.name.includes('BMW'))?.id;
  const teslaId = vehicles.find(v => v.name.includes('Tesla'))?.id;
  const camryId = vehicles.find(v => v.name.includes('Camry'))?.id;

  const bookings = [
    {
      org_id: ORG_ID,
      customer_id: sarahId,
      vehicle_id: bmwId,
      start_date: '2026-01-02',
      end_date: '2026-01-09',
      duration_days: 7,
      status: 'Active',
      payment_status: 'Paid'
    },
    {
      org_id: ORG_ID,
      customer_id: michaelId,
      vehicle_id: teslaId,
      start_date: '2026-01-10',
      end_date: '2026-01-15',
      duration_days: 5,
      status: 'Confirmed',
      payment_status: 'Unpaid'
    },
    {
      org_id: ORG_ID,
      customer_id: sarahId,
      vehicle_id: camryId,
      start_date: '2025-12-20',
      end_date: '2025-12-27',
      duration_days: 7,
      status: 'Completed',
      payment_status: 'Paid'
    }
  ];

  const { data, error } = await supabase
    .from('bookings')
    .insert(bookings)
    .select(`
      *,
      customer:customers(name),
      vehicle:vehicles(name)
    `);

  if (error) {
    console.error('Error creating bookings:', error);
    return null;
  }

  console.log('Bookings created:');
  data.forEach(b => {
    console.log(`  - ${b.customer?.name} renting ${b.vehicle?.name}`);
    console.log(`    ${b.start_date} to ${b.end_date} (${b.duration_days} days) - ${b.status}`);
  });
  return data;
}

async function createMaintenanceRecords(vehicles) {
  console.log('\nCreating maintenance records...\n');

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
      current_step: 'In Shop',
      scheduled_date: '2026-01-04'
    },
    {
      org_id: ORG_ID,
      vehicle_id: bmwId,
      service_type: 'Oil Change & Filter',
      status: 'scheduled',
      assignee_name: 'Mike Wilson',
      cost_estimate: '185.00',
      current_step: 'Scheduled',
      scheduled_date: '2026-01-12'
    },
    {
      org_id: ORG_ID,
      vehicle_id: teslaId,
      service_type: 'Tire Rotation',
      status: 'done',
      assignee_name: 'Tony Martinez',
      cost_estimate: '75.00',
      current_step: 'Done',
      scheduled_date: '2025-12-28'
    },
    {
      org_id: ORG_ID,
      vehicle_id: mustangId,
      service_type: 'Annual Inspection',
      status: 'overdue',
      assignee_name: 'Service Dept',
      cost_estimate: '120.00',
      current_step: 'Scheduled',
      scheduled_date: '2025-12-15'
    }
  ];

  const { data, error } = await supabase
    .from('maintenance_records')
    .insert(maintenanceRecords)
    .select(`
      *,
      vehicle:vehicles(name)
    `);

  if (error) {
    console.error('Error creating maintenance records:', error);
    return null;
  }

  console.log('Maintenance records created:');
  data.forEach(m => {
    console.log(`  - ${m.vehicle?.name}: ${m.service_type}`);
    console.log(`    Status: ${m.status} | Assignee: ${m.assignee_name} | Est: $${m.cost_estimate}`);
  });
  return data;
}

async function main() {
  console.log('========================================');
  console.log('Creating sample data for Demo Fleet Services');
  console.log('========================================\n');

  // Create vehicles
  const vehicles = await createVehicles();
  if (!vehicles) return;

  // Create bookings
  await createBookings(vehicles);

  // Create maintenance records
  await createMaintenanceRecords(vehicles);

  console.log('\n========================================');
  console.log('Sample data creation complete!');
  console.log('========================================');
  console.log('\nSummary:');
  console.log('  - 4 vehicles added');
  console.log('  - 3 bookings created');
  console.log('  - 4 maintenance records created');
  console.log('\nLogin as admin@demo.com to view the data.');
}

main();
