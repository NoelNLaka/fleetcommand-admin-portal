package com.fleetcommand.workshop.server.routes

import com.fleetcommand.workshop.data.local.AppDatabase
import com.fleetcommand.workshop.data.local.entities.InventoryMovementEntity
import com.fleetcommand.workshop.data.local.entities.MaintenancePartEntity
import com.fleetcommand.workshop.data.local.entities.MaintenanceRecordEntity
import com.fleetcommand.workshop.server.dto.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.maintenanceRoutes(database: AppDatabase) {
    route("/api/maintenance") {
        // GET /api/maintenance - Get all maintenance records
        get {
            val principal = call.principal<UserIdPrincipal>()!!
            val orgId = principal.name
            val statusFilter = call.request.queryParameters["status"]

            val records = database.maintenanceRecordDao().getAllByOrgSync(orgId)
                .let { if (statusFilter != null) it.filter { r -> r.status == statusFilter } else it }

            val response = records.map { r ->
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
            call.respond(response)
        }

        // POST /api/maintenance - Start new maintenance
        post {
            val principal = call.principal<UserIdPrincipal>()!!
            val orgId = principal.name
            val startRequest = call.receive<StartMaintenanceDto>()

            // Check vehicle exists
            val vehicle = database.vehicleDao().getById(startRequest.vehicleId)
            if (vehicle == null) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse("Vehicle not found", "MNT_404")
                )
                return@post
            }

            // Check if vehicle is already in maintenance
            if (vehicle.status == "maintenance") {
                call.respond(
                    HttpStatusCode.Conflict,
                    ErrorResponse("Vehicle is already in maintenance", "MNT_409")
                )
                return@post
            }

            val record = MaintenanceRecordEntity(
                id = UUID.randomUUID().toString(),
                orgId = orgId,
                vehicleId = startRequest.vehicleId,
                mechanicId = startRequest.mechanicId,
                serviceType = startRequest.serviceType,
                assigneeName = startRequest.assigneeName,
                costEstimate = startRequest.costEstimate,
                arrivalMileage = startRequest.arrivalMileage,
                notes = startRequest.notes,
                status = "open"
            )

            database.maintenanceRecordDao().insert(record)
            database.vehicleDao().updateStatus(startRequest.vehicleId, "maintenance")

            val response = MaintenanceRecordDto(
                id = record.id,
                vehicleId = record.vehicleId,
                mechanicId = record.mechanicId,
                serviceType = record.serviceType,
                assigneeName = record.assigneeName,
                status = record.status,
                currentStep = record.currentStep,
                notes = record.notes,
                startedAt = record.startedAt,
                completedAt = record.completedAt
            )

            call.respond(HttpStatusCode.Created, response)
        }

        // GET /api/maintenance/{id} - Get single maintenance record
        get("/{id}") {
            val maintenanceId = call.parameters["id"]!!

            val record = database.maintenanceRecordDao().getById(maintenanceId)
            if (record == null) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse("Maintenance record not found", "MNT_404")
                )
                return@get
            }

            val response = MaintenanceRecordDto(
                id = record.id,
                vehicleId = record.vehicleId,
                mechanicId = record.mechanicId,
                serviceType = record.serviceType,
                assigneeName = record.assigneeName,
                status = record.status,
                currentStep = record.currentStep,
                notes = record.notes,
                startedAt = record.startedAt,
                completedAt = record.completedAt
            )
            call.respond(response)
        }

        // POST /api/maintenance/{id}/complete - Complete maintenance
        post("/{id}/complete") {
            val maintenanceId = call.parameters["id"]!!

            val record = database.maintenanceRecordDao().getById(maintenanceId)
            if (record == null) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse("Maintenance record not found", "MNT_404")
                )
                return@post
            }

            if (record.status == "completed") {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Maintenance already completed", "MNT_400")
                )
                return@post
            }

            database.maintenanceRecordDao().complete(maintenanceId)
            database.vehicleDao().updateStatus(record.vehicleId, "available")

            call.respond(
                SuccessResponse(
                    message = "Maintenance completed",
                    data = mapOf("id" to maintenanceId, "status" to "completed")
                )
            )
        }

        // POST /api/maintenance/{id}/parts - Add parts used in maintenance
        post("/{id}/parts") {
            val principal = call.principal<UserIdPrincipal>()!!
            val orgId = principal.name
            val maintenanceId = call.parameters["id"]!!
            val addPart = call.receive<AddMaintenancePartDto>()

            val record = database.maintenanceRecordDao().getById(maintenanceId)
            if (record == null) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse("Maintenance record not found", "MNT_404")
                )
                return@post
            }

            // Check part exists
            val part = database.partDao().getById(addPart.partId)
            if (part == null) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse("Part not found", "MNT_404")
                )
                return@post
            }

            // Add part to maintenance
            val maintenancePart = MaintenancePartEntity(
                id = UUID.randomUUID().toString(),
                orgId = orgId,
                maintenanceId = maintenanceId,
                partId = addPart.partId,
                quantity = addPart.quantity
            )
            database.maintenancePartDao().insert(maintenancePart)

            // Record inventory OUT movement
            val movement = InventoryMovementEntity(
                id = UUID.randomUUID().toString(),
                orgId = orgId,
                partId = addPart.partId,
                quantity = addPart.quantity,
                movementType = "OUT",
                reason = "Used in maintenance: ${record.serviceType}",
                vehicleId = record.vehicleId,
                mechanicId = record.mechanicId,
                referenceId = maintenanceId
            )
            database.inventoryMovementDao().insert(movement)

            call.respond(
                SuccessResponse(
                    message = "Part added to maintenance",
                    data = mapOf("partId" to addPart.partId, "quantity" to addPart.quantity.toString())
                )
            )
        }
    }
}
