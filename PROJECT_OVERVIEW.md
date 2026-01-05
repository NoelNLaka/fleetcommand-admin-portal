# FleetCommand Admin Portal

## Project Overview

FleetCommand is a multi-tenant fleet management SaaS application designed for vehicle rental businesses. It provides a comprehensive admin portal for managing vehicles, customers, bookings, and maintenance operations.

### Objectives

- **Fleet Management**: Track and manage vehicle inventory, availability, and utilization
- **Customer Management**: Maintain customer records, license verification, and rental history
- **Booking Operations**: Handle reservations, active rentals, and payment tracking
- **Maintenance Tracking**: Schedule and monitor vehicle service and repairs
- **Multi-Tenancy**: Support multiple organizations with complete data isolation
- **Role-Based Access Control**: Granular permissions based on user roles

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend/Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Payments | Stripe |
| Hosting | PWA-ready (vite-plugin-pwa) |

---

## Database Structure

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│  organizations  │       │   auth.users    │
│─────────────────│       │   (Supabase)    │
│ id (PK)         │       │─────────────────│
│ name            │       │ id (PK)         │
│ plan_name       │       │ email           │
│ created_at      │       │ ...             │
└────────┬────────┘       └────────┬────────┘
         │                         │
         │ 1:N                     │ 1:1
         │                         │
         ▼                         ▼
┌─────────────────────────────────────────────┐
│                  profiles                    │
│─────────────────────────────────────────────│
│ id (PK, FK → auth.users)                    │
│ org_id (FK → organizations)                 │
│ full_name                                   │
│ avatar_url                                  │
│ role (enum)                                 │
│ created_at                                  │
└─────────────────────────────────────────────┘
         │
         │ org_id (shared tenant key)
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    vehicles     │    │    customers    │    │ maintenance_    │
│─────────────────│    │─────────────────│    │    records      │
│ id (PK)         │    │ id (PK)         │    │─────────────────│
│ org_id (FK)     │    │ org_id (FK)     │    │ id (PK)         │
│ name            │    │ name            │    │ org_id (FK)     │
│ year            │    │ email           │    │ vehicle_id (FK) │
│ trim            │    │ phone           │    │ service_type    │
│ plate           │    │ address         │    │ status          │
│ vin             │    │ license_number  │    │ assignee_name   │
│ status          │    │ license_state   │    │ cost_estimate   │
│ location        │    │ license_expiry  │    │ scheduled_date  │
│ mileage         │    │ status          │    │ created_at      │
│ daily_rate      │    │ created_at      │    └────────┬────────┘
│ image_url       │    └────────┬────────┘             │
│ created_at      │             │                      │
└────────┬────────┘             │                      │
         │                      │                      │
         │ N:1                  │ N:1                  │
         │                      │                      │
         └──────────┬───────────┘                      │
                    │                                  │
                    ▼                                  │
         ┌─────────────────┐                          │
         │    bookings     │◄─────────────────────────┘
         │─────────────────│      (vehicle_id FK)
         │ id (PK)         │
         │ org_id (FK)     │
         │ customer_id(FK) │
         │ vehicle_id (FK) │
         │ start_date      │
         │ end_date        │
         │ duration_days   │
         │ status          │
         │ payment_status  │
         │ created_at      │
         └─────────────────┘
