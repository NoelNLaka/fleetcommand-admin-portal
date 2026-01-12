package com.fleetcommand.workshop.data.repository

import com.fleetcommand.workshop.data.local.dao.DeviceConfigDao
import com.fleetcommand.workshop.data.local.entities.DeviceConfigEntity
import kotlinx.coroutines.flow.Flow

interface DeviceConfigRepository {
    fun getConfig(): Flow<DeviceConfigEntity?>
    suspend fun getConfigSync(): DeviceConfigEntity?
    suspend fun saveConfig(config: DeviceConfigEntity)
    suspend fun clearConfig()
    suspend fun getOrgId(): String?
    suspend fun isDeviceSetup(): Boolean
}

class DeviceConfigRepositoryImpl(
    private val deviceConfigDao: DeviceConfigDao
) : DeviceConfigRepository {

    override fun getConfig(): Flow<DeviceConfigEntity?> {
        return deviceConfigDao.getConfig()
    }

    override suspend fun getConfigSync(): DeviceConfigEntity? {
        return deviceConfigDao.getConfigSync()
    }

    override suspend fun saveConfig(config: DeviceConfigEntity) {
        deviceConfigDao.saveConfig(config)
    }

    override suspend fun clearConfig() {
        deviceConfigDao.clearConfig()
    }

    override suspend fun getOrgId(): String? {
        return deviceConfigDao.getOrgId()
    }

    override suspend fun isDeviceSetup(): Boolean {
        return deviceConfigDao.getConfigSync() != null
    }
}
