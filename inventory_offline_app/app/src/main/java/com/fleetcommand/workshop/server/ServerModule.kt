package com.fleetcommand.workshop.server

import com.fleetcommand.workshop.data.local.AppDatabase
import com.fleetcommand.workshop.data.repository.DeviceConfigRepository
import com.fleetcommand.workshop.server.dto.ErrorResponse
import com.fleetcommand.workshop.server.routes.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json

fun Application.configureServer(
    database: AppDatabase,
    deviceConfigRepository: DeviceConfigRepository
) {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
            encodeDefaults = true
        })
    }

    install(StatusPages) {
        exception<IllegalArgumentException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse(cause.message ?: "Bad request", "BAD_REQUEST")
            )
        }
        exception<IllegalStateException> { call, cause ->
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse(cause.message ?: "Server error", "SERVER_ERROR")
            )
        }
        exception<Throwable> { call, cause ->
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse("Internal error: ${cause.message}", "SRV_500")
            )
        }
    }

    install(CORS) {
        anyHost()
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Options)
    }

    install(Authentication) {
        bearer("auth-bearer") {
            authenticate { tokenCredential ->
                val config = deviceConfigRepository.getConfigSync()
                if (config != null && tokenCredential.token == config.accessToken) {
                    UserIdPrincipal(config.orgId)
                } else {
                    null
                }
            }
        }
    }

    routing {
        // Health check - no auth required
        get("/health") {
            call.respond(mapOf("status" to "ok", "timestamp" to System.currentTimeMillis()))
        }

        // All API routes require authentication
        authenticate("auth-bearer") {
            inventoryRoutes(database)
            requestRoutes(database)
            receiptRoutes(database)
            maintenanceRoutes(database)
            shiftRoutes(database)
            syncRoutes(database)
        }
    }
}
