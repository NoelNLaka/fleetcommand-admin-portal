package com.fleetcommand.workshop.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.fleetcommand.workshop.data.local.entities.ReceiptEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ReceiptDao {
    @Query("SELECT * FROM receipts WHERE org_id = :orgId ORDER BY created_at DESC")
    fun getAllByOrg(orgId: String): Flow<List<ReceiptEntity>>

    @Query("SELECT * FROM receipts WHERE org_id = :orgId ORDER BY created_at DESC")
    suspend fun getAllByOrgSync(orgId: String): List<ReceiptEntity>

    @Query("SELECT * FROM receipts WHERE org_id = :orgId AND paid = 0 ORDER BY created_at DESC")
    fun getUnpaid(orgId: String): Flow<List<ReceiptEntity>>

    @Query("SELECT * FROM receipts WHERE id = :id")
    suspend fun getById(id: String): ReceiptEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(receipt: ReceiptEntity)

    @Update
    suspend fun update(receipt: ReceiptEntity)

    @Query("UPDATE receipts SET paid = :paid WHERE id = :id")
    suspend fun updatePaidStatus(id: String, paid: Boolean)

    @Query("UPDATE receipts SET image_path = :imagePath WHERE id = :id")
    suspend fun updateImagePath(id: String, imagePath: String)

    @Query("SELECT SUM(amount) FROM receipts WHERE org_id = :orgId AND paid = 0")
    suspend fun getTotalUnpaid(orgId: String): Double?

    @Query("SELECT SUM(amount) FROM receipts WHERE org_id = :orgId")
    suspend fun getTotalAmount(orgId: String): Double?

    @Query("SELECT COUNT(*) FROM receipts WHERE org_id = :orgId")
    suspend fun countAll(orgId: String): Int
}
