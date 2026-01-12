package com.fleetcommand.workshop.data.repository

import com.fleetcommand.workshop.data.local.dao.DeviceConfigDao
import com.fleetcommand.workshop.data.local.dao.MechanicDao
import com.fleetcommand.workshop.data.local.entities.MechanicEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

interface MechanicRepository {
    fun getAllMechanics(): Flow<List<MechanicEntity>>
    suspend fun getAllMechanicsSync(): List<MechanicEntity>
    fun getActiveMechanics(): Flow<List<MechanicEntity>>
    suspend fun getMechanicById(id: String): MechanicEntity?
    suspend fun addMechanic(mechanic: MechanicEntity)
    suspend fun updateMechanic(mechanic: MechanicEntity)
    suspend fun setMechanicActive(id: String, active: Boolean)
    suspend fun syncMechanics(mechanics: List<MechanicEntity>)
}

class MechanicRepositoryImpl(
    private val mechanicDao: MechanicDao,
    private val deviceConfigDao: DeviceConfigDao
) : MechanicRepository {

    private suspend fun requireOrgId(): String {
        return deviceConfigDao.getOrgId()
            ?: throw IllegalStateException("Device not configured")
    }

    override fun getAllMechanics(): Flow<List<MechanicEntity>> {
        return flow {
            val orgId = requireOrgId()
            mechanicDao.getAllByOrg(orgId).collect { emit(it) }
        }
    }

    override suspend fun getAllMechanicsSync(): List<MechanicEntity> {
        val orgId = requireOrgId()
        return mechanicDao.getAllByOrgSync(orgId)
    }

    override fun getActiveMechanics(): Flow<List<MechanicEntity>> {
        return flow {
            val orgId = requireOrgId()
            mechanicDao.getActiveByOrg(orgId).collect { emit(it) }
        }
    }

    override suspend fun getMechanicById(id: String): MechanicEntity? {
        return mechanicDao.getById(id)
    }

    override suspend fun addMechanic(mechanic: MechanicEntity) {
        val orgId = requireOrgId()
        mechanicDao.insert(mechanic.copy(orgId = orgId))
    }

    override suspend fun updateMechanic(mechanic: MechanicEntity) {
        mechanicDao.update(mechanic)
    }

    override suspend fun setMechanicActive(id: String, active: Boolean) {
        mechanicDao.setActive(id, active)
    }

    override suspend fun syncMechanics(mechanics: List<MechanicEntity>) {
        mechanicDao.insertAll(mechanics)
    }
}
