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

const ORG_ID = '7b002b31-8732-4664-a40e-6b5128c73873'; // Demo Fleet Services

async function createInsuranceData() {
  console.log('========================================');
  console.log('Creating Insurance Sample Data');
  console.log('========================================\n');

  // Fetch vehicles for Demo Fleet Services
  console.log('Fetching vehicles...');
  const { data: vehicles, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('id, name, plate')
    .eq('org_id', ORG_ID);

  if (vehiclesError) {
    console.error('Error fetching vehicles:', vehiclesError);
    return;
  }

  if (!vehicles || vehicles.length === 0) {
    console.log('No vehicles found for Demo Fleet Services');
    return;
  }

  console.log(`Found ${vehicles.length} vehicles\n`);

  // Create insurance records for each vehicle
  const today = new Date();
  const insuranceRecords = [];

  vehicles.forEach((vehicle, index) => {
    // Insurance - varies per vehicle
    const insuranceExpiry = new Date(today);
    if (index === 0) {
      // First vehicle - expired
      insuranceExpiry.setDate(today.getDate() - 15);
    } else if (index === 1) {
      // Second vehicle - expiring soon
      insuranceExpiry.setDate(today.getDate() + 20);
    } else {
      // Others - valid
      insuranceExpiry.setMonth(today.getMonth() + 6 + index);
    }

    insuranceRecords.push({
      org_id: ORG_ID,
      vehicle_id: vehicle.id,
      record_type: 'insurance',
      date_renewed: new Date(insuranceExpiry.getFullYear() - 1, insuranceExpiry.getMonth(), insuranceExpiry.getDate()).toISOString().split('T')[0],
      expiry_date: insuranceExpiry.toISOString().split('T')[0],
      provider: ['State Farm', 'Geico', 'Progressive', 'Allstate'][index % 4],
      policy_number: `POL-${100000 + index}`,
      cost: 800 + (index * 150),
      notes: null
    });

    // Registration
    const regExpiry = new Date(today);
    if (index === 2) {
      // One vehicle with expired registration
      regExpiry.setDate(today.getDate() - 5);
    } else {
      regExpiry.setMonth(today.getMonth() + 8 + index);
    }

    insuranceRecords.push({
      org_id: ORG_ID,
      vehicle_id: vehicle.id,
      record_type: 'registration',
      date_renewed: new Date(regExpiry.getFullYear() - 1, regExpiry.getMonth(), regExpiry.getDate()).toISOString().split('T')[0],
      expiry_date: regExpiry.toISOString().split('T')[0],
      provider: 'DMV',
      policy_number: `REG-${vehicle.plate}`,
      cost: 150 + (index * 25),
      notes: null
    });

    // Safety sticker (only for some vehicles)
    if (index < 3) {
      const stickerExpiry = new Date(today);
      if (index === 1) {
        // Expiring soon
        stickerExpiry.setDate(today.getDate() + 10);
      } else {
        stickerExpiry.setMonth(today.getMonth() + 10 + index);
      }

      insuranceRecords.push({
        org_id: ORG_ID,
        vehicle_id: vehicle.id,
        record_type: 'safety_sticker',
        date_renewed: new Date(stickerExpiry.getFullYear() - 1, stickerExpiry.getMonth(), stickerExpiry.getDate()).toISOString().split('T')[0],
        expiry_date: stickerExpiry.toISOString().split('T')[0],
        provider: 'State Inspection',
        policy_number: `INS-${200000 + index}`,
        cost: 35,
        notes: null
      });
    }
  });

  console.log(`Creating ${insuranceRecords.length} insurance records...\n`);

  const { data, error } = await supabase
    .from('insurance_records')
    .insert(insuranceRecords)
    .select(`
      *,
      vehicle: vehicles(name, plate)
    `);

  if (error) {
    console.error('Error creating insurance records:', error);
    console.log('\nMake sure you have run the migration SQL first!');
    console.log('Run this SQL in Supabase Dashboard > SQL Editor:');
    console.log('scripts/migrations/001_add_insurance_records.sql');
    return;
  }

  console.log('Insurance records created successfully:\n');

  // Group by vehicle for display
  const byVehicle = {};
  data.forEach(record => {
    const vName = record.vehicle?.name || 'Unknown';
    if (!byVehicle[vName]) byVehicle[vName] = [];
    byVehicle[vName].push(record);
  });

  for (const [vehicleName, records] of Object.entries(byVehicle)) {
    console.log(`${vehicleName}:`);
    records.forEach(r => {
      const expiry = new Date(r.expiry_date);
      const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      const status = daysLeft < 0 ? 'EXPIRED' : daysLeft <= 30 ? 'EXPIRING SOON' : 'VALID';
      console.log(`  - ${r.record_type}: ${r.expiry_date} (${status})`);
    });
    console.log('');
  }

  console.log('========================================');
  console.log('Sample data creation complete!');
  console.log('========================================');
}

createInsuranceData();
