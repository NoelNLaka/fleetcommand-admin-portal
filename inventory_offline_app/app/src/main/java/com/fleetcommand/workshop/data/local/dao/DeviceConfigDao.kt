package com.fleetcommand.workshop.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.fleetcommand.workshop.data.local.entities.DeviceConfigEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DeviceConfigDao {
    @Query("SELECT * FROM device_config WHERE id = 1")
    fun getConfig(): Flow<DeviceConfigEntity?>

    @Query("SELECT * FROM device_config WHERE id = 1")
    suspend fun getConfigSync(): DeviceConfigEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveConfig(config: DeviceConfigEntity)

    @Query("DELETE FROM device_config")
    suspend fun clearConfig()

    @Query("SELECT org_id FROM device_config WHERE id = 1")
    suspend fun getOrgId(): String?

    @Query("UPDATE device_config SET last_sync_at = :timestamp WHERE id = 1")
    suspend fun updateLastSync(timestamp: Long)
}
