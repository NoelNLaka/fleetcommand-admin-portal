package com.fleetcommand.workshop.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.fleetcommand.workshop.data.local.entities.MechanicEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface MechanicDao {
    @Query("SELECT * FROM mechanics WHERE org_id = :orgId ORDER BY name ASC")
    fun getAllByOrg(orgId: String): Flow<List<MechanicEntity>>

    @Query("SELECT * FROM mechanics WHERE org_id = :orgId ORDER BY name ASC")
    suspend fun getAllByOrgSync(orgId: String): List<MechanicEntity>

    @Query("SELECT * FROM mechanics WHERE org_id = :orgId AND active = 1 ORDER BY name ASC")
    fun getActiveByOrg(orgId: String): Flow<List<MechanicEntity>>

    @Query("SELECT * FROM mechanics WHERE id = :id")
    suspend fun getById(id: String): MechanicEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(mechanic: MechanicEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(mechanics: List<MechanicEntity>)

    @Update
    suspend fun update(mechanic: MechanicEntity)

    @Query("UPDATE mechanics SET active = :active WHERE id = :id")
    suspend fun setActive(id: String, active: Boolean)

    @Query("SELECT COUNT(*) FROM mechanics WHERE org_id = :orgId AND active = 1")
    suspend fun countActive(orgId: String): Int
}
