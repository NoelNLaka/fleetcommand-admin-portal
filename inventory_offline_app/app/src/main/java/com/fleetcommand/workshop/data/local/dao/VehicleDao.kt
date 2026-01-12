package com.fleetcommand.workshop.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.fleetcommand.workshop.data.local.entities.VehicleEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface VehicleDao {
    @Query("SELECT * FROM vehicles WHERE org_id = :orgId ORDER BY plate ASC")
    fun getAllByOrg(orgId: String): Flow<List<VehicleEntity>>

    @Query("SELECT * FROM vehicles WHERE org_id = :orgId ORDER BY plate ASC")
    suspend fun getAllByOrgSync(orgId: String): List<VehicleEntity>

    @Query("SELECT * FROM vehicles WHERE org_id = :orgId AND status = :status ORDER BY plate ASC")
    fun getByStatus(orgId: String, status: String): Flow<List<VehicleEntity>>

    @Query("SELECT * FROM vehicles WHERE org_id = :orgId AND status = 'maintenance'")
    fun getInMaintenance(orgId: String): Flow<List<VehicleEntity>>

    @Query("SELECT * FROM vehicles WHERE id = :id")
    suspend fun getById(id: String): VehicleEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(vehicle: VehicleEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(vehicles: List<VehicleEntity>)

    @Update
    suspend fun update(vehicle: VehicleEntity)

    @Query("UPDATE vehicles SET status = :status WHERE id = :id")
    suspend fun updateStatus(id: String, status: String)

    @Query("SELECT COUNT(*) FROM vehicles WHERE org_id = :orgId")
    suspend fun countAll(orgId: String): Int

    @Query("SELECT COUNT(*) FROM vehicles WHERE org_id = :orgId AND status = 'maintenance'")
    suspend fun countInMaintenance(orgId: String): Int
}
