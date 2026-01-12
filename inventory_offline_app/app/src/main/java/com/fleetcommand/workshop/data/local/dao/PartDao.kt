package com.fleetcommand.workshop.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.fleetcommand.workshop.data.local.entities.PartEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PartDao {
    @Query("SELECT * FROM parts WHERE org_id = :orgId ORDER BY name ASC")
    fun getAllByOrg(orgId: String): Flow<List<PartEntity>>

    @Query("SELECT * FROM parts WHERE org_id = :orgId ORDER BY name ASC")
    suspend fun getAllByOrgSync(orgId: String): List<PartEntity>

    @Query("SELECT * FROM parts WHERE org_id = :orgId AND category = :category ORDER BY name ASC")
    fun getByCategory(orgId: String, category: String): Flow<List<PartEntity>>

    @Query("SELECT DISTINCT category FROM parts WHERE org_id = :orgId ORDER BY category ASC")
    fun getCategories(orgId: String): Flow<List<String>>

    @Query("SELECT DISTINCT category FROM parts WHERE org_id = :orgId ORDER BY category ASC")
    suspend fun getCategoriesSync(orgId: String): List<String>

    @Query("SELECT * FROM parts WHERE id = :id")
    suspend fun getById(id: String): PartEntity?

    @Query("SELECT * FROM parts WHERE org_id = :orgId AND name LIKE '%' || :query || '%' ORDER BY name ASC")
    fun search(orgId: String, query: String): Flow<List<PartEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(part: PartEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(parts: List<PartEntity>)

    @Update
    suspend fun update(part: PartEntity)

    @Query("DELETE FROM parts WHERE id = :id")
    suspend fun delete(id: String)

    @Query("SELECT COUNT(*) FROM parts WHERE org_id = :orgId")
    suspend fun countAll(orgId: String): Int
}
