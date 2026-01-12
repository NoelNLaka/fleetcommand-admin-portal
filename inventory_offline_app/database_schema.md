# Database Schema
## Workshop Tablet (Room / SQLite)

---

## 1. Design Philosophy

The database is:
- **Local-first**
- **Authoritative**
- **Append-audit based** (no silent overwrites)

All stock changes are recorded as **movements**, not direct mutations.

---

## 2. Core Tables

### 2.1 mechanics

```sql
mechanics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT, -- supervisor | mechanic | inventory_officer
  active INTEGER,
  created_at INTEGER
)
```

---

### 2.2 vehicles

```sql
vehicles (
  id TEXT PRIMARY KEY,
  plate_number TEXT,
  model TEXT,
  status TEXT, -- available | maintenance | retired
  created_at INTEGER
)
```

---

### 2.3 parts

```sql
parts (
  id TEXT PRIMARY KEY,
  name TEXT,
  category TEXT,
  unit TEXT,
  min_stock INTEGER,
  created_at INTEGER
)
```

---

## 3. Inventory Control

### 3.1 inventory_movements (Ledger)

```sql
inventory_movements (
  id TEXT PRIMARY KEY,
  part_id TEXT,
  quantity INTEGER,
  movement_type TEXT, -- IN | OUT | ADJUSTMENT
  reason TEXT,
  vehicle_id TEXT,
  mechanic_id TEXT,
  reference_id TEXT, -- receipt_id or maintenance_id
  created_at INTEGER
)
```

> Inventory level = SUM(quantity) grouped by part_id

---

## 4. Procurement & Payments

### 4.1 part_requests

```sql
part_requests (
  id TEXT PRIMARY KEY,
  requested_by TEXT,
  status TEXT, -- pending | approved | rejected | fulfilled
  notes TEXT,
  created_at INTEGER,
  updated_at INTEGER
)
```

---

### 4.2 part_request_items

```sql
part_request_items (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  part_name TEXT,
  quantity INTEGER
)
```

---

### 4.3 receipts (COD)

```sql
receipts (
  id TEXT PRIMARY KEY,
  supplier TEXT,
  amount REAL,
  invoice_number TEXT,
  image_path TEXT,
  paid INTEGER,
  created_at INTEGER
)
```

---

## 5. Maintenance Tracking

### 5.1 maintenance_records

```sql
maintenance_records (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT,
  mechanic_id TEXT,
  description TEXT,
  status TEXT, -- open | completed
  started_at INTEGER,
  completed_at INTEGER
)
```

---

### 5.2 maintenance_parts

```sql
maintenance_parts (
  id TEXT PRIMARY KEY,
  maintenance_id TEXT,
  part_id TEXT,
  quantity INTEGER
)
```

---

## 6. Shift Reporting

### 6.1 shift_reports

```sql
shift_reports (
  id TEXT PRIMARY KEY,
  mechanic_id TEXT,
  summary TEXT,
  locked INTEGER,
  created_at INTEGER
)
```

---

## 7. Audit & Integrity Rules

- No DELETE on inventory_movements
- Corrections use ADJUSTMENT entries
- Shift reports lock all prior records
- Tablet timestamp is authoritative

---

**End of database_schema.md**

