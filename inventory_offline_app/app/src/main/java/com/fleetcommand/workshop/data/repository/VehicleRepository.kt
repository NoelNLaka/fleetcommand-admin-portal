package com.fleetcommand.workshop.data.repository

import com.fleetcommand.workshop.data.local.dao.DeviceConfigDao
import com.fleetcommand.workshop.data.local.dao.VehicleDao
import com.fleetcommand.workshop.data.local.entities.VehicleEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

interface VehicleRepository {
    fun getAllVehicles(): Flow<List<VehicleEntity>>
    suspend fun getAllVehiclesSync(): List<VehicleEntity>
    fun getVehiclesByStatus(status: String): Flow<List<VehicleEntity>>
    fun getVehiclesInMaintenance(): Flow<List<VehicleEntity>>
    suspend fun getVehicleById(id: String): VehicleEntity?
    suspend fun addVehicle(vehicle: VehicleEntity)
    suspend fun updateVehicle(vehicle: VehicleEntity)
    suspend fun updateVehicleStatus(id: String, status: String)
    suspend fun syncVehicles(vehicles: List<VehicleEntity>)
}

class VehicleRepositoryImpl(
    private val vehicleDao: VehicleDao,
    private val deviceConfigDao: DeviceConfigDao
) : VehicleRepository {

    private suspend fun requireOrgId(): String {
        return deviceConfigDao.getOrgId()
            ?: throw IllegalStateException("Device not configured")
    }

    override fun getAllVehicles(): Flow<List<VehicleEntity>> {
        return flow {
            val orgId = requireOrgId()
            vehicleDao.getAllByOrg(orgId).collect { emit(it) }
        }
    }

    override suspend fun getAllVehiclesSync(): List<VehicleEntity> {
        val orgId = requireOrgId()
        return vehicleDao.getAllByOrgSync(orgId)
    }

    override fun getVehiclesByStatus(status: String): Flow<List<VehicleEntity>> {
        return flow {
            val orgId = requireOrgId()
            vehicleDao.getByStatus(orgId, status).collect { emit(it) }
        }
    }

    override fun getVehiclesInMaintenance(): Flow<List<VehicleEntity>> {
        return flow {
            val orgId = requireOrgId()
            vehicleDao.getInMaintenance(orgId).collect { emit(it) }
        }
    }

    override suspend fun getVehicleById(id: String): VehicleEntity? {
        return vehicleDao.getById(id)
    }

    override suspend fun addVehicle(vehicle: VehicleEntity) {
        val orgId = requireOrgId()
        vehicleDao.insert(vehicle.copy(orgId = orgId))
    }

    override suspend fun updateVehicle(vehicle: VehicleEntity) {
        vehicleDao.update(vehicle)
    }

    override suspend fun updateVehicleStatus(id: String, status: String) {
        vehicleDao.updateStatus(id, status)
    }

    override suspend fun syncVehicles(vehicles: List<VehicleEntity>) {
        vehicleDao.insertAll(vehicles)
    }
}