```

---

### Table Details

#### 1. organizations
Primary tenant table for multi-tenancy support.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique organization identifier |
| name | VARCHAR | Organization/company name |
| plan_name | VARCHAR | Subscription tier (Starter, Pro, etc.) |
| created_at | TIMESTAMP | Record creation timestamp |

#### 2. profiles
User profiles linked to Supabase Auth, with role assignments.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK, FK) | Links to auth.users.id |
| org_id | UUID (FK) | Organization membership |
| full_name | VARCHAR | User's display name |
| avatar_url | VARCHAR | Profile picture URL |
| role | ENUM | User role (see Role System below) |
| created_at | TIMESTAMP | Record creation timestamp |

#### 3. vehicles
Fleet inventory management.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique vehicle identifier |
| org_id | UUID (FK) | Owning organization |
| name | VARCHAR | Vehicle make/model (e.g., "2024 Tesla Model 3") |
| year | VARCHAR | Model year |
| trim | VARCHAR | Trim level |
| plate | VARCHAR | License plate number |
| vin | VARCHAR | Vehicle Identification Number |
| status | ENUM | Available, Rented, Maintenance |
| location | VARCHAR | Current location |
| mileage | VARCHAR | Odometer reading |
| daily_rate | DECIMAL | Rental rate per day |
| image_url | VARCHAR | Vehicle photo URL |
| created_at | TIMESTAMP | Record creation timestamp |

#### 4. customers
Customer records and license information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique customer identifier |
| org_id | UUID (FK) | Organization that owns this customer |
| name | VARCHAR | Customer full name |
| email | VARCHAR | Email address |
| phone | VARCHAR | Phone number |
| address | VARCHAR | Physical address |
| license_number | VARCHAR | Driver's license number |
| license_state | VARCHAR | License issuing state |
| license_expiry | DATE | License expiration date |
| status | ENUM | Active, Pending, Inactive, Banned |
| created_at | TIMESTAMP | Record creation timestamp |

#### 5. bookings
Rental reservations and active rentals.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique booking identifier |
| org_id | UUID (FK) | Organization that owns this booking |
| customer_id | UUID (FK) | Reference to customers table |
| vehicle_id | UUID (FK) | Reference to vehicles table |
| start_date | DATE | Rental start date |
| end_date | DATE | Rental end date |
| duration_days | INTEGER | Total rental days |
| status | ENUM | Active, Completed, Overdue, Pending Pickup, Confirmed |
| payment_status | ENUM | Paid, Unpaid, Partial |
| created_at | TIMESTAMP | Record creation timestamp |

#### 6. maintenance_records
Vehicle service and repair tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique record identifier |
| org_id | UUID (FK) | Organization that owns this record |
| vehicle_id | UUID (FK) | Reference to vehicles table |
| service_type | VARCHAR | Type of service (Oil Change, Brake Repair, etc.) |
| status | ENUM | Scheduled, In Shop, Done, Overdue |
| assignee_name | VARCHAR | Technician/department assigned |
| cost_estimate | DECIMAL | Estimated service cost |
| scheduled_date | DATE | Scheduled service date |
| created_at | TIMESTAMP | Record creation timestamp |

---

## Multi-Tenancy Architecture

FleetCommand uses a **shared database, shared schema** multi-tenancy model with row-level isolation.

### How It Works

1. **Tenant Identification**: Each organization has a unique `org_id` (UUID)
2. **Row-Level Security (RLS)**: Supabase RLS policies filter data based on the user's `org_id`
3. **Data Isolation**: All tenant-specific tables include an `org_id` column
4. **Query Filtering**: Application queries automatically filter by `profile.org_id`

### Example Data Flow

```
User Login → Auth validates → Profile fetched (with org_id)
                                    ↓
                            org_id stored in context
                                    ↓
                    All queries filtered by org_id
                                    ↓
            User only sees their organization's data
