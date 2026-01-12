# Workshop Inventory & Maintenance System
## Final System Architecture

---

## 1. Purpose of This Document

This document defines the **final, agreed architecture** for the Workshop Inventory & Maintenance System used alongside an existing Fleet Management System.

It is intended to:
- Act as the **single source of truth** for system design
- Guide implementation (mobile, backend, and web)
- Support audits, onboarding, and future scaling

All design decisions here are **intentional** and optimized for:
- Offline-first operation
- Low-connectivity environments
- Long-term maintainability
- Minimal tooling overhead

---

## 2. System Overview

The system consists of two primary components:

1. **Workshop Tablet System (Authoritative)**
2. **Office Web Application (Supervisory & Analytical)**

The workshop tablet is both:
- A **native Android application**
- A **local backend server** exposing controlled APIs

The office web application never accesses the tablet database directly.

---

## 3. Core Design Principles

### 3.1 Offline-First
- All workshop operations must function without internet
- Internet is treated as an *optimization*, not a dependency

### 3.2 Local Authority
- The workshop tablet is the **source of truth** for:
  - Inventory levels
  - Parts usage
  - Maintenance records
  - Receipts & invoices
  - Shift reports

### 3.3 Controlled Synchronization
- Data flows via APIs
- No shared databases
- No live remote writes to SQLite

### 3.4 Auditability
- Every inventory change is logged
- Every service action is attributable to a mechanic
- Cash payments are documented with receipts

---

## 4. High-Level Architecture

```
┌────────────────────────────────────────┐
│        Workshop Tablet (Android)       │
│                                        │
│  Native Kotlin Application             │
│  ├─ Inventory UI                       │
│  ├─ Maintenance UI                     │
│  ├─ Parts Request UI                   │
│  ├─ Receipt Capture                    │
│  ├─ Shift Reports                      │
│                                        │
│  Room (SQLite)                         │
│  ├─ parts                              │
│  ├─ inventory_movements                │
│  ├─ part_requests                      │
│  ├─ receipts                           │
│  ├─ vehicles                           │
│  ├─ maintenance_records                │
│  ├─ mechanics                          │
│  ├─ shift_reports                      │
│                                        │
│  Embedded Ktor Server                  │
│  ├─ Local REST API                     │
│  ├─ Sync endpoints                     │
│  ├─ Read-only analytics endpoints      │
│  └─ Auth & access control              │
└───────────────▲────────────────────────┘
                │ Encrypted VPN (Tailscale)
┌───────────────┴────────────────────────┐
│        Office Web Application           │
│                                        │
│  Fleet Management System               │
│  ├─ Approvals                           │
│  ├─ Inventory dashboards                │
│  ├─ Maintenance analytics               │
│  ├─ Audit review (receipts)             │
└────────────────────────────────────────┘
```

---

## 5. Workshop Tablet Responsibilities

The workshop tablet system is **authoritative**.

### 5.1 Inventory Management
- Maintain current stock levels
- Record stock additions (COD purchases)
- Record stock deductions (parts installed)

### 5.2 Parts Request Workflow
- Create parts requests
- Sync requests to office
- Receive approvals

### 5.3 Cash on Delivery (COD)
- Manual confirmation of payment
- Capture receipt & invoice images
- Store supplier, amount, and reference

### 5.4 Maintenance Tracking
- Track vehicles under maintenance
- Record service actions
- Assign mechanic responsibility
- Link parts to vehicles

### 5.5 Shift Reporting
- Generate end-of-shift reports
- Store locally
- Sync to office
- Lock reports after submission

---

## 6. Office Web Application Responsibilities

The office system is **supervisory**, not authoritative.

### 6.1 Approvals
- Review and approve parts requests

### 6.2 Visibility
- View inventory levels
- View maintenance history
- View shift reports

### 6.3 Analytics
- Usage trends
- Failure patterns
- Cost analysis

### 6.4 Restrictions
- No direct inventory edits
- No direct database access

---

## 7. Embedded Backend (Ktor on Tablet)

### 7.1 Purpose
The embedded Ktor server exists to:
- Expose tablet data safely
- Enable remote viewing
- Handle sync logic

### 7.2 Why Embedded Backend Is Required
- Android does not allow safe remote DB access
- SQLite is not network-safe
- APIs provide validation, auth, and control

### 7.3 Endpoint Categories
- Sync endpoints (bi-directional)
- Read-only reporting endpoints
- Controlled approval callbacks

---

## 8. Connectivity Model

### 8.1 Local-Only Mode
- Default mode
- Full functionality
- No network dependency

### 8.2 Remote Mode
- Enabled via VPN (e.g., Tailscale)
- Encrypted peer-to-peer
- Office calls tablet APIs

### 8.3 Security
- Device identity
- Token-based API auth
- VPN-level encryption

---

## 9. Technology Stack (Final)

### Workshop Tablet
- Language: Kotlin
- UI: Jetpack Compose
- Database: Room (SQLite)
- Backend: Embedded Ktor server
- Background jobs: WorkManager

### Office
- Web stack (existing)
- REST client
- Analytics & dashboards

---

## 10. Failure Scenarios & Handling

### Internet Loss
- No impact on workshop operations
- Sync resumes when available

### Power Loss
- Local DB ensures durability
- No partial inventory updates (transactions)

### Sync Conflicts
- Tablet is authoritative
- Office never overwrites tablet state

---

## 11. Scalability Considerations

- One tablet per workshop (recommended)
- Multi-workshop supported via IDs
- Future central aggregation supported

---

## 12. Explicit Non-Goals

The system intentionally does NOT:
- Provide real-time inventory across workshops
- Integrate payment gateways
- Allow office-side inventory edits

These are conscious design choices.

---

## 13. Status

This architecture is **FINAL and APPROVED**.

All subsequent implementation must conform to this document.

---

**End of architecture.md**

