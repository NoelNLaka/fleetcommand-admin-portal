package com.fleetcommand.workshop.data.local.dao

import androidx.room.Dao
import androidx.room.Embedded
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Relation
import androidx.room.Transaction
import androidx.room.Update
import com.fleetcommand.workshop.data.local.entities.MaintenancePartEntity
import com.fleetcommand.workshop.data.local.entities.MaintenanceRecordEntity
import com.fleetcommand.workshop.data.local.entities.VehicleEntity
import kotlinx.coroutines.flow.Flow

/**
 * Data class for maintenance with parts used.
 */
data class MaintenanceWithParts(
    @Embedded val maintenance: MaintenanceRecordEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "maintenance_id"
    )
    val parts: List<MaintenancePartEntity>
)

/**
 * Data class for maintenance with vehicle info.
 */
data class MaintenanceWithVehicle(
    @Embedded val maintenance: MaintenanceRecordEntity,
    @Relation(
        parentColumn = "vehicle_id",
        entityColumn = "id"
    )
    val vehicle: VehicleEntity?
)

@Dao
interface MaintenanceRecordDao {
    @Query("SELECT * FROM maintenance_records WHERE org_id = :orgId ORDER BY started_at DESC")
    fun getAllByOrg(orgId: String): Flow<List<MaintenanceRecordEntity>>

    @Query("SELECT * FROM maintenance_records WHERE org_id = :orgId ORDER BY started_at DESC")
    suspend fun getAllByOrgSync(orgId: String): List<MaintenanceRecordEntity>

    @Query("SELECT * FROM maintenance_records WHERE org_id = :orgId AND status NOT IN ('Done', 'completed') ORDER BY started_at DESC")
    fun getOpen(orgId: String): Flow<List<MaintenanceRecordEntity>>

    @Query("SELECT * FROM maintenance_records WHERE org_id = :orgId AND status NOT IN ('Done', 'completed') ORDER BY started_at DESC")
    suspend fun getOpenSync(orgId: String): List<MaintenanceRecordEntity>

    @Query("SELECT * FROM maintenance_records WHERE org_id = :orgId AND status = 'completed' ORDER BY completed_at DESC")
    fun getCompleted(orgId: String): Flow<List<MaintenanceRecordEntity>>

    @Query("SELECT * FROM maintenance_records WHERE vehicle_id = :vehicleId ORDER BY started_at DESC")
    fun getByVehicle(vehicleId: String): Flow<List<MaintenanceRecordEntity>>

    @Query("SELECT * FROM maintenance_records WHERE mechanic_id = :mechanicId ORDER BY started_at DESC")
    fun getByMechanic(mechanicId: String): Flow<List<MaintenanceRecordEntity>>

    @Query("SELECT * FROM maintenance_records WHERE id = :id")
    suspend fun getById(id: String): MaintenanceRecordEntity?

    @Transaction
    @Query("SELECT * FROM maintenance_records WHERE id = :id")
    suspend fun getWithParts(id: String): MaintenanceWithParts?

    @Transaction
    @Query("SELECT * FROM maintenance_records WHERE org_id = :orgId ORDER BY started_at DESC")
    fun getAllWithVehicle(orgId: String): Flow<List<MaintenanceWithVehicle>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(record: MaintenanceRecordEntity)

    @Update
    suspend fun update(record: MaintenanceRecordEntity)

    @Query("UPDATE maintenance_records SET status = 'completed', completed_at = :completedAt WHERE id = :id")
    suspend fun complete(id: String, completedAt: Long = System.currentTimeMillis())

    @Query("SELECT COUNT(*) FROM maintenance_records WHERE org_id = :orgId AND status NOT IN ('Done', 'completed')")
    suspend fun countOpen(orgId: String): Int

    @Query("SELECT COUNT(*) FROM maintenance_records WHERE org_id = :orgId AND status IN ('Done', 'completed')")
    suspend fun countCompleted(orgId: String): Int

    @Query("SELECT * FROM maintenance_records WHERE org_id = :orgId AND sync_status = 'pending'")
    suspend fun getPendingSync(orgId: String): List<MaintenanceRecordEntity>

    @Query("UPDATE maintenance_records SET sync_status = :syncStatus WHERE id = :id")
    suspend fun updateSyncStatus(id: String, syncStatus: String)

    @Query("UPDATE maintenance_records SET sync_status = :syncStatus WHERE id IN (:ids)")
    suspend fun updateSyncStatusBatch(ids: List<String>, syncStatus: String)
}

@Dao
interface MaintenancePartDao {
    @Query("SELECT * FROM maintenance_parts WHERE maintenance_id = :maintenanceId")
    fun getByMaintenance(maintenanceId: String): Flow<List<MaintenancePartEntity>>

    @Query("SELECT * FROM maintenance_parts WHERE maintenance_id = :maintenanceId")
    suspend fun getByMaintenanceSync(maintenanceId: String): List<MaintenancePartEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(part: MaintenancePartEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(parts: List<MaintenancePartEntity>)

    @Query("DELETE FROM maintenance_parts WHERE maintenance_id = :maintenanceId")
    suspend fun deleteByMaintenance(maintenanceId: String)
}
