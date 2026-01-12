package com.fleetcommand.workshop.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Maintenance record entity - represents vehicle maintenance/service jobs.
 * Syncs with Supabase maintenance_records table.
 */
@Entity(
    tableName = "maintenance_records",
    foreignKeys = [
        ForeignKey(
            entity = VehicleEntity::class,
            parentColumns = ["id"],
            childColumns = ["vehicle_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("org_id"),
        Index("vehicle_id"),
        Index("mechanic_id"),
        Index("status"),
        Index("sync_status")
    ]
)
data class MaintenanceRecordEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "org_id")
    val orgId: String,

    @ColumnInfo(name = "vehicle_id")
    val vehicleId: String,

    @ColumnInfo(name = "mechanic_id")
    val mechanicId: String,

    // Type of service (Oil Change, Brake Repair, Tire Rotation, etc.)
    @ColumnInfo(name = "service_type")
    val serviceType: String,

    // Technician/department assigned
    @ColumnInfo(name = "assignee_name")
    val assigneeName: String,

    // Estimated service cost
    @ColumnInfo(name = "cost_estimate")
    val costEstimate: Double? = null,

    // Scheduled service date (ISO format: YYYY-MM-DD)
    @ColumnInfo(name = "scheduled_date")
    val scheduledDate: String? = null,

    // Mileage when vehicle arrived
    @ColumnInfo(name = "arrival_mileage")
    val arrivalMileage: Int? = null,

    // Additional notes
    val notes: String? = null,

    // Current step: Scheduled, In Shop, QC Check, Done
    @ColumnInfo(name = "current_step")
    val currentStep: String = "Scheduled",

    // Status: Scheduled, In Shop, QC Check, Done, Overdue
    val status: String,

    // Sync status: pending, synced, failed
    @ColumnInfo(name = "sync_status")
    val syncStatus: String = "pending",

    @ColumnInfo(name = "started_at")
    val startedAt: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "completed_at")
    val completedAt: Long? = null,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis()
)
