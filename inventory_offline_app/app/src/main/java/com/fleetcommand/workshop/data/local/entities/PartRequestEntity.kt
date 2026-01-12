package com.fleetcommand.workshop.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Part request entity - represents requests for parts from the workshop.
 */
@Entity(
    tableName = "part_requests",
    indices = [Index("org_id"), Index("status")]
)
data class PartRequestEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "org_id")
    val orgId: String,

    @ColumnInfo(name = "requested_by")
    val requestedBy: String, // Mechanic ID

    val status: String, // pending | approved | rejected | fulfilled

    val notes: String?,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis()
)
