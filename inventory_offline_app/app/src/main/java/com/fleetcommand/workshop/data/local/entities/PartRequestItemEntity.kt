package com.fleetcommand.workshop.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Part request item entity - individual items in a part request.
 */
@Entity(
    tableName = "part_request_items",
    foreignKeys = [
        ForeignKey(
            entity = PartRequestEntity::class,
            parentColumns = ["id"],
            childColumns = ["request_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("request_id")]
)
data class PartRequestItemEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "org_id")
    val orgId: String,

    @ColumnInfo(name = "request_id")
    val requestId: String,

    @ColumnInfo(name = "part_name")
    val partName: String,

    val quantity: Int
)
