package com.fleetcommand.workshop.server.routes

import com.fleetcommand.workshop.data.local.AppDatabase
import com.fleetcommand.workshop.data.local.entities.MechanicEntity
import com.fleetcommand.workshop.data.local.entities.VehicleEntity
import com.fleetcommand.workshop.server.dto.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.syncRoutes(database: AppDatabase) {
    route("/api/sync") {
        // GET /api/sync/snapshot - Get full sync snapshot for office
        get("/snapshot") {
            val principal = call.principal<UserIdPrincipal>()!!
            val orgId = principal.name

            // Get inventory levels
            val inventoryLevels = database.inventoryMovementDao().getInventoryLevelsSync(orgId)
            val inventory = inventoryLevels.map { part ->
                InventoryItemDto(
                    partId = part.id,
                    name = part.name,
                    category = part.category,
                    unit = part.unit,
                    quantity = part.currentStock,
                    minStock = part.minStock
                )
            }

            // Get open maintenance
            val openMaintenance = database.maintenanceRecordDao().getOpenSync(orgId).map { r ->
                MaintenanceRecordDto(
                    id = r.id,
                    vehicleId = r.vehicleId,
                    mechanicId = r.mechanicId,
                    serviceType = r.serviceType,
                    assigneeName = r.assigneeName,
                    status = r.status,
                    currentStep = r.currentStep,
                    notes = r.notes,
                    startedAt = r.startedAt,
                    completedAt = r.completedAt
                )
            }

            // Get pending requests with items
            val pendingRequests = database.partRequestDao().getPendingSync(orgId).map { request ->
                val items = database.partRequestItemDao().getByRequestSync(request.id)
                PartRequestDto(
                    id = request.id,
                    requestedBy = request.requestedBy,
                    status = request.status,
                    notes = request.notes,
                    items = items.map { RequestItemDto(it.partName, it.quantity) },
                    createdAt = request.createdAt,
                    updatedAt = request.updatedAt
                )
            }

            // Get last shift report
            val lastShift = database.shiftReportDao().getLatestSync(orgId)?.let { r ->
                ShiftReportDto(
                    id = r.id,
                    mechanicId = r.mechanicId,
                    summary = r.summary,
                    locked = r.locked,
                    createdAt = r.createdAt
                )
            }

            val snapshot = SyncSnapshotDto(
                inventory = inventory,
                openMaintenance = openMaintenance,
                pendingRequests = pendingRequests,
                lastShiftReport = lastShift,
                syncedAt = System.currentTimeMillis()
            )

            call.respond(snapshot)
        }

        // POST /api/sync/vehicles - Sync vehicles from office
        post("/vehicles") {
            val principal = call.principal<UserIdPrincipal>()!!
            val orgId = principal.name
            val vehicles = call.receive<List<VehicleSyncDto>>()

            val entities = vehicles.map { dto ->
                VehicleEntity(
                    id = dto.id,
                    orgId = orgId,
                    plate = dto.plate,
                    name = dto.name,
                    year = dto.year,
                    mileage = dto.mileage,
                    status = dto.status
                )
            }

            database.vehicleDao().insertAll(entities)

            call.respond(
                SuccessResponse(
                    message = "Vehicles synced",
                    data = mapOf("count" to vehicles.size.toString())
                )
            )
        }

        // POST /api/sync/mechanics - Sync mechanics from office
        post("/mechanics") {
            val principal = call.principal<UserIdPrincipal>()!!
            val orgId = principal.name
            val mechanics = call.receive<List<MechanicSyncDto>>()

            val entities = mechanics.map { dto ->
                MechanicEntity(
                    id = dto.id,
                    orgId = orgId,
                    name = dto.name,
                    role = dto.role,
                    active = dto.active
                )
            }

            database.mechanicDao().insertAll(entities)

            call.respond(
                SuccessResponse(
                    message = "Mechanics synced",
                    data = mapOf("count" to mechanics.size.toString())
                )
            )
        }
    }
}
