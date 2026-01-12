package com.fleetcommand.workshop.data.repository

import com.fleetcommand.workshop.data.local.dao.DeviceConfigDao
import com.fleetcommand.workshop.data.local.dao.InventoryMovementDao
import com.fleetcommand.workshop.data.local.dao.PartDao
import com.fleetcommand.workshop.data.local.dao.PartWithStock
import com.fleetcommand.workshop.data.local.entities.InventoryMovementEntity
import com.fleetcommand.workshop.data.local.entities.PartEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow
import java.util.UUID

interface InventoryRepository {
    fun getInventoryLevels(): Flow<List<PartWithStock>>
    suspend fun getInventoryLevelsSync(): List<PartWithStock>
    fun getLowStockItems(): Flow<List<PartWithStock>>
    suspend fun countLowStockItems(): Int
    fun getParts(): Flow<List<PartEntity>>
    fun getCategories(): Flow<List<String>>
    suspend fun getPartById(id: String): PartEntity?
    suspend fun addPart(part: PartEntity)
    suspend fun updatePart(part: PartEntity)
    suspend fun deletePart(id: String)
    fun getMovementsByPart(partId: String): Flow<List<InventoryMovementEntity>>
    suspend fun recordMovement(
        partId: String,
        quantity: Int,
        movementType: String,
        reason: String?,
        vehicleId: String? = null,
        mechanicId: String? = null,
        referenceId: String? = null
    )
    suspend fun getStockLevel(partId: String): Int
}

class InventoryRepositoryImpl(
    private val partDao: PartDao,
    private val inventoryMovementDao: InventoryMovementDao,
    private val deviceConfigDao: DeviceConfigDao
) : InventoryRepository {

    private suspend fun requireOrgId(): String {
        return deviceConfigDao.getOrgId()
            ?: throw IllegalStateException("Device not configured")
    }

    override fun getInventoryLevels(): Flow<List<PartWithStock>> {
        return try {
            kotlinx.coroutines.flow.flow {
                val orgId = requireOrgId()
                inventoryMovementDao.getInventoryLevels(orgId).collect { emit(it) }
            }
        } catch (e: Exception) {
            emptyFlow()
        }
    }

    override suspend fun getInventoryLevelsSync(): List<PartWithStock> {
        val orgId = requireOrgId()
        return inventoryMovementDao.getInventoryLevelsSync(orgId)
    }

    override fun getLowStockItems(): Flow<List<PartWithStock>> {
        return kotlinx.coroutines.flow.flow {
            val orgId = requireOrgId()
            inventoryMovementDao.getLowStockItems(orgId).collect { emit(it) }
        }
    }

    override suspend fun countLowStockItems(): Int {
        val orgId = requireOrgId()
        return inventoryMovementDao.countLowStockItems(orgId)
    }

    override fun getParts(): Flow<List<PartEntity>> {
        return kotlinx.coroutines.flow.flow {
            val orgId = requireOrgId()
            partDao.getAllByOrg(orgId).collect { emit(it) }
        }
    }

    override fun getCategories(): Flow<List<String>> {
        return kotlinx.coroutines.flow.flow {
            val orgId = requireOrgId()
            partDao.getCategories(orgId).collect { emit(it) }
        }
    }

    override suspend fun getPartById(id: String): PartEntity? {
        return partDao.getById(id)
    }

    override suspend fun addPart(part: PartEntity) {
        val orgId = requireOrgId()
        partDao.insert(part.copy(orgId = orgId))
    }

    override suspend fun updatePart(part: PartEntity) {
        partDao.update(part)
    }

    override suspend fun deletePart(id: String) {
        partDao.delete(id)
    }

    override fun getMovementsByPart(partId: String): Flow<List<InventoryMovementEntity>> {
        return inventoryMovementDao.getByPart(partId)
    }

    override suspend fun recordMovement(
        partId: String,
        quantity: Int,
        movementType: String,
        reason: String?,
        vehicleId: String?,
        mechanicId: String?,
        referenceId: String?
    ) {
        val orgId = requireOrgId()
        val movement = InventoryMovementEntity(
            id = UUID.randomUUID().toString(),
            orgId = orgId,
            partId = partId,
            quantity = quantity,
            movementType = movementType,
            reason = reason,
            vehicleId = vehicleId,
            mechanicId = mechanicId,
            referenceId = referenceId
        )
        inventoryMovementDao.insert(movement)
    }

    override suspend fun getStockLevel(partId: String): Int {
        return inventoryMovementDao.getStockLevel(partId)
    }
}
