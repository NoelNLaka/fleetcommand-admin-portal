package com.fleetcommand.workshop.data.repository

import com.fleetcommand.workshop.data.local.dao.DeviceConfigDao
import com.fleetcommand.workshop.data.local.dao.ShiftReportDao
import com.fleetcommand.workshop.data.local.entities.ShiftReportEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.util.UUID

interface ShiftReportRepository {
    fun getAllReports(): Flow<List<ShiftReportEntity>>
    suspend fun getAllReportsSync(): List<ShiftReportEntity>
    fun getLatestReport(): Flow<ShiftReportEntity?>
    suspend fun getLatestReportSync(): ShiftReportEntity?
    suspend fun getReportById(id: String): ShiftReportEntity?
    suspend fun submitReport(mechanicId: String, summary: String): ShiftReportEntity
    suspend fun lockReport(id: String)
    suspend fun getLastLockedTimestamp(): Long?
}

class ShiftReportRepositoryImpl(
    private val shiftReportDao: ShiftReportDao,
    private val deviceConfigDao: DeviceConfigDao
) : ShiftReportRepository {

    private suspend fun requireOrgId(): String {
        return deviceConfigDao.getOrgId()
            ?: throw IllegalStateException("Device not configured")
    }

    override fun getAllReports(): Flow<List<ShiftReportEntity>> {
        return flow {
            val orgId = requireOrgId()
            shiftReportDao.getAllByOrg(orgId).collect { emit(it) }
        }
    }

    override suspend fun getAllReportsSync(): List<ShiftReportEntity> {
        val orgId = requireOrgId()
        return shiftReportDao.getAllByOrgSync(orgId)
    }

    override fun getLatestReport(): Flow<ShiftReportEntity?> {
        return flow {
            val orgId = requireOrgId()
            shiftReportDao.getLatest(orgId).collect { emit(it) }
        }
    }

    override suspend fun getLatestReportSync(): ShiftReportEntity? {
        val orgId = requireOrgId()
        return shiftReportDao.getLatestSync(orgId)
    }

    override suspend fun getReportById(id: String): ShiftReportEntity? {
        return shiftReportDao.getById(id)
    }

    override suspend fun submitReport(mechanicId: String, summary: String): ShiftReportEntity {
        val orgId = requireOrgId()
        val report = ShiftReportEntity(
            id = UUID.randomUUID().toString(),
            orgId = orgId,
            mechanicId = mechanicId,
            summary = summary,
            locked = true // Lock immediately upon submission
        )
        shiftReportDao.insert(report)
        return report
    }

    override suspend fun lockReport(id: String) {
        shiftReportDao.lock(id)
    }

    override suspend fun getLastLockedTimestamp(): Long? {
        val orgId = requireOrgId()
        return shiftReportDao.getLastLockedTimestamp(orgId)
    }
}
