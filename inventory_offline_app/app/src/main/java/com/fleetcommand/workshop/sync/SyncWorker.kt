package com.fleetcommand.workshop.sync

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.fleetcommand.workshop.data.local.dao.DeviceConfigDao
import com.fleetcommand.workshop.data.local.dao.MaintenanceRecordDao
import com.fleetcommand.workshop.data.local.dao.MechanicDao
import com.fleetcommand.workshop.data.local.dao.VehicleDao
import com.fleetcommand.workshop.data.local.entities.DeviceConfigEntity
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

/**
 * Background worker that syncs local data with Supabase.
 *
 * Sync Strategy:
 * 1. PULL: Vehicles from Supabase → local database (vehicles are managed in web portal)
 * 2. PUSH: Maintenance records from local → Supabase (workshop creates records)
 * 3. Update vehicle status when maintenance starts/completes
 *
 * The tablet is the source of truth for maintenance operations.
 * The web portal is the source of truth for vehicle fleet data.
 */
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted private val context: Context,
    @Assisted params: WorkerParameters,
    private val deviceConfigDao: DeviceConfigDao,
    private val vehicleDao: VehicleDao,
    private val mechanicDao: MechanicDao,
    private val maintenanceRecordDao: MaintenanceRecordDao,
    private val supabaseClient: SupabaseClient
) : CoroutineWorker(context, params) {

    companion object {
        private const val TAG = "SyncWorker"
    }

    override suspend fun doWork(): Result {
        Log.d(TAG, "Starting sync work")

        val config = deviceConfigDao.getConfigSync()
        if (config == null) {
            Log.w(TAG, "Device not configured, skipping sync")
            return Result.success()
        }

        return try {
            // Step 1: Pull vehicles from Supabase
            val vehiclesPulled = pullVehicles(config)
            Log.d(TAG, "Pulled $vehiclesPulled vehicles from Supabase")

            // Step 2: Pull staff/mechanics from Supabase
            val staffPulled = pullStaff(config)
            Log.d(TAG, "Pulled $staffPulled staff members from Supabase")

            // Step 3: Push pending maintenance records to Supabase
            val maintenancePushed = pushMaintenanceRecords(config)
            Log.d(TAG, "Pushed $maintenancePushed maintenance records to Supabase")

            // Step 4: Update last sync timestamp
            deviceConfigDao.updateLastSync(System.currentTimeMillis())

            Log.d(TAG, "Sync completed successfully")
            Result.success()

        } catch (e: Exception) {
            Log.e(TAG, "Sync failed", e)
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }

    /**
     * Pull vehicles from Supabase and update local database.
     * Vehicles are created/managed in the web portal, so we always trust Supabase data.
     */
    private suspend fun pullVehicles(config: DeviceConfigEntity): Int {
        val result = supabaseClient.fetchVehicles(
            supabaseUrl = config.supabaseUrl,
            anonKey = config.supabaseAnonKey,
            accessToken = config.accessToken,
            orgId = config.orgId
        )

        return result.fold(
            onSuccess = { vehicles ->
                Log.d(TAG, "Fetched ${vehicles.size} vehicles from Supabase")

                // Convert to entities and upsert
                val entities = vehicles.map { it.toEntity() }
                vehicleDao.insertAll(entities)

                vehicles.size
            },
            onFailure = { error ->
                Log.e(TAG, "Failed to fetch vehicles: ${error.message}")
                throw error
            }
        )
    }

    /**
     * Pull staff from Supabase and update local database.
     * Filters by workshop-related departments (Maintenance, Workshop, Service).
     */
    private suspend fun pullStaff(config: DeviceConfigEntity): Int {
        val result = supabaseClient.fetchStaff(
            supabaseUrl = config.supabaseUrl,
            anonKey = config.supabaseAnonKey,
            accessToken = config.accessToken,
            orgId = config.orgId
        )

        return result.fold(
            onSuccess = { staff ->
                Log.d(TAG, "Fetched ${staff.size} staff members from Supabase")

                // Convert to entities and upsert
                val entities = staff.map { it.toEntity() }
                mechanicDao.insertAll(entities)

                staff.size
            },
            onFailure = { error ->
                Log.e(TAG, "Failed to fetch staff: ${error.message}")
                // Don't throw - staff sync failure shouldn't block other syncs
                0
            }
        )
    }

    /**
     * Push pending maintenance records to Supabase.
     * Records created on the tablet are pushed to the cloud.
     */
    private suspend fun pushMaintenanceRecords(config: DeviceConfigEntity): Int {
        // Get records that haven't been synced yet
        val pendingRecords = maintenanceRecordDao.getPendingSync(config.orgId)

        if (pendingRecords.isEmpty()) {
            Log.d(TAG, "No pending maintenance records to sync")
            return 0
        }

        Log.d(TAG, "Found ${pendingRecords.size} pending maintenance records")

        // Convert to Supabase DTOs
        val supabaseRecords = pendingRecords.map { SupabaseMaintenanceRecord.fromEntity(it) }

        // Push to Supabase
        val result = supabaseClient.upsertMaintenanceRecords(
            supabaseUrl = config.supabaseUrl,
            anonKey = config.supabaseAnonKey,
            accessToken = config.accessToken,
            records = supabaseRecords
        )

        return result.fold(
            onSuccess = { syncedRecords ->
                Log.d(TAG, "Successfully synced ${syncedRecords.size} maintenance records")

                // Mark as synced in local database
                val syncedIds = syncedRecords.map { it.id }
                maintenanceRecordDao.updateSyncStatusBatch(syncedIds, "synced")

                // Update vehicle status in Supabase for any in-progress maintenance
                syncedRecords.forEach { record ->
                    if (record.status == "In Shop" || record.currentStep == "In Shop") {
                        supabaseClient.updateVehicleStatus(
                            supabaseUrl = config.supabaseUrl,
                            anonKey = config.supabaseAnonKey,
                            accessToken = config.accessToken,
                            vehicleId = record.vehicleId,
                            status = "Maintenance"
                        )
                    } else if (record.status == "Done" || record.currentStep == "Done") {
                        supabaseClient.updateVehicleStatus(
                            supabaseUrl = config.supabaseUrl,
                            anonKey = config.supabaseAnonKey,
                            accessToken = config.accessToken,
                            vehicleId = record.vehicleId,
                            status = "Available"
                        )
                    }
                }

                syncedRecords.size
            },
            onFailure = { error ->
                Log.e(TAG, "Failed to sync maintenance records: ${error.message}")

                // Mark as failed so we can retry later
                pendingRecords.forEach { record ->
                    maintenanceRecordDao.updateSyncStatus(record.id, "failed")
                }

                throw error
            }
        )
    }
}
