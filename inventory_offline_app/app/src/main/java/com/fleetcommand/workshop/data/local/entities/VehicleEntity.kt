package com.fleetcommand.workshop.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Vehicle entity - represents vehicles in the fleet.
 * Synced from Supabase vehicles table.
 */
@Entity(
    tableName = "vehicles",
    indices = [Index("org_id"), Index("plate")]
)
data class VehicleEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "org_id")
    val orgId: String,

    // Vehicle make/model name (e.g., "2024 Tesla Model 3")
    val name: String,

    // Model year
    val year: String? = null,

    // Trim level
    val trim: String? = null,

    // License plate number
    val plate: String,

    // Vehicle Identification Number
    val vin: String? = null,

    // Status: Available, Rented, Maintenance
    val status: String,

    // Current location
    val location: String? = null,

    // Odometer reading
    val mileage: String? = null,

    // Rental rate per day
    @ColumnInfo(name = "daily_rate")
    val dailyRate: Double? = null,

    // Vehicle photo URL
    @ColumnInfo(name = "image_url")
    val imageUrl: String? = null,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis()
)
