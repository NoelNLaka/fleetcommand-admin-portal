package com.fleetcommand.workshop.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Part entity - represents inventory parts/items.
 */
@Entity(
    tableName = "parts",
    indices = [Index("org_id"), Index("category")]
)
data class PartEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "org_id")
    val orgId: String,

    val name: String,

    val category: String,

    val unit: String, // pcs, liters, kg, etc.

    @ColumnInfo(name = "min_stock")
    val minStock: Int,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis()
)
