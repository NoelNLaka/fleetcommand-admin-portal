package com.fleetcommand.workshop.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Inventory movement entity - represents stock changes (ledger entries).
 * This is the core of the inventory system - stock levels are calculated from movements.
 */
@Entity(
    tableName = "inventory_movements",
    foreignKeys = [
        ForeignKey(
            entity = PartEntity::class,
            parentColumns = ["id"],
            childColumns = ["part_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("org_id"),
        Index("part_id"),
        Index("vehicle_id"),
        Index("mechanic_id"),
        Index("created_at")
    ]
)
data class InventoryMovementEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "org_id")
    val orgId: String,

    @ColumnInfo(name = "part_id")
    val partId: String,

    val quantity: Int, // Positive for IN, can be negative for OUT

    @ColumnInfo(name = "movement_type")
    val movementType: String, // IN | OUT | ADJUSTMENT

    val reason: String?,

    @ColumnInfo(name = "vehicle_id")
    val vehicleId: String?, // Linked vehicle (for parts used in maintenance)

    @ColumnInfo(name = "mechanic_id")
    val mechanicId: String?, // Who performed the action

    @ColumnInfo(name = "reference_id")
    val referenceId: String?, // Receipt ID or Maintenance ID

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis()
)
