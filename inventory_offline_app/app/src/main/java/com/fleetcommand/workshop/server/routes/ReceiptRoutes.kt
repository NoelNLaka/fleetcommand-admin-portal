package com.fleetcommand.workshop.server.routes

import com.fleetcommand.workshop.data.local.AppDatabase
import com.fleetcommand.workshop.data.local.entities.ReceiptEntity
import com.fleetcommand.workshop.server.dto.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.receiptRoutes(database: AppDatabase) {
    route("/api/receipts") {
        // GET /api/receipts - Get all receipts
        get {
            val principal = call.principal<UserIdPrincipal>()!!
            val orgId = principal.name

            val receipts = database.receiptDao().getAllByOrgSync(orgId)
            val response = receipts.map { r ->
                ReceiptDto(
                    id = r.id,
                    supplier = r.supplier,
                    amount = r.amount,
                    invoiceNumber = r.invoiceNumber,
                    imagePath = r.imagePath,
                    paid = r.paid,
                    createdAt = r.createdAt
                )
            }
            call.respond(response)
        }

        // POST /api/receipts - Create new receipt (COD payment)
        post {
            val principal = call.principal<UserIdPrincipal>()!!
            val orgId = principal.name
            val createReceipt = call.receive<CreateReceiptDto>()

            val receipt = ReceiptEntity(
                id = UUID.randomUUID().toString(),
                orgId = orgId,
                supplier = createReceipt.supplier,
                amount = createReceipt.amount,
                invoiceNumber = createReceipt.invoiceNumber,
                imagePath = null,
                paid = createReceipt.paid
            )

            database.receiptDao().insert(receipt)

            val response = ReceiptDto(
                id = receipt.id,
                supplier = receipt.supplier,
                amount = receipt.amount,
                invoiceNumber = receipt.invoiceNumber,
                imagePath = receipt.imagePath,
                paid = receipt.paid,
                createdAt = receipt.createdAt
            )

            call.respond(HttpStatusCode.Created, response)
        }

        // GET /api/receipts/{id} - Get single receipt
        get("/{id}") {
            val receiptId = call.parameters["id"]!!

            val receipt = database.receiptDao().getById(receiptId)
            if (receipt == null) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse("Receipt not found", "RCP_404")
                )
                return@get
            }

            val response = ReceiptDto(
                id = receipt.id,
                supplier = receipt.supplier,
                amount = receipt.amount,
                invoiceNumber = receipt.invoiceNumber,
                imagePath = receipt.imagePath,
                paid = receipt.paid,
                createdAt = receipt.createdAt
            )
            call.respond(response)
        }

        // POST /api/receipts/{id}/paid - Mark receipt as paid
        post("/{id}/paid") {
            val receiptId = call.parameters["id"]!!

            val receipt = database.receiptDao().getById(receiptId)
            if (receipt == null) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse("Receipt not found", "RCP_404")
                )
                return@post
            }

            database.receiptDao().updatePaidStatus(receiptId, true)

            call.respond(
                SuccessResponse(
                    message = "Receipt marked as paid",
                    data = mapOf("id" to receiptId)
                )
            )
        }

        // Note: Image upload would require multipart handling
        // For now, images are uploaded from the app and path stored locally
    }
}
