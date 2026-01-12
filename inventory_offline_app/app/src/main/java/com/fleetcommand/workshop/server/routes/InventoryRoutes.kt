package com.fleetcommand.workshop.server.routes

import com.fleetcommand.workshop.data.local.AppDatabase
import com.fleetcommand.workshop.data.local.entities.InventoryMovementEntity
import com.fleetcommand.workshop.server.dto.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.inventoryRoutes(database: AppDatabase) {
    route("/api/inventory") {
        // GET /api/inventory - Get all inventory levels
        get {
            val principal = call.principal<UserIdPrincipal>()!!
            val orgId = principal.name

            val levels = database.inventoryMovementDao().getInventoryLevelsSync(orgId)
            val response = levels.map { part ->
                InventoryItemDto(
                    partId = part.id,
                    name = part.name,
                    category = part.category,
                    unit = part.unit,
                    quantity = part.currentStock,
                    minStock = part.minStock
                )
            }
            call.respond(response)
        }

        // POST /api/inventory/move - Record inventory movement
        post("/move") {
            val principal = call.principal<UserIdPrincipal>()!!
            val orgId = principal.name
            val request = call.receive<InventoryMoveRequest>()

            // Validate movement type
            if (request.movementType !in listOf("IN", "OUT", "ADJUSTMENT")) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Invalid movement type", "INV_400")
                )
                return@post
            }

            // Check if part exists
            val part = database.partDao().getById(request.partId)
            if (part == null) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse("Part not found", "INV_404")
                )
                return@post
            }

            val movement = InventoryMovementEntity(
                id = UUID.randomUUID().toString(),
                orgId = orgId,
                partId = request.partId,
                quantity = request.quantity,
                movementType = request.movementType,
                reason = request.reason,
                vehicleId = request.vehicleId,
                mechanicId = request.mechanicId,
                referenceId = null
            )

            database.inventoryMovementDao().insert(movement)

            val response = InventoryMovementDto(
                id = movement.id,
                partId = movement.partId,
                quantity = movement.quantity,
                movementType = movement.movementType,
                reason = movement.reason,
                vehicleId = movement.vehicleId,
                mechanicId = movement.mechanicId,
                createdAt = movement.createdAt
            )

            call.respond(HttpStatusCode.Created, response)
        }

        // GET /api/inventory/{partId}/history - Get movement history for a part
        get("/{partId}/history") {
            val partId = call.parameters["partId"]!!

            val movements = database.inventoryMovementDao().getByPartSync(partId, 100)
            val response = movements.map { m ->
                InventoryMovementDto(
                    id = m.id,
                    partId = m.partId,
                    quantity = m.quantity,
                    movementType = m.movementType,
                    reason = m.reason,
                    vehicleId = m.vehicleId,
                    mechanicId = m.mechanicId,
                    createdAt = m.createdAt
                )
            }
            call.respond(response)
        }
    }
}
