-- ============================================================
-- CUSTOMERS TABLE SCHEMA
-- Derived from application codebase (src/components/Customers.tsx)
-- ============================================================

CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL, -- Links customer to a specific organization
    
    -- Personal Information
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    secondary_phone TEXT,
    address TEXT,
    
    -- Status & Identification
    status TEXT DEFAULT 'Active', -- Enum: Active, Pending, Inactive, Banned
    nid_number TEXT,
    
    -- License Details
    license_number TEXT,
    license_state TEXT,
    license_expiry TEXT, -- Format often string in frontend, but likely DATE or TEXT in DB
    license_image_url TEXT,
    
    -- Next of Kin / Emergency Contact
    next_of_kin_name TEXT,
    next_of_kin_phone TEXT,
    
    -- Employment/Company
    company TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) -- or profiles(id)
);

-- Indexes (Recommended)
CREATE INDEX idx_customers_org_id ON customers(org_id);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_email ON customers(email);
