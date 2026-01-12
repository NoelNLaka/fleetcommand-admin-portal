# Workshop Inventory App - Testing Instructions

## Prerequisites

1. **Android Studio** (Hedgehog 2023.1.1 or newer)
2. **JDK 17** or higher
3. **Android device or emulator** running Android 8.0+ (API 26+)
4. **ADB** (comes with Android Studio)

## Building the App

### 1. Open in Android Studio

```bash
cd inventory_offline_app
```

Open this folder in Android Studio as an existing project.

### 2. Sync Gradle

Android Studio should automatically prompt to sync. If not:
- File → Sync Project with Gradle Files

### 3. Build the APK

```bash
# Debug build
./gradlew assembleDebug

# The APK will be at:
# app/build/outputs/apk/debug/app-debug.apk
```

Or use Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)

### 4. Install on Device

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

Or run directly from Android Studio with a connected device/emulator.

---

## Testing the App

### Step 1: Device Setup (QR Code Scan)

The app requires a QR code containing organization credentials and Supabase connection info. Generate a QR code with this JSON:

```json
{
  "orgId": "your-org-uuid-here",
  "orgName": "Your Organization Name",
  "token": "your-supabase-access-token",
  "deviceId": "workshop-tablet-1",
  "supabaseUrl": "https://your-project.supabase.co",
  "supabaseAnonKey": "your-supabase-anon-key"
}
```

**Getting Supabase Credentials:**
1. Go to your Supabase project dashboard
2. Settings → API
3. Copy the Project URL (supabaseUrl)
4. Copy the anon/public key (supabaseAnonKey)
5. Get an access token from a logged-in user session

**Generate QR Code:**
- Use any QR generator: https://www.qr-code-generator.com/
- Paste the JSON above (with your real values) and generate
- Display on screen or print

**In the app:**
1. Launch the app - you'll see the Setup screen
2. Tap "Scan QR Code"
3. Grant camera permission
4. Scan the QR code
5. App syncs vehicles from Supabase
6. App navigates to Dashboard

### Step 2: Test Dashboard

After setup, the Dashboard shows:
- Total parts count
- Low stock alerts
- Open maintenance jobs
- Quick action buttons

### Step 3: Test Inventory Management

1. **Add a Part:**
   - Tap "Inventory" from Dashboard
   - Tap the + FAB button
   - Fill in: Name, Category, Unit, Min Stock
   - Save

2. **Record Stock Movement:**
   - Tap on a part to view details
   - Tap "Record Movement"
   - Select type: IN (receiving), OUT (usage), ADJUSTMENT
   - Enter quantity and reason
   - Save

3. **View Movement History:**
   - Part detail screen shows all movements

### Step 4: Test Maintenance

1. **Start Maintenance:**
   - Tap "Maintenance" from Dashboard
   - Tap + FAB to start new job
   - Select vehicle and mechanic
   - Enter description
   - Submit

2. **Complete Maintenance:**
   - Tap on open maintenance record
   - View details, add parts used
   - Tap "Complete" when done

### Step 5: Test Parts Requests

1. **Create Request:**
   - Tap "Requests" from Dashboard
   - Tap + FAB
   - Add items (part name, quantity)
   - Add notes if needed
   - Submit

2. **View Requests:**
   - List shows pending/approved/fulfilled requests

### Step 6: Test COD Receipts

1. **Add Receipt:**
   - Tap "Receipts" from Dashboard
   - Tap + FAB
   - Enter supplier, amount, invoice number
   - Toggle payment status
   - Save

2. **Mark as Paid:**
   - Tap unpaid receipt
   - Tap "Mark as Paid"

### Step 7: Test Shift Report

1. **Submit Report:**
   - Tap "End Shift" from Dashboard
   - View shift summary (jobs done, receipts)
   - Select mechanic
   - Write shift summary
   - Submit (locks all records)

---

## Testing the Embedded API Server

The app runs a Ktor server on port 8080. Test with curl or Postman.

### Get Device IP

On the Android device:
- Settings → Wi-Fi → Connected network → IP address

Or via ADB:
```bash
adb shell ip addr show wlan0
```

### API Endpoints

Replace `DEVICE_IP` with your device's IP address.

**Authentication:** All endpoints require Bearer token in header:
```
Authorization: Bearer test-token-abc123
```

#### Inventory

```bash
# Get all inventory with stock levels
curl -H "Authorization: Bearer test-token-abc123" \
  http://DEVICE_IP:8080/api/inventory

# Record stock movement
curl -X POST \
  -H "Authorization: Bearer test-token-abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "part_id": "part-uuid-here",
    "quantity": 10,
    "movement_type": "IN",
    "reason": "Restocking"
  }' \
  http://DEVICE_IP:8080/api/inventory/move
```

#### Maintenance

```bash
# Get all maintenance records
curl -H "Authorization: Bearer test-token-abc123" \
  http://DEVICE_IP:8080/api/maintenance

# Start maintenance
curl -X POST \
  -H "Authorization: Bearer test-token-abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "vehicle-uuid",
    "mechanic_id": "mechanic-uuid",
    "description": "Oil change"
  }' \
  http://DEVICE_IP:8080/api/maintenance

# Complete maintenance
curl -X POST \
  -H "Authorization: Bearer test-token-abc123" \
  http://DEVICE_IP:8080/api/maintenance/{id}/complete
```