```

### Current Organizations

| ID | Name | Plan |
|----|------|------|
| 00000000-0000-0000-0000-000000000001 | Actuon Fleet Solutions | Starter |
| 7b002b31-8732-4664-a40e-6b5128c73873 | Demo Fleet Services | Pro |

---

## Role-Based Access Control (RBAC)

### User Roles

| Role | Access Level | Description |
|------|--------------|-------------|
| **Superadmin** | Full | Complete system access, organization settings, billing |
| **Admin** | High | Manage vehicles, customers, bookings, and staff |
| **Client Officer** | Medium | Handle bookings, customer interactions |
| **Workshop Supervisor** | Medium | Manage maintenance operations and technicians |
| **Mechanic** | Limited | View and update assigned maintenance tasks |

### Permission Matrix

| Feature | Superadmin | Admin | Client Officer | Workshop Supervisor | Mechanic |
|---------|:----------:|:-----:|:--------------:|:------------------:|:--------:|
| Organization Settings | ✓ | - | - | - | - |
| Billing & Subscription | ✓ | - | - | - | - |
| Team Management | ✓ | ✓ | - | - | - |
| Vehicle Management | ✓ | ✓ | View | View | View |
| Customer Management | ✓ | ✓ | ✓ | - | - |
| Bookings | ✓ | ✓ | ✓ | View | - |
| Maintenance | ✓ | ✓ | View | ✓ | Assigned |
| Reports & Analytics | ✓ | ✓ | Limited | Limited | - |

---

## Status Enumerations

### Vehicle Status
- `Available` - Ready for rental
- `Rented` - Currently on rental
- `Maintenance` - In service/repair

### Booking Status
- `Confirmed` - Reservation confirmed, awaiting pickup
- `Pending Pickup` - Ready for customer pickup
- `Active` - Currently ongoing rental
- `Completed` - Rental finished, vehicle returned
- `Overdue` - Past return date, not yet returned

### Payment Status
- `Paid` - Full payment received
- `Unpaid` - No payment received
- `Partial` - Partial payment received

### Customer Status
- `Active` - Verified, can make bookings
- `Pending` - Awaiting verification
- `Inactive` - Account deactivated
- `Banned` - Blocked from service

### Maintenance Status
- `Scheduled` - Service planned for future date
- `In Shop` - Vehicle currently being serviced
- `Done` - Service completed
- `Overdue` - Past scheduled date, not completed

---

## Key Features

### Dashboard
- Fleet utilization metrics
- Revenue overview
- Active bookings summary
- Maintenance alerts

### Inventory Management
- Vehicle listing with filters
- Status tracking
- Daily rate management
- Vehicle details and history

### Booking System
- New booking creation
- Customer search/registration
- Calendar view
- Payment tracking

### Customer Management
- Customer profiles
- License verification
- Rental history
- Status management

### Maintenance Module
- Service scheduling
- Task assignment
- Cost tracking
- Status workflow

### Settings
- Organization profile
- Team member management
- Theme preferences (Light/Dark/System)
- Subscription management

---

## Authentication Flow

```
1. User visits login page
2. Enters email/password
3. Supabase Auth validates credentials
4. On success:
   - Session created
   - Profile fetched (includes org_id and role)
   - User redirected to dashboard
5. AuthContext provides user data throughout app
6. Protected routes check authentication and role
```

---

## File Structure

```
fleetcommand-admin-portal/
├── src/
│   ├── components/          # React components
│   │   ├── Bookings.tsx
│   │   ├── Customers.tsx
│   │   ├── Inventory.tsx
│   │   ├── Maintenance.tsx
│   │   ├── Settings.tsx
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication state
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   └── stripe.ts        # Stripe integration
│   ├── types.ts             # TypeScript interfaces
│   └── constants.ts         # Static data
├── supabase/
│   └── functions/           # Edge functions
├── scripts/                 # Database utilities
├── .env.local              # Environment variables
└── package.json
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| VITE_SUPABASE_URL | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Supabase anonymous/public key |
| SUPABASE_SERVICE_KEY | Supabase service role key (server-side only) |
| VITE_STRIPE_PUBLISHABLE_KEY | Stripe public key |
| VITE_STRIPE_SECRET_KEY | Stripe secret key |
| VITE_STRIPE_STARTER_PRICE_ID | Stripe price ID for Starter plan |
| VITE_STRIPE_PRO_PRICE_ID | Stripe price ID for Pro plan |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

### Test Accounts

| Email | Password | Organization | Role |
|-------|----------|--------------|------|
| admin@demo.com | Demo@123! | Demo Fleet Services | Superadmin |

---

## Future Enhancements

- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] GPS vehicle tracking integration
- [ ] Automated billing/invoicing
- [ ] Customer self-service portal
- [ ] Advanced analytics and reporting
- [ ] Document management (contracts, insurance)
- [ ] Integration with third-party services (insurance, fuel cards)
