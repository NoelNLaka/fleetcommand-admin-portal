-- ============================================================
-- BOOKINGS TABLE SCHEMA
-- Derived from application codebase (src/components/Bookings.tsx)
-- ============================================================

CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL, -- Links booking to a specific organization

    -- Foreign Keys
    customer_id UUID NOT NULL REFERENCES customers(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),

    -- Booking Details
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INTEGER, -- Often calculated, but present in select queries
    
    -- Statuses
    status TEXT DEFAULT 'Confirmed', -- Enum: Active, Completed, Overdue, Pending Pickup, Confirmed
    payment_status TEXT DEFAULT 'Unpaid', -- Enum: Paid, Unpaid, Partial

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) -- or profiles(id)
);

-- Indexes (Recommended)
CREATE INDEX idx_bookings_org_id ON bookings(org_id);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
