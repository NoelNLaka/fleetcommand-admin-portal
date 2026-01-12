package com.fleetcommand.workshop.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Mechanic entity - represents workshop staff members.
 * Synced from Supabase staff table (filtered by workshop/maintenance department).
 */
@Entity(
    tableName = "mechanics",
    indices = [Index("org_id"), Index("job_id")]
)
data class MechanicEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "org_id")
    val orgId: String,

    // Full name (first_name + last_name from staff table)
    val name: String,

    // Job ID / Employee Number
    @ColumnInfo(name = "job_id")
    val jobId: String? = null,

    // Department (Maintenance, Workshop, etc.)
    val department: String? = null,

    // Job title (Senior Mechanic, Technician, etc.)
    @ColumnInfo(name = "job_title")
    val jobTitle: String? = null,

    // Legacy role field for backwards compatibility
    val role: String = "mechanic",

    val active: Boolean = true,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis()
)
