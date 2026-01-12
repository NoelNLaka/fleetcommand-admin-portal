package com.fleetcommand.workshop.data.repository

import android.util.Log
import com.fleetcommand.workshop.data.local.dao.DeviceConfigDao
import com.fleetcommand.workshop.data.local.dao.MaintenancePartDao
import com.fleetcommand.workshop.data.local.dao.MaintenanceRecordDao
import com.fleetcommand.workshop.data.local.dao.MaintenanceWithParts
import com.fleetcommand.workshop.data.local.dao.MaintenanceWithVehicle
import com.fleetcommand.workshop.data.local.dao.VehicleDao
import com.fleetcommand.workshop.data.local.entities.MaintenancePartEntity
import com.fleetcommand.workshop.data.local.entities.MaintenanceRecordEntity
import com.fleetcommand.workshop.sync.SyncManager
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.util.UUID

private const val TAG = "MaintenanceRepository"

interface MaintenanceRepository {
    fun getAllWithVehicle(): Flow<List<MaintenanceWithVehicle>>
    fun getOpenRecords(): Flow<List<MaintenanceRecordEntity>>
    suspend fun getOpenRecordsSync(): List<MaintenanceRecordEntity>
    suspend fun countOpen(): Int
    suspend fun getCompletedCount(): Int
    suspend fun getInProgressCount(): Int
    suspend fun getRecordById(id: String): MaintenanceRecordEntity?
    suspend fun getRecordWithParts(id: String): MaintenanceWithParts?
    suspend fun startMaintenance(
        vehicleId: String,
        mechanicId: String,
        mechanicName: String,
        serviceType: String,
        notes: String? = null,
        arrivalMileage: Int? = null,
        costEstimate: Double? = null
    ): MaintenanceRecordEntity
    suspend fun completeMaintenance(id: String)
    suspend fun updateStep(id: String, step: String)
    suspend fun addPartToMaintenance(maintenanceId: String, partId: String, quantity: Int)
    fun getPartsByMaintenance(maintenanceId: String): Flow<List<MaintenancePartEntity>>
}

class MaintenanceRepositoryImpl(
    private val maintenanceRecordDao: MaintenanceRecordDao,
    private val maintenancePartDao: MaintenancePartDao,
    private val vehicleDao: VehicleDao,
    private val deviceConfigDao: DeviceConfigDao,
    private val syncManager: SyncManager
) : MaintenanceRepository {

    private suspend fun requireOrgId(): String {
        return deviceConfigDao.getOrgId()
            ?: throw IllegalStateException("Device not configured")
    }

    override fun getAllWithVehicle(): Flow<List<MaintenanceWithVehicle>> {
        return flow {
            val orgId = requireOrgId()
            maintenanceRecordDao.getAllWithVehicle(orgId).collect { emit(it) }
        }
    }

    override fun getOpenRecords(): Flow<List<MaintenanceRecordEntity>> {
        return flow {
            val orgId = requireOrgId()
            maintenanceRecordDao.getOpen(orgId).collect { emit(it) }
        }
    }

    override suspend fun getOpenRecordsSync(): List<MaintenanceRecordEntity> {
        val orgId = requireOrgId()
        return maintenanceRecordDao.getOpenSync(orgId)
    }

    override suspend fun countOpen(): Int {
        val orgId = requireOrgId()
        return maintenanceRecordDao.countOpen(orgId)
    }

    override suspend fun getCompletedCount(): Int {
        val orgId = requireOrgId()
        return maintenanceRecordDao.countCompleted(orgId)
    }

    override suspend fun getInProgressCount(): Int {
        val orgId = requireOrgId()
        return maintenanceRecordDao.countOpen(orgId)
    }

    override suspend fun getRecordById(id: String): MaintenanceRecordEntity? {
        return maintenanceRecordDao.getById(id)
    }

    override suspend fun getRecordWithParts(id: String): MaintenanceWithParts? {
        return maintenanceRecordDao.getWithParts(id)
    }

    override suspend fun startMaintenance(
        vehicleId: String,
        mechanicId: String,
        mechanicName: String,
        serviceType: String,
        notes: String?,
        arrivalMileage: Int?,
        costEstimate: Double?
    ): MaintenanceRecordEntity {
        Log.d(TAG, "startMaintenance called: vehicleId=$vehicleId, mechanicId=$mechanicId, serviceType=$serviceType")

        val orgId = requireOrgId()
        Log.d(TAG, "Got orgId: $orgId")

        val today = java.time.LocalDate.now().toString()
        val recordId = UUID.randomUUID().toString()

        val record = MaintenanceRecordEntity(
            id = recordId,
            orgId = orgId,
            vehicleId = vehicleId,
            mechanicId = mechanicId,
            serviceType = serviceType,
            assigneeName = mechanicName,
            costEstimate = costEstimate,
            scheduledDate = today,
            arrivalMileage = arrivalMileage,
            notes = notes,
            currentStep = "In Shop",
            status = "In Shop",
            syncStatus = "pending"
        )

        Log.d(TAG, "Created MaintenanceRecordEntity: id=$recordId")

        try {
            maintenanceRecordDao.insert(record)
            Log.d(TAG, "Successfully inserted maintenance record into local DB")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to insert maintenance record: ${e.message}", e)
            throw e
        }

        try {
            vehicleDao.updateStatus(vehicleId, "Maintenance")
            Log.d(TAG, "Updated vehicle status to Maintenance")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update vehicle status: ${e.message}", e)
        }

        // Trigger immediate sync to push the new record to Supabase
        Log.d(TAG, "Triggering immediate sync...")
        syncManager.triggerImmediateSync()

        return record
    }

    override suspend fun completeMaintenance(id: String) {
        val record = maintenanceRecordDao.getById(id)
        if (record != null) {
            maintenanceRecordDao.complete(id)
            vehicleDao.updateStatus(record.vehicleId, "Available")
        }
    }

    override suspend fun updateStep(id: String, step: String) {
        val record = maintenanceRecordDao.getById(id)
        if (record != null) {
            maintenanceRecordDao.update(record.copy(
                currentStep = step,
                status = step,
                updatedAt = System.currentTimeMillis()
            ))
        }
    }

    override suspend fun addPartToMaintenance(maintenanceId: String, partId: String, quantity: Int) {
        val orgId = requireOrgId()
        val part = MaintenancePartEntity(
            id = UUID.randomUUID().toString(),
            orgId = orgId,
            maintenanceId = maintenanceId,
            partId = partId,
            quantity = quantity
        )
        maintenancePartDao.insert(part)
    }

    override fun getPartsByMaintenance(maintenanceId: String): Flow<List<MaintenancePartEntity>> {
        return maintenancePartDao.getByMaintenance(maintenanceId)
    }
}
