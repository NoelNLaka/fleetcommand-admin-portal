# API Contracts
## Embedded Ktor Server (Workshop Tablet)

---

## 1. API Design Principles

- Tablet is **authoritative**
- Office is **read-only or approval-based**
- No direct database exposure
- All mutations are validated
- Idempotent sync endpoints

---

## 2. Authentication & Access Control

### 2.1 Device Authentication
- Each tablet has a device ID
- API requests include bearer token
- Token is provisioned once

```
Authorization: Bearer <device-token>
```

### 2.2 Role-Based Access
- supervisor
- mechanic
- inventory_officer
- office_viewer (read-only)

---

## 3. Inventory Endpoints

### 3.1 Get Inventory Levels

```
GET /api/inventory
```

**Response**
```json
[
  {
    "partId": "uuid",
    "name": "Brake Pad",
    "quantity": 12,
    "minStock": 5
  }
]
```

---

### 3.2 Record Inventory Movement

```
POST /api/inventory/move
```

**Body**
```json
{
  "partId": "uuid",
  "quantity": -2,
  "movementType": "OUT",
  "vehicleId": "vehicle-uuid",
  "mechanicId": "mechanic-uuid",
  "reason": "Brake replacement"
}
```

---

## 4. Parts Request Workflow

### 4.1 Create Parts Request

```
POST /api/requests
```

```json
{
  "requestedBy": "mechanic-uuid",
  "items": [
    { "partName": "Oil Filter", "quantity": 3 }
  ],
  "notes": "Urgent"
}
```

---

### 4.2 Get Pending Requests (Office)

```
GET /api/requests?status=pending
```

---

### 4.3 Approve / Reject Request (Office)

```
POST /api/requests/{id}/decision
```

```json
{
  "decision": "approved",
  "notes": "Approved by manager"
}
```

---

## 5. COD & Receipts

### 5.1 Register COD Payment

```
POST /api/receipts
```

```json
{
  "supplier": "ABC Parts",
  "amount": 1200.00,
  "invoiceNumber": "INV-2031",
  "paid": true
}
```

---

### 5.2 Upload Receipt Image

```
POST /api/receipts/{id}/image
```

Multipart upload

---

## 6. Maintenance Tracking

### 6.1 Start Maintenance

```
POST /api/maintenance
```

```json
{
  "vehicleId": "vehicle-uuid",
  "mechanicId": "mechanic-uuid",
  "description": "Engine service"
}
```

---

### 6.2 Complete Maintenance

```
POST /api/maintenance/{id}/complete
```

---

## 7. Shift Reports

### 7.1 Submit Shift Report

```
POST /api/shifts/end
```

```json
{
  "mechanicId": "uuid",
  "summary": "Replaced brakes on 2 vehicles"
}
```

> Locks all records prior to submission

---

## 8. Sync & Remote Access

### 8.1 Full Sync Snapshot (Office)

```
GET /api/sync/snapshot
```

- Inventory summary
- Open maintenance
- Last shift report

---

## 9. Error Handling

Standard HTTP status codes

```json
{
  "error": "Invalid movement",
  "code": "INV_400"
}
```

---

## 10. Explicit Restrictions

- Office cannot call inventory mutation endpoints
- No DELETE endpoints
- No bulk overwrite sync

---

**End of api_contracts.md**

