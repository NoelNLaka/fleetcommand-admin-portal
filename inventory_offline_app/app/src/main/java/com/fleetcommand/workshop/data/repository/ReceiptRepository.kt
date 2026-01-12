package com.fleetcommand.workshop.data.repository

import com.fleetcommand.workshop.data.local.dao.DeviceConfigDao
import com.fleetcommand.workshop.data.local.dao.ReceiptDao
import com.fleetcommand.workshop.data.local.entities.ReceiptEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.util.UUID

interface ReceiptRepository {
    fun getAllReceipts(): Flow<List<ReceiptEntity>>
    suspend fun getAllReceiptsSync(): List<ReceiptEntity>
    fun getUnpaidReceipts(): Flow<List<ReceiptEntity>>
    suspend fun getReceiptById(id: String): ReceiptEntity?
    suspend fun addReceipt(
        supplier: String,
        amount: Double,
        invoiceNumber: String?,
        paid: Boolean = false
    ): ReceiptEntity
    suspend fun updatePaidStatus(id: String, paid: Boolean)
    suspend fun updateImagePath(id: String, imagePath: String)
    suspend fun getTotalUnpaid(): Double
    suspend fun getTotalAmount(): Double
}

class ReceiptRepositoryImpl(
    private val receiptDao: ReceiptDao,
    private val deviceConfigDao: DeviceConfigDao
) : ReceiptRepository {

    private suspend fun requireOrgId(): String {
        return deviceConfigDao.getOrgId()
            ?: throw IllegalStateException("Device not configured")
    }

    override fun getAllReceipts(): Flow<List<ReceiptEntity>> {
        return flow {
            val orgId = requireOrgId()
            receiptDao.getAllByOrg(orgId).collect { emit(it) }
        }
    }

    override suspend fun getAllReceiptsSync(): List<ReceiptEntity> {
        val orgId = requireOrgId()
        return receiptDao.getAllByOrgSync(orgId)
    }

    override fun getUnpaidReceipts(): Flow<List<ReceiptEntity>> {
        return flow {
            val orgId = requireOrgId()
            receiptDao.getUnpaid(orgId).collect { emit(it) }
        }
    }

    override suspend fun getReceiptById(id: String): ReceiptEntity? {
        return receiptDao.getById(id)
    }

    override suspend fun addReceipt(
        supplier: String,
        amount: Double,
        invoiceNumber: String?,
        paid: Boolean
    ): ReceiptEntity {
        val orgId = requireOrgId()
        val receipt = ReceiptEntity(
            id = UUID.randomUUID().toString(),
            orgId = orgId,
            supplier = supplier,
            amount = amount,
            invoiceNumber = invoiceNumber,
            imagePath = null,
            paid = paid
        )
        receiptDao.insert(receipt)
        return receipt
    }

    override suspend fun updatePaidStatus(id: String, paid: Boolean) {
        receiptDao.updatePaidStatus(id, paid)
    }

    override suspend fun updateImagePath(id: String, imagePath: String) {
        receiptDao.updateImagePath(id, imagePath)
    }

    override suspend fun getTotalUnpaid(): Double {
        val orgId = requireOrgId()
        return receiptDao.getTotalUnpaid(orgId) ?: 0.0
    }

    override suspend fun getTotalAmount(): Double {
        val orgId = requireOrgId()
        return receiptDao.getTotalAmount(orgId) ?: 0.0
    }
}
