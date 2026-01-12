package com.fleetcommand.workshop.server.routes

import com.fleetcommand.workshop.data.local.AppDatabase
import com.fleetcommand.workshop.data.local.entities.ShiftReportEntity
import com.fleetcommand.workshop.server.dto.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.shiftRoutes(database: AppDatabase) {
    route("/api/shifts") {
        // GET /api/shifts - Get all shift reports
        get {
            val principal = call.principal<UserIdPrincipal>()!!
            val orgId = principal.name

            val reports = database.shiftReportDao().getAllByOrgSync(orgId)
            val response = reports.map { r ->
                ShiftReportDto(
                    id = r.id,
                    mechanicId = r.mechanicId,
                    summary = r.summary,
                    locked = r.locked,
                    createdAt = r.createdAt
                )
            }
            call.respond(response)
        }

        // POST /api/shifts/end - Submit end-of-shift report
        post("/end") {
            val principal = call.principal<UserIdPrincipal>()!!
            val orgId = principal.name
            val submitRequest = call.receive<SubmitShiftDto>()

            val report = ShiftReportEntity(
                id = UUID.randomUUID().toString(),
                orgId = orgId,
                mechanicId = submitRequest.mechanicId,
                summary = submitRequest.summary,
                locked = true // Lock immediately upon submission
            )

            database.shiftReportDao().insert(report)

            val response = ShiftReportDto(
                id = report.id,
                mechanicId = report.mechanicId,
                summary = report.summary,
                locked = report.locked,
                createdAt = report.createdAt
            )

            call.respond(HttpStatusCode.Created, response)
        }

        // GET /api/shifts/latest - Get latest shift report
        get("/latest") {
            val principal = call.principal<UserIdPrincipal>()!!
            val orgId = principal.name

            val report = database.shiftReportDao().getLatestSync(orgId)
            if (report == null) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse("No shift reports found", "SHF_404")
                )
                return@get
            }

            val response = ShiftReportDto(
                id = report.id,
                mechanicId = report.mechanicId,
                summary = report.summary,
                locked = report.locked,
                createdAt = report.createdAt
            )
            call.respond(response)
        }

        // GET /api/shifts/{id} - Get single shift report
        get("/{id}") {
            val reportId = call.parameters["id"]!!

            val report = database.shiftReportDao().getById(reportId)
            if (report == null) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse("Shift report not found", "SHF_404")
                )
                return@get
            }

            val response = ShiftReportDto(
                id = report.id,
                mechanicId = report.mechanicId,
                summary = report.summary,
                locked = report.locked,
                createdAt = report.createdAt
            )
            call.respond(response)
        }
    }
}
