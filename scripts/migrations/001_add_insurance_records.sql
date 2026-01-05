-- ============================================================
-- MIGRATION: Add Insurance Records & Update Maintenance Records
-- FleetCommand Admin Portal
-- ============================================================

-- ============================================================
-- 1. CREATE INSURANCE RECORDS TABLE
-- ============================================================
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

-- ============================================================
-- 2. ADD INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_insurance_records_org_id ON insurance_records(org_id);
CREATE INDEX IF NOT EXISTS idx_insurance_records_vehicle_id ON insurance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_insurance_records_expiry_date ON insurance_records(expiry_date);
CREATE INDEX IF NOT EXISTS idx_insurance_records_record_type ON insurance_records(record_type);

-- ============================================================
-- 3. UPDATE MAINTENANCE_RECORDS TABLE (Add new columns)
-- ============================================================
ALTER TABLE maintenance_records
ADD COLUMN IF NOT EXISTS arrival_mileage INTEGER,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE insurance_records ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. RLS POLICIES FOR INSURANCE_RECORDS
-- ============================================================
-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view their org insurance records" ON insurance_records;
DROP POLICY IF EXISTS "Users can insert their org insurance records" ON insurance_records;
DROP POLICY IF EXISTS "Users can update their org insurance records" ON insurance_records;
DROP POLICY IF EXISTS "Users can delete their org insurance records" ON insurance_records;
DROP POLICY IF EXISTS "Service role has full access to insurance_records" ON insurance_records;

-- Policy: Users can only see their organization's insurance records
CREATE POLICY "Users can view their org insurance records" ON insurance_records
    FOR SELECT
    TO authenticated
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy: Users can insert records for their organization
CREATE POLICY "Users can insert their org insurance records" ON insurance_records
    FOR INSERT
    TO authenticated
    WITH CHECK (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy: Users can update their organization's records
CREATE POLICY "Users can update their org insurance records" ON insurance_records
    FOR UPDATE
    TO authenticated
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy: Users can delete their organization's records
CREATE POLICY "Users can delete their org insurance records" ON insurance_records
    FOR DELETE
    TO authenticated
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy: Service role has full access (for admin scripts)
CREATE POLICY "Service role has full access to insurance_records" ON insurance_records
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 6. CREATE VIEW FOR INSURANCE STATUS
-- ============================================================
CREATE OR REPLACE VIEW vehicles_insurance_status AS
SELECT
    v.id AS vehicle_id,
    v.org_id,
    v.name AS vehicle_name,
    v.plate AS license_plate,
    ir.id AS record_id,
    ir.record_type,
    ir.date_renewed,
    ir.expiry_date,
    ir.provider,
    ir.policy_number,
    CASE
        WHEN ir.expiry_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN ir.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        ELSE 'VALID'
    END AS status,
    ir.expiry_date - CURRENT_DATE AS days_until_expiry
FROM vehicles v
LEFT JOIN LATERAL (
    SELECT * FROM insurance_records
    WHERE vehicle_id = v.id
    ORDER BY expiry_date DESC
    LIMIT 1
) ir ON true;

-- ============================================================
-- 7. CREATE FUNCTION TO UPDATE updated_at TIMESTAMP
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for insurance_records
DROP TRIGGER IF EXISTS update_insurance_records_updated_at ON insurance_records;
CREATE TRIGGER update_insurance_records_updated_at
    BEFORE UPDATE ON insurance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for maintenance_records (if not exists)
DROP TRIGGER IF EXISTS update_maintenance_records_updated_at ON maintenance_records;
CREATE TRIGGER update_maintenance_records_updated_at
    BEFORE UPDATE ON maintenance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