#### Parts Requests

```bash
# Get all requests
curl -H "Authorization: Bearer test-token-abc123" \
  http://DEVICE_IP:8080/api/requests

# Create request
curl -X POST \
  -H "Authorization: Bearer test-token-abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "requested_by": "John",
    "items": [
      {"part_name": "Oil Filter", "quantity": 5}
    ],
    "notes": "Urgent"
  }' \
  http://DEVICE_IP:8080/api/requests

# Approve/reject request
curl -X POST \
  -H "Authorization: Bearer test-token-abc123" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}' \
  http://DEVICE_IP:8080/api/requests/{id}/decision
```

#### Receipts

```bash
# Get all receipts
curl -H "Authorization: Bearer test-token-abc123" \
  http://DEVICE_IP:8080/api/receipts

# Add receipt
curl -X POST \
  -H "Authorization: Bearer test-token-abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "supplier": "AutoParts Inc",
    "amount": 250.00,
    "invoice_number": "INV-001",
    "paid": false
  }' \
  http://DEVICE_IP:8080/api/receipts
```

#### Sync (Full Snapshot)

```bash
# Get full data snapshot for office sync
curl -H "Authorization: Bearer test-token-abc123" \
  http://DEVICE_IP:8080/api/sync/snapshot
```

---

## Testing with ADB Port Forwarding

If testing from your development machine:

```bash
# Forward port 8080 from device to localhost
adb forward tcp:8080 tcp:8080

# Now access API at localhost
curl -H "Authorization: Bearer test-token-abc123" \
  http://localhost:8080/api/inventory
```

---

## Adding Test Data

### Option 1: Via App UI
Manually add parts, vehicles, mechanics through the app screens.

### Option 2: Via API
Use the API endpoints above to POST test data.

### Option 3: Pre-populate Database

Create a test database migration. Add to `AppDatabase.kt`:

```kotlin
// Add callback to pre-populate test data
.addCallback(object : RoomDatabase.Callback() {
    override fun onCreate(db: SupportSQLiteDatabase) {
        super.onCreate(db)
        // Insert test data here
    }
})
```

---

## Debugging

### View Logs

```bash
# All app logs
adb logcat | grep -E "(Workshop|Ktor|SyncWorker)"

# Server logs only
adb logcat | grep KtorServerService

# Sync worker logs
adb logcat | grep SyncWorker
```

### Check Server Status

The app shows a persistent notification when the Ktor server is running.

### Database Inspection

Use Android Studio's Database Inspector:
1. View → Tool Windows → App Inspection
2. Select your device and app
3. Browse tables directly

---

## Common Issues

### Camera Permission Denied
- Go to Settings → Apps → Workshop Inventory → Permissions → Enable Camera

### Server Not Starting
- Check notification: server runs as foreground service
- Check logcat for Ktor errors
- Ensure port 8080 is not in use

### QR Code Not Scanning
- Ensure good lighting
- QR code must contain valid JSON
- Check camera focus

### Sync Not Running
- Verify network connectivity
- Check WorkManager status in App Inspection
- Sync runs every 15 minutes when connected

---

## Supabase Sync

The app automatically syncs with Supabase every 15 minutes when connected to the internet.

### What Gets Synced

**PULL (Supabase → Tablet):**
- Vehicles - Fleet data managed in web portal syncs to tablet
- Vehicle status updates

**PUSH (Tablet → Supabase):**
- Maintenance records created on tablet
- Vehicle status changes (Maintenance/Available)

### Manual Sync

To trigger an immediate sync programmatically:

```kotlin
// In your Activity/ViewModel
syncManager.triggerImmediateSync()
```

### Checking Sync Status

View sync logs:
```bash
adb logcat | grep SyncWorker
```

Check last sync time in the device_config table using Android Studio's Database Inspector.

### Sync Flow

1. **On Setup:** App pulls vehicles from Supabase
2. **On Maintenance Start:** Record created locally with `sync_status = 'pending'`
3. **Every 15 min:** SyncWorker runs:
   - Pulls latest vehicles from Supabase
   - Pushes pending maintenance records to Supabase
   - Updates `sync_status = 'synced'` for successful records
4. **On Failure:** Records marked as `sync_status = 'failed'`, retried next cycle

---

## Web Portal Integration

To integrate with the FleetCommand web portal:

1. **Generate QR Code in Portal:**
   - Add QR generation in Settings page
   - Encode: orgId, orgName, token, deviceId, supabaseUrl, supabaseAnonKey

2. **Automatic Sync:**
   - Vehicles sync automatically from Supabase to tablet
   - Maintenance records sync from tablet to Supabase
   - No VPN required - uses standard HTTPS

3. **View Tablet Data:**
   - Maintenance records appear in web portal after sync
   - Vehicle status updates reflect in portal

See `api_contracts.md` for embedded server API specification.
