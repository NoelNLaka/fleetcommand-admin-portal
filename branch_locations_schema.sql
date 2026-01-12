-- ============================================================
-- BRANCH LOCATIONS TABLE SCHEMA
-- Used for managing organization branch locations (HQ, Base, etc.)
-- ============================================================

CREATE TABLE branch_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL, -- Links to the organization

    name TEXT NOT NULL, -- e.g., "Headquarters", "Airport Branch"
    address TEXT NOT NULL, -- Full address string
    is_default BOOLEAN DEFAULT FALSE, -- Flag for default location

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_branch_locations_org_id ON branch_locations(org_id);

-- RLS Policies (Example - enabling read/write for authenticated users of the same org)
-- ALTER TABLE branch_locations ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view branches of their own org" ON branch_locations FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE org_id = branch_locations.org_id));
