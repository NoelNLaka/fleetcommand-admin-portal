package com.fleetcommand.workshop.data.repository

import com.fleetcommand.workshop.data.local.dao.DeviceConfigDao
import com.fleetcommand.workshop.data.local.dao.PartRequestDao
import com.fleetcommand.workshop.data.local.dao.PartRequestItemDao
import com.fleetcommand.workshop.data.local.dao.PartRequestWithItems
import com.fleetcommand.workshop.data.local.entities.PartRequestEntity
import com.fleetcommand.workshop.data.local.entities.PartRequestItemEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.util.UUID

data class RequestItem(
    val partName: String,
    val quantity: Int
)

interface RequestRepository {
    fun getAllWithItems(): Flow<List<PartRequestWithItems>>
    fun getPendingRequests(): Flow<List<PartRequestEntity>>
    suspend fun getPendingRequestsSync(): List<PartRequestEntity>
    suspend fun countPending(): Int
    suspend fun getRequestById(id: String): PartRequestEntity?
    suspend fun getRequestWithItems(id: String): PartRequestWithItems?
    suspend fun createRequest(
        requestedBy: String,
        items: List<RequestItem>,
        notes: String?
    ): PartRequestEntity
    suspend fun updateStatus(id: String, status: String)
}

class RequestRepositoryImpl(
    private val partRequestDao: PartRequestDao,
    private val partRequestItemDao: PartRequestItemDao,
    private val deviceConfigDao: DeviceConfigDao
) : RequestRepository {

    private suspend fun requireOrgId(): String {
        return deviceConfigDao.getOrgId()
            ?: throw IllegalStateException("Device not configured")
    }

    override fun getAllWithItems(): Flow<List<PartRequestWithItems>> {
        return flow {
            val orgId = requireOrgId()
            partRequestDao.getAllWithItems(orgId).collect { emit(it) }
        }
    }

    override fun getPendingRequests(): Flow<List<PartRequestEntity>> {
        return flow {
            val orgId = requireOrgId()
            partRequestDao.getPending(orgId).collect { emit(it) }
        }
    }

    override suspend fun getPendingRequestsSync(): List<PartRequestEntity> {
        val orgId = requireOrgId()
        return partRequestDao.getPendingSync(orgId)
    }

    override suspend fun countPending(): Int {
        val orgId = requireOrgId()
        return partRequestDao.countPending(orgId)
    }

    override suspend fun getRequestById(id: String): PartRequestEntity? {
        return partRequestDao.getById(id)
    }

    override suspend fun getRequestWithItems(id: String): PartRequestWithItems? {
        return partRequestDao.getWithItems(id)
    }

    override suspend fun createRequest(
        requestedBy: String,
        items: List<RequestItem>,
        notes: String?
    ): PartRequestEntity {
        val orgId = requireOrgId()
        val requestId = UUID.randomUUID().toString()

        val request = PartRequestEntity(
            id = requestId,
            orgId = orgId,
            requestedBy = requestedBy,
            status = "pending",
            notes = notes
        )
        partRequestDao.insert(request)

        val itemEntities = items.map { item ->
            PartRequestItemEntity(
                id = UUID.randomUUID().toString(),
                orgId = orgId,
                requestId = requestId,
                partName = item.partName,
                quantity = item.quantity
            )
        }
        partRequestItemDao.insertAll(itemEntities)

        return request
    }

    override suspend fun updateStatus(id: String, status: String) {
        partRequestDao.updateStatus(id, status)
    }
}
