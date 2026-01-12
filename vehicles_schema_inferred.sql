CREATE TABLE vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID,
  name TEXT,
  year INTEGER,
  trim TEXT,
  plate TEXT,
  vin TEXT,
  status TEXT,
  location TEXT,
  mileage INTEGER,
  daily_rate TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);