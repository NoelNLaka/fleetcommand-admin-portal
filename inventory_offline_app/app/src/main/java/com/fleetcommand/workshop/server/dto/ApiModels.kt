package com.fleetcommand.workshop.server.dto

import kotlinx.serialization.Serializable

// ============ Common ============

@Serializable
data class ErrorResponse(
    val error: String,
    val code: String
)

@Serializable
data class SuccessResponse(
    val message: String,
    val data: Map<String, String>? = null
)

// ============ Inventory ============

@Serializable
data class InventoryItemDto(
    val partId: String,
    val name: String,
    val category: String,
    val unit: String,
    val quantity: Int,
    val minStock: Int
)

@Serializable
data class InventoryMoveRequest(
    val partId: String,
    val quantity: Int,
    val movementType: String, // IN | OUT | ADJUSTMENT
    val vehicleId: String? = null,
    val mechanicId: String? = null,
    val reason: String? = null
)

@Serializable
data class InventoryMovementDto(
    val id: String,
    val partId: String,
    val quantity: Int,
    val movementType: String,
    val reason: String?,
    val vehicleId: String?,
    val mechanicId: String?,
    val createdAt: Long
)

// ============ Part Requests ============

@Serializable
data class CreateRequestDto(
    val requestedBy: String,
    val items: List<RequestItemDto>,
    val notes: String? = null
)

@Serializable
data class RequestItemDto(
    val partName: String,
    val quantity: Int
)

@Serializable
data class PartRequestDto(
    val id: String,
    val requestedBy: String,
    val status: String,
    val notes: String?,
    val items: List<RequestItemDto>,
    val createdAt: Long,
    val updatedAt: Long
)

@Serializable
data class RequestDecisionDto(
    val decision: String, // approved | rejected
    val notes: String? = null
)

// ============ Receipts ============

@Serializable
data class CreateReceiptDto(
    val supplier: String,
    val amount: Double,
    val invoiceNumber: String? = null,
    val paid: Boolean = false
)

@Serializable
data class ReceiptDto(
    val id: String,
    val supplier: String,
    val amount: Double,
    val invoiceNumber: String?,
    val imagePath: String?,
    val paid: Boolean,
    val createdAt: Long
)

// ============ Maintenance ============

@Serializable
data class StartMaintenanceDto(
    val vehicleId: String,
    val mechanicId: String,
    val serviceType: String,
    val assigneeName: String,
    val costEstimate: Double? = null,
    val arrivalMileage: Int? = null,
    val notes: String? = null
)

@Serializable
data class MaintenanceRecordDto(
    val id: String,
    val vehicleId: String,
    val mechanicId: String,
    val serviceType: String,
    val assigneeName: String,
    val status: String,
    val currentStep: String,
    val notes: String?,
    val startedAt: Long,
    val completedAt: Long?
)

@Serializable
data class AddMaintenancePartDto(
    val partId: String,
    val quantity: Int
)

// ============ Shift Reports ============

@Serializable
data class SubmitShiftDto(
    val mechanicId: String,
    val summary: String
)

@Serializable
data class ShiftReportDto(
    val id: String,
    val mechanicId: String,
    val summary: String,
    val locked: Boolean,
    val createdAt: Long
)

// ============ Sync ============

@Serializable
data class SyncSnapshotDto(
    val inventory: List<InventoryItemDto>,
    val openMaintenance: List<MaintenanceRecordDto>,
    val pendingRequests: List<PartRequestDto>,
    val lastShiftReport: ShiftReportDto?,
    val syncedAt: Long
)

@Serializable
data class VehicleSyncDto(
    val id: String,
    val plate: String,
    val name: String,
    val status: String,
    val year: String? = null,
    val mileage: String? = null
)

@Serializable
data class MechanicSyncDto(
    val id: String,
    val name: String,
    val role: String,
    val active: Boolean
)
