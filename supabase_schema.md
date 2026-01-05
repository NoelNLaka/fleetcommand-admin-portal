# Fleet Management System - Supabase Schema

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLEET MANAGEMENT SYSTEM                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│     OWNERS      │
├─────────────────┤
│ id (PK)         │
│ first_name      │
│ last_name       │
│ address         │
│ email           │
│ phone_number    │
│ region          │
│ department      │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│    VEHICLES     │
├─────────────────┤
│ id (PK)         │
│ owner_id (FK)───┼──────────────────┐
│ license_number  │                  │
│ make            │                  │
│ model           │                  │
│ model_year      │                  │
│ maintenance_    │                  │
│   interval      │                  │
│ created_at      │                  │
│ updated_at      │                  │
└────────┬────────┘                  │
         │                           │
    ┌────┴────┐                      │
    │         │                      │
    │ 1:N     │ 1:N                  │
    ▼         ▼                      │
┌─────────────────┐  ┌─────────────────┐
│   INSURANCE     │  │  MAINTENANCE    │
│    RECORDS      │  │    RECORDS      │
├─────────────────┤  ├─────────────────┤
│ id (PK)         │  │ id (PK)         │
│ vehicle_id (FK) │  │ vehicle_id (FK) │
│ date_renewed    │  │ arrival_mileage │
│ expiry_date     │  │ maintenance_    │
│ created_at      │  │   activity      │
│ updated_at      │  │ maintenance_date│
└─────────────────┘  │ created_at      │
                     │ updated_at      │
                     └─────────────────┘
```

## Entity Relationships

| Relationship | Type | Description |
|--------------|------|-------------|
| owners → vehicles | 1:N | One owner can have many vehicles |
| vehicles → insurance_records | 1:N | One vehicle can have many insurance records |
| vehicles → maintenance_records | 1:N | One vehicle can have many maintenance records |

---

## SQL Schema

Copy and paste the following SQL into your Supabase SQL Editor:

```sql
-- ============================================================
-- FLEET MANAGEMENT SYSTEM - SUPABASE SCHEMA
-- ============================================================
-- Architecture:
--   owners (1) ──────< vehicles (many)
--   vehicles (1) ────< insurance_records (many)
--   vehicles (1) ────< maintenance_records (many)
-- ============================================================

-- Drop tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS maintenance_records CASCADE;
DROP TABLE IF EXISTS insurance_records CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS owners CASCADE;

