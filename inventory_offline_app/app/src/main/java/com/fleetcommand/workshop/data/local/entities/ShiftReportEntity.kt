package com.fleetcommand.workshop.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Shift report entity - end-of-shift summary reports.
 * Once locked, records prior to this report cannot be modified.
 */
@Entity(
    tableName = "shift_reports",
    indices = [Index("org_id"), Index("mechanic_id"), Index("created_at")]
)
data class ShiftReportEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "org_id")
    val orgId: String,

    @ColumnInfo(name = "mechanic_id")
    val mechanicId: String,

    val summary: String,

    val locked: Boolean = false,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis()
)
