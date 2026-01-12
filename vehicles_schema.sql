-- ============================================================
-- VEHICLES TABLE SCHEMA
-- Derived from inferred data and codebase (src/components/Inventory.tsx)
-- ============================================================

CREATE TABLE vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL,

    -- Vehicle Details
    name TEXT NOT NULL,
    year INTEGER,
    trim TEXT,
    plate TEXT,
    vin TEXT,
    status TEXT DEFAULT 'Available', -- Enum: Available, Rented, Maintenance
    location TEXT,
    mileage INTEGER,
    daily_rate NUMERIC, -- Inferred as TEXT from JSON, but NUMERIC is better for DB
    image_url TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) -- or profiles(id)
);

-- Indexes (Recommended)
CREATE INDEX idx_vehicles_org_id ON vehicles(org_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
