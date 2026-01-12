package com.fleetcommand.workshop.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.fleetcommand.workshop.data.local.entities.InventoryMovementEntity
import kotlinx.coroutines.flow.Flow

/**
 * Data class for inventory level calculation results.
 */
data class PartWithStock(
    val id: String,
    val name: String,
    val category: String,
    val unit: String,
    val minStock: Int,
    val currentStock: Int
)

@Dao
interface InventoryMovementDao {
    @Query("SELECT * FROM inventory_movements WHERE org_id = :orgId ORDER BY created_at DESC")
    fun getAllByOrg(orgId: String): Flow<List<InventoryMovementEntity>>

    @Query("SELECT * FROM inventory_movements WHERE org_id = :orgId ORDER BY created_at DESC LIMIT :limit")
    suspend fun getRecentByOrgSync(orgId: String, limit: Int = 50): List<InventoryMovementEntity>

    @Query("SELECT * FROM inventory_movements WHERE part_id = :partId ORDER BY created_at DESC")
    fun getByPart(partId: String): Flow<List<InventoryMovementEntity>>

    @Query("SELECT * FROM inventory_movements WHERE part_id = :partId ORDER BY created_at DESC LIMIT :limit")
    suspend fun getByPartSync(partId: String, limit: Int = 50): List<InventoryMovementEntity>

    @Query("""
        SELECT
            p.id,
            p.name,
            p.category,
            p.unit,
            p.min_stock as minStock,
            COALESCE(SUM(
                CASE
                    WHEN im.movement_type = 'IN' THEN im.quantity
                    WHEN im.movement_type = 'OUT' THEN -im.quantity
                    ELSE im.quantity
                END
            ), 0) as currentStock
        FROM parts p
        LEFT JOIN inventory_movements im ON p.id = im.part_id
        WHERE p.org_id = :orgId
        GROUP BY p.id
        ORDER BY p.name ASC
    """)
    fun getInventoryLevels(orgId: String): Flow<List<PartWithStock>>

    @Query("""
        SELECT
            p.id,
            p.name,
            p.category,
            p.unit,
            p.min_stock as minStock,
            COALESCE(SUM(
                CASE
                    WHEN im.movement_type = 'IN' THEN im.quantity
                    WHEN im.movement_type = 'OUT' THEN -im.quantity
                    ELSE im.quantity
                END
            ), 0) as currentStock
        FROM parts p
        LEFT JOIN inventory_movements im ON p.id = im.part_id
        WHERE p.org_id = :orgId
        GROUP BY p.id
        ORDER BY p.name ASC
    """)
    suspend fun getInventoryLevelsSync(orgId: String): List<PartWithStock>

    @Query("""
        SELECT
            p.id,
            p.name,
            p.category,
            p.unit,
            p.min_stock as minStock,
            COALESCE(SUM(
                CASE
                    WHEN im.movement_type = 'IN' THEN im.quantity
                    WHEN im.movement_type = 'OUT' THEN -im.quantity
                    ELSE im.quantity
                END
            ), 0) as currentStock
        FROM parts p
        LEFT JOIN inventory_movements im ON p.id = im.part_id
        WHERE p.org_id = :orgId
        GROUP BY p.id
        HAVING currentStock <= p.min_stock
        ORDER BY currentStock ASC
    """)
    fun getLowStockItems(orgId: String): Flow<List<PartWithStock>>

    @Query("""
        SELECT COUNT(*) FROM (
            SELECT p.id
            FROM parts p
            LEFT JOIN inventory_movements im ON p.id = im.part_id
            WHERE p.org_id = :orgId
            GROUP BY p.id
            HAVING COALESCE(SUM(
                CASE
                    WHEN im.movement_type = 'IN' THEN im.quantity
                    WHEN im.movement_type = 'OUT' THEN -im.quantity
                    ELSE im.quantity
                END
            ), 0) <= p.min_stock
        )
    """)
    suspend fun countLowStockItems(orgId: String): Int

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insert(movement: InventoryMovementEntity)

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insertAll(movements: List<InventoryMovementEntity>)

    @Query("""
        SELECT COALESCE(SUM(
            CASE
                WHEN movement_type = 'IN' THEN quantity
                WHEN movement_type = 'OUT' THEN -quantity
                ELSE quantity
            END
        ), 0) FROM inventory_movements WHERE part_id = :partId
    """)
    suspend fun getStockLevel(partId: String): Int
}