-- ============================================================
-- OWNERS TABLE
-- ============================================================
CREATE TABLE owners (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    address TEXT,
    email VARCHAR(255),
    phone_number VARCHAR(20),
    region VARCHAR(100),
    department VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VEHICLES TABLE
-- ============================================================
CREATE TABLE vehicles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    license_number VARCHAR(20) NOT NULL UNIQUE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    model_year INTEGER,
    maintenance_interval INTEGER DEFAULT 5000, -- in miles
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INSURANCE RECORDS TABLE
-- ============================================================
CREATE TABLE insurance_records (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    date_renewed DATE NOT NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MAINTENANCE RECORDS TABLE
-- ============================================================
CREATE TABLE maintenance_records (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    arrival_mileage INTEGER NOT NULL,
    maintenance_activity TEXT NOT NULL,
    maintenance_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR BETTER QUERY PERFORMANCE
-- ============================================================
CREATE INDEX idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX idx_insurance_vehicle_id ON insurance_records(vehicle_id);
CREATE INDEX idx_insurance_expiry_date ON insurance_records(expiry_date);
CREATE INDEX idx_maintenance_vehicle_id ON maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_date ON maintenance_records(maintenance_date);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS) - Supabase Best Practice
-- ============================================================
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES (Allow all for authenticated users)
-- ============================================================
CREATE POLICY "Allow all for authenticated users" ON owners
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON vehicles
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON insurance_records
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON maintenance_records
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## Sample Data

```sql
-- ============================================================
-- INSERT SAMPLE DATA - OWNERS
-- ============================================================
INSERT INTO owners (first_name, last_name, address, email, phone_number, region, department)
VALUES
    ('John', 'Hopkins', 'Cincinnati OH, USA', 'john@access-templates.com', '8798219182', 'America', 'Sales'),
    ('Owner2', 'Owner2', 'Address2', NULL, NULL, NULL, NULL),
    ('Owner3', 'Owner3', 'Address3', NULL, NULL, NULL, NULL);

-- ============================================================
-- INSERT SAMPLE DATA - VEHICLES
-- ============================================================
INSERT INTO vehicles (owner_id, license_number, make, model, model_year, maintenance_interval)
VALUES
    (1, 'ABC123YZ', 'Bentley', 'Continental', 2017, 1000),
    (1, 'DEF456XY', 'Kia', 'Sportage', 2012, 7500),
    (2, 'ERT876UR', 'Ford', 'Explorer', 2016, 6000),
    (2, 'TOP231QW', 'Hyundai', 'Santa Fe', 2009, 4000),
    (2, 'FGV411YR', 'Chevrolet', 'Corvette', 2017, 8000),
    (3, 'JKL78KF', 'Ford', 'Escape', 2011, 2500);

-- ============================================================
-- INSERT SAMPLE DATA - INSURANCE RECORDS
-- ============================================================
INSERT INTO insurance_records (vehicle_id, date_renewed, expiry_date)
VALUES
    (1, '2017-10-28', '2017-10-28'),
    (2, '2016-12-06', '2017-12-05'),
    (3, '2015-07-13', '2016-07-12'),
    (5, '2016-08-13', '2017-08-12'),
    (6, '2016-01-05', '2017-01-04'),
    (4, '2015-10-10', '2016-10-10'),
    (4, '2016-10-11', '2017-10-10');

-- ============================================================
-- INSERT SAMPLE DATA - MAINTENANCE RECORDS
-- ============================================================
INSERT INTO maintenance_records (vehicle_id, arrival_mileage, maintenance_activity, maintenance_date)
VALUES
    (1, 10000, 'Periodic vehicle service', '2017-10-15'),
    (1, 12587, 'Periodic vehicle service', '2016-10-30'),
    (1, 15003, 'Periodic vehicle service', '2016-12-10'),
    (2, 4000, 'Fix broken tail lights', '2016-03-03'),
    (2, 7500, 'Periodic vehicle service', '2016-08-17'),
    (3, 1500, 'Periodic vehicle service', '2016-08-09'),
    (5, 10000, 'Periodic vehicle service', '2016-02-23'),
    (6, 1478, 'Periodic vehicle service', '2016-11-07'),
    (4, 1790, 'Periodic vehicle service', '2016-08-08'),
    (4, 3000, 'Periodic vehicle service', '2016-10-12'),
    (4, 5000, 'Periodic vehicle service', '2016-12-07');
```

---

## Useful Views

```sql
-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- View: Vehicles with owner details
CREATE OR REPLACE VIEW vehicles_with_owners AS
SELECT
    v.id AS vehicle_id,
    v.license_number,
    v.make,
    v.model,
    v.model_year,
    v.maintenance_interval,
    o.id AS owner_id,
    o.first_name || ' ' || o.last_name AS owner_name,
    o.email AS owner_email,
    o.phone_number AS owner_phone
FROM vehicles v
JOIN owners o ON v.owner_id = o.id;

-- View: Vehicles with latest insurance status
CREATE OR REPLACE VIEW vehicles_insurance_status AS
SELECT
    v.id AS vehicle_id,
    v.license_number,
    v.make || ' ' || v.model AS vehicle_name,
    ir.date_renewed,
    ir.expiry_date,
    CASE
        WHEN ir.expiry_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN ir.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING SOON'
        ELSE 'VALID'
    END AS insurance_status
FROM vehicles v
LEFT JOIN LATERAL (
    SELECT * FROM insurance_records
    WHERE vehicle_id = v.id
    ORDER BY expiry_date DESC
    LIMIT 1
) ir ON true;

-- View: Vehicles due for maintenance
CREATE OR REPLACE VIEW vehicles_maintenance_due AS
SELECT
    v.id AS vehicle_id,
    v.license_number,
    v.make || ' ' || v.model AS vehicle_name,
    v.maintenance_interval,
    mr.arrival_mileage AS last_mileage,
    mr.maintenance_date AS last_maintenance_date,
    mr.arrival_mileage + v.maintenance_interval AS next_maintenance_mileage
FROM vehicles v
LEFT JOIN LATERAL (
    SELECT * FROM maintenance_records
    WHERE vehicle_id = v.id
    ORDER BY maintenance_date DESC
    LIMIT 1
) mr ON true;
```

---

## How to Use

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the SQL sections above in order:
   - First: Schema (tables, indexes, RLS)
   - Then: Sample Data (if needed)
   - Finally: Views (optional but useful)
5. Click **Run** to execute
