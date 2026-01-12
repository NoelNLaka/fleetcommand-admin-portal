package com.fleetcommand.workshop.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.fleetcommand.workshop.data.local.entities.ShiftReportEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ShiftReportDao {
    @Query("SELECT * FROM shift_reports WHERE org_id = :orgId ORDER BY created_at DESC")
    fun getAllByOrg(orgId: String): Flow<List<ShiftReportEntity>>

    @Query("SELECT * FROM shift_reports WHERE org_id = :orgId ORDER BY created_at DESC")
    suspend fun getAllByOrgSync(orgId: String): List<ShiftReportEntity>

    @Query("SELECT * FROM shift_reports WHERE org_id = :orgId ORDER BY created_at DESC LIMIT 1")
    fun getLatest(orgId: String): Flow<ShiftReportEntity?>

    @Query("SELECT * FROM shift_reports WHERE org_id = :orgId ORDER BY created_at DESC LIMIT 1")
    suspend fun getLatestSync(orgId: String): ShiftReportEntity?

    @Query("SELECT * FROM shift_reports WHERE mechanic_id = :mechanicId ORDER BY created_at DESC")
    fun getByMechanic(mechanicId: String): Flow<List<ShiftReportEntity>>

    @Query("SELECT * FROM shift_reports WHERE id = :id")
    suspend fun getById(id: String): ShiftReportEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(report: ShiftReportEntity)

    @Update
    suspend fun update(report: ShiftReportEntity)

    @Query("UPDATE shift_reports SET locked = 1 WHERE id = :id")
    suspend fun lock(id: String)

    @Query("SELECT COUNT(*) FROM shift_reports WHERE org_id = :orgId")
    suspend fun countAll(orgId: String): Int

    @Query("SELECT created_at FROM shift_reports WHERE org_id = :orgId AND locked = 1 ORDER BY created_at DESC LIMIT 1")
    suspend fun getLastLockedTimestamp(orgId: String): Long?
}
