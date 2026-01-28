-- ============================================================
-- AGREEMENTS TABLE SCHEMA
-- Links car rental agreements to bookings
-- ============================================================

CREATE TABLE agreements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL, -- Links agreement to a specific organization
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    
    -- Agreement Details
    agreement_doc_id TEXT NOT NULL, -- The identifier for the document
    agreement_link TEXT NOT NULL,   -- The URL/Link to the agreement document
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_agreements_org_id ON agreements(org_id);
CREATE INDEX idx_agreements_booking_id ON agreements(booking_id);

-- Enable RLS
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- Policies (Assuming similar structure to other tables)
-- CREATE POLICY "Users can view agreements in their org" ON agreements
--     FOR SELECT USING (auth.uid() IN (SELECT user_id FROM profiles WHERE org_id = agreements.org_id));
