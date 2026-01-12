package com.fleetcommand.workshop.data.local.dao

import androidx.room.Dao
import androidx.room.Embedded
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Relation
import androidx.room.Transaction
import androidx.room.Update
import com.fleetcommand.workshop.data.local.entities.PartRequestEntity
import com.fleetcommand.workshop.data.local.entities.PartRequestItemEntity
import kotlinx.coroutines.flow.Flow

/**
 * Data class for request with items.
 */
data class PartRequestWithItems(
    @Embedded val request: PartRequestEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "request_id"
    )
    val items: List<PartRequestItemEntity>
)

@Dao
interface PartRequestDao {
    @Query("SELECT * FROM part_requests WHERE org_id = :orgId ORDER BY created_at DESC")
    fun getAllByOrg(orgId: String): Flow<List<PartRequestEntity>>

    @Query("SELECT * FROM part_requests WHERE org_id = :orgId ORDER BY created_at DESC")
    suspend fun getAllByOrgSync(orgId: String): List<PartRequestEntity>

    @Query("SELECT * FROM part_requests WHERE org_id = :orgId AND status = :status ORDER BY created_at DESC")
    fun getByStatus(orgId: String, status: String): Flow<List<PartRequestEntity>>

    @Query("SELECT * FROM part_requests WHERE org_id = :orgId AND status = 'pending' ORDER BY created_at DESC")
    fun getPending(orgId: String): Flow<List<PartRequestEntity>>

    @Query("SELECT * FROM part_requests WHERE org_id = :orgId AND status = 'pending' ORDER BY created_at DESC")
    suspend fun getPendingSync(orgId: String): List<PartRequestEntity>

    @Query("SELECT * FROM part_requests WHERE id = :id")
    suspend fun getById(id: String): PartRequestEntity?

    @Transaction
    @Query("SELECT * FROM part_requests WHERE id = :id")
    suspend fun getWithItems(id: String): PartRequestWithItems?

    @Transaction
    @Query("SELECT * FROM part_requests WHERE org_id = :orgId ORDER BY created_at DESC")
    fun getAllWithItems(orgId: String): Flow<List<PartRequestWithItems>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(request: PartRequestEntity)

    @Update
    suspend fun update(request: PartRequestEntity)

    @Query("UPDATE part_requests SET status = :status, updated_at = :updatedAt WHERE id = :id")
    suspend fun updateStatus(id: String, status: String, updatedAt: Long = System.currentTimeMillis())

    @Query("SELECT COUNT(*) FROM part_requests WHERE org_id = :orgId AND status = 'pending'")
    suspend fun countPending(orgId: String): Int
}

@Dao
interface PartRequestItemDao {
    @Query("SELECT * FROM part_request_items WHERE request_id = :requestId")
    fun getByRequest(requestId: String): Flow<List<PartRequestItemEntity>>

    @Query("SELECT * FROM part_request_items WHERE request_id = :requestId")
    suspend fun getByRequestSync(requestId: String): List<PartRequestItemEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: PartRequestItemEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<PartRequestItemEntity>)

    @Query("DELETE FROM part_request_items WHERE request_id = :requestId")
    suspend fun deleteByRequest(requestId: String)
}
