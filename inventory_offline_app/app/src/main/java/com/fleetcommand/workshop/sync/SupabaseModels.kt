package com.fleetcommand.workshop.sync

import com.fleetcommand.workshop.data.local.entities.MaintenanceRecordEntity
import com.fleetcommand.workshop.data.local.entities.VehicleEntity
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Supabase vehicle DTO - matches the vehicles table schema.
 * Note: Uses kotlinx.serialization.json.JsonPrimitive for flexible type handling.
 */
@Serializable
data class SupabaseVehicle(
    val id: String,
    @SerialName("org_id")
    val orgId: String,
    val name: String,
    val year: Int? = null,  // Supabase returns integer
    val trim: String? = null,
    val plate: String,
    val vin: String? = null,
    val status: String,
    val location: String? = null,
    val mileage: String? = null,
    @SerialName("daily_rate")
    val dailyRate: String? = null,  // Supabase returns as string "89.00"
    @SerialName("image_url")
    val imageUrl: String? = null,
    @SerialName("created_at")
    val createdAt: String? = null,
    @SerialName("updated_at")
    val updatedAt: String? = null
) {
    /**
     * Convert to local VehicleEntity.
     */
    fun toEntity(): VehicleEntity {
        return VehicleEntity(
            id = id,
            orgId = orgId,
            name = name,
            year = year?.toString(),
            trim = trim,
            plate = plate,
            vin = vin,
            status = status,
            location = location,
            mileage = mileage,
            dailyRate = dailyRate?.toDoubleOrNull(),
            imageUrl = imageUrl,
            createdAt = parseTimestamp(createdAt),
            updatedAt = parseTimestamp(updatedAt)
        )
    }
}

/**
 * Supabase staff DTO - matches the staff table schema.
 */
@Serializable
data class SupabaseStaff(
    val id: String,
    @SerialName("org_id")
    val orgId: String,
    @SerialName("first_name")
    val firstName: String,
    @SerialName("last_name")
    val lastName: String,
    val department: String? = null,
    @SerialName("job_title")
    val jobTitle: String? = null,
    @SerialName("job_id")
    val jobId: String? = null,
    @SerialName("created_at")
    val createdAt: String? = null
) {
    /**
     * Convert to local MechanicEntity.
     */
    fun toEntity(): com.fleetcommand.workshop.data.local.entities.MechanicEntity {
        return com.fleetcommand.workshop.data.local.entities.MechanicEntity(
            id = id,
            orgId = orgId,
            name = "$firstName $lastName".trim(),
            jobId = jobId,
            department = department,
            jobTitle = jobTitle,
            role = when {
                jobTitle?.contains("Supervisor", ignoreCase = true) == true -> "supervisor"
                jobTitle?.contains("Manager", ignoreCase = true) == true -> "supervisor"
                else -> "mechanic"
            },
            active = true,
            createdAt = parseTimestamp(createdAt)
        )
    }
}

/**
 * Supabase maintenance record DTO - matches the maintenance_records table schema.
 */
@Serializable
data class SupabaseMaintenanceRecord(
    val id: String,
    @SerialName("org_id")
    val orgId: String,
    @SerialName("vehicle_id")
    val vehicleId: String,
    @SerialName("service_type")
    val serviceType: String,
    val status: String,
    @SerialName("assignee_name")
    val assigneeName: String? = null,
    @SerialName("cost_estimate")
    val costEstimate: String? = null,  // Stored as text in Supabase (e.g., "200.00" or "$200.00")
    @SerialName("scheduled_date")
    val scheduledDate: String? = null,
    @SerialName("current_step")
    val currentStep: String? = null,
    @SerialName("arrival_mileage")
    val arrivalMileage: Int? = null,
    val notes: String? = null,
    @SerialName("work_order_number")
    val workOrderNumber: String? = null,
    @SerialName("staff_id")
    val staffId: String? = null,
    @SerialName("created_at")
    val createdAt: String? = null,
    @SerialName("updated_at")
    val updatedAt: String? = null
) {
    /**
     * Convert to local MaintenanceRecordEntity.
     */
    fun toEntity(mechanicId: String = "unknown"): MaintenanceRecordEntity {
        // Parse cost_estimate string (e.g., "$200.00" or "200.00") to Double
        val costDouble = costEstimate?.let { cost ->
            cost.replace("$", "").replace(",", "").trim().toDoubleOrNull()
        }

        return MaintenanceRecordEntity(
            id = id,
            orgId = orgId,
            vehicleId = vehicleId,
            mechanicId = staffId ?: mechanicId,
            serviceType = serviceType,
            assigneeName = assigneeName ?: "Unassigned",
            costEstimate = costDouble,
            scheduledDate = scheduledDate,
            arrivalMileage = arrivalMileage,
            notes = notes,
            currentStep = currentStep ?: "Scheduled",
            status = status,
            syncStatus = "synced",
            createdAt = parseTimestamp(createdAt),
            updatedAt = parseTimestamp(updatedAt)
        )
    }

    companion object {
        /**
         * Create from local MaintenanceRecordEntity.
         */
        fun fromEntity(entity: MaintenanceRecordEntity): SupabaseMaintenanceRecord {
            // Convert Double cost to String for Supabase
            val costString = entity.costEstimate?.let { "%.2f".format(it) }

            return SupabaseMaintenanceRecord(
                id = entity.id,
                orgId = entity.orgId,
                vehicleId = entity.vehicleId,
                serviceType = entity.serviceType,
                status = entity.status,
                assigneeName = entity.assigneeName,
                costEstimate = costString,
                scheduledDate = entity.scheduledDate,
                currentStep = entity.currentStep,
                arrivalMileage = entity.arrivalMileage,
                notes = entity.notes,
                staffId = entity.mechanicId
            )
        }
    }
}

/**
 * Parse ISO timestamp to milliseconds.
 */
private fun parseTimestamp(timestamp: String?): Long {
    if (timestamp == null) return System.currentTimeMillis()
    return try {
        // Simple ISO 8601 parsing
        java.time.Instant.parse(timestamp).toEpochMilli()
    } catch (e: Exception) {
        try {
            // Try parsing without timezone
            java.time.LocalDateTime.parse(timestamp.replace(" ", "T"))
                .atZone(java.time.ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli()
        } catch (e2: Exception) {
            System.currentTimeMillis()
        }
    }
}
