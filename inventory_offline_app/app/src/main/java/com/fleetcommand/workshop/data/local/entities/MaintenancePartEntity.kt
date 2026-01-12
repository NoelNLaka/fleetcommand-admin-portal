package com.fleetcommand.workshop.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Maintenance part entity - links parts used in a maintenance job.
 */
@Entity(
    tableName = "maintenance_parts",
    foreignKeys = [
        ForeignKey(
            entity = MaintenanceRecordEntity::class,
            parentColumns = ["id"],
            childColumns = ["maintenance_id"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = PartEntity::class,
            parentColumns = ["id"],
            childColumns = ["part_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("maintenance_id"),
        Index("part_id")
    ]
)
data class MaintenancePartEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "org_id")
    val orgId: String,

    @ColumnInfo(name = "maintenance_id")
    val maintenanceId: String,

    @ColumnInfo(name = "part_id")
    val partId: String,

    val quantity: Int
)
