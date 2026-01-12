package com.fleetcommand.workshop.server.routes

import com.fleetcommand.workshop.data.local.AppDatabase
import com.fleetcommand.workshop.data.local.entities.PartRequestEntity
import com.fleetcommand.workshop.data.local.entities.PartRequestItemEntity
import com.fleetcommand.workshop.server.dto.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.requestRoutes(database: AppDatabase) {
    route("/api/requests") {
        // GET /api/requests - Get all requests (optional status filter)
        get {
            val principal = call.principal<UserIdPrincipal>()!!
            val orgId = principal.name
            val statusFilter = call.request.queryParameters["status"]

            val requests = if (statusFilter != null) {
                database.partRequestDao().getAllByOrgSync(orgId)
                    .filter { it.status == statusFilter }
            } else {
                database.partRequestDao().getAllByOrgSync(orgId)
            }

            val response = requests.map { request ->
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
            call.respond(response)
        }

        // POST /api/requests - Create new request
        post {
            val principal = call.principal<UserIdPrincipal>()!!
            val orgId = principal.name
            val createRequest = call.receive<CreateRequestDto>()

            if (createRequest.items.isEmpty()) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Request must have at least one item", "REQ_400")
                )
                return@post
            }

            val requestId = UUID.randomUUID().toString()
            val now = System.currentTimeMillis()

            val request = PartRequestEntity(
                id = requestId,
                orgId = orgId,
                requestedBy = createRequest.requestedBy,
                status = "pending",
                notes = createRequest.notes,
                createdAt = now,
                updatedAt = now
            )
            database.partRequestDao().insert(request)

            val items = createRequest.items.map { item ->
                PartRequestItemEntity(
                    id = UUID.randomUUID().toString(),
                    orgId = orgId,
                    requestId = requestId,
                    partName = item.partName,
                    quantity = item.quantity
                )
            }
            database.partRequestItemDao().insertAll(items)

            val response = PartRequestDto(
                id = request.id,
                requestedBy = request.requestedBy,
                status = request.status,
                notes = request.notes,
                items = createRequest.items,
                createdAt = request.createdAt,
                updatedAt = request.updatedAt
            )

            call.respond(HttpStatusCode.Created, response)
        }

        // GET /api/requests/{id} - Get single request
        get("/{id}") {
            val requestId = call.parameters["id"]!!

            val requestWithItems = database.partRequestDao().getWithItems(requestId)
            if (requestWithItems == null) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse("Request not found", "REQ_404")
                )
                return@get
            }

            val response = PartRequestDto(
                id = requestWithItems.request.id,
                requestedBy = requestWithItems.request.requestedBy,
                status = requestWithItems.request.status,
                notes = requestWithItems.request.notes,
                items = requestWithItems.items.map { RequestItemDto(it.partName, it.quantity) },
                createdAt = requestWithItems.request.createdAt,
                updatedAt = requestWithItems.request.updatedAt
            )
            call.respond(response)
        }

        // POST /api/requests/{id}/decision - Approve or reject request
        post("/{id}/decision") {
            val requestId = call.parameters["id"]!!
            val decision = call.receive<RequestDecisionDto>()

            val request = database.partRequestDao().getById(requestId)
            if (request == null) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse("Request not found", "REQ_404")
                )
                return@post
            }

            if (request.status != "pending") {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Request is not pending", "REQ_400")
                )
                return@post
            }

            val newStatus = when (decision.decision.lowercase()) {
                "approved" -> "approved"
                "rejected" -> "rejected"
                else -> {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        ErrorResponse("Invalid decision. Must be 'approved' or 'rejected'", "REQ_400")
                    )
                    return@post
                }
            }

            database.partRequestDao().updateStatus(requestId, newStatus)

            call.respond(
                SuccessResponse(
                    message = "Request $newStatus",
                    data = mapOf("id" to requestId, "status" to newStatus)
                )
            )
        }
    }
}
