package com.fleetcommand.workshop.sync

import android.util.Log
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

/**
 * HTTP client for Supabase REST API.
 * Handles authentication and provides typed API methods.
 */
@Singleton
class SupabaseClient @Inject constructor(
    private val json: Json
) {
    private val httpClient = HttpClient(OkHttp) {
        install(ContentNegotiation) {
            json(json)
        }
        install(Logging) {
            logger = object : Logger {
                override fun log(message: String) {
                    Log.d("SupabaseClient", message)
                }
            }
            level = LogLevel.BODY
        }
        install(HttpTimeout) {
            requestTimeoutMillis = 30000
            connectTimeoutMillis = 10000
        }
        defaultRequest {
            contentType(ContentType.Application.Json)
        }
    }

    /**
     * Fetch vehicles from Supabase for the given organization.
     * Uses anon key for both apikey and Authorization headers (Supabase anonymous access).
     */
    suspend fun fetchVehicles(
        supabaseUrl: String,
        anonKey: String,
        accessToken: String,
        orgId: String
    ): Result<List<SupabaseVehicle>> {
        return try {
            Log.d("SupabaseClient", "Fetching vehicles for org: $orgId from $supabaseUrl")
            val response: HttpResponse = httpClient.get("$supabaseUrl/rest/v1/vehicles") {
                parameter("org_id", "eq.$orgId")
                parameter("select", "*")
                headers {
                    append("apikey", anonKey)
                    // Use anon key for Authorization (Supabase anonymous access pattern)
                    append("Authorization", "Bearer $anonKey")
                    append("Prefer", "return=representation")
                }
            }

            if (response.status.isSuccess()) {
                val vehicles: List<SupabaseVehicle> = response.body()
                Result.success(vehicles)
            } else {
                val error = response.bodyAsText()
                Log.e("SupabaseClient", "Failed to fetch vehicles: $error")
                Result.failure(Exception("Failed to fetch vehicles: ${response.status}"))
            }
        } catch (e: Exception) {
            Log.e("SupabaseClient", "Error fetching vehicles", e)
            Result.failure(e)
        }
    }

    /**
     * Fetch staff from Supabase for the given organization.
     * Filters by workshop-related departments (Maintenance, Workshop, Service).
     */
    suspend fun fetchStaff(
        supabaseUrl: String,
        anonKey: String,
        accessToken: String,
        orgId: String
    ): Result<List<SupabaseStaff>> {
        return try {
            Log.d("SupabaseClient", "Fetching staff for org: $orgId from $supabaseUrl")
            val response: HttpResponse = httpClient.get("$supabaseUrl/rest/v1/staff") {
                parameter("org_id", "eq.$orgId")
                // Filter for workshop-related departments
                parameter("or", "(department.ilike.%maintenance%,department.ilike.%workshop%,department.ilike.%service%,department.ilike.%mechanic%)")
                parameter("select", "*")
                headers {
                    append("apikey", anonKey)
                    append("Authorization", "Bearer $anonKey")
                    append("Prefer", "return=representation")
                }
            }

            if (response.status.isSuccess()) {
                val staff: List<SupabaseStaff> = response.body()
                Log.d("SupabaseClient", "Fetched ${staff.size} staff members")
                Result.success(staff)
            } else {
                val error = response.bodyAsText()
                Log.e("SupabaseClient", "Failed to fetch staff: $error")
                Result.failure(Exception("Failed to fetch staff: ${response.status}"))
            }
        } catch (e: Exception) {
            Log.e("SupabaseClient", "Error fetching staff", e)
            Result.failure(e)
        }
    }

    /**
     * Push maintenance records to Supabase.
     * Uses upsert to handle both inserts and updates.
     */
    suspend fun upsertMaintenanceRecords(
        supabaseUrl: String,
        anonKey: String,
        accessToken: String,
        records: List<SupabaseMaintenanceRecord>
    ): Result<List<SupabaseMaintenanceRecord>> {
        return try {
            Log.d("SupabaseClient", "Upserting ${records.size} maintenance records")
            val response: HttpResponse = httpClient.post("$supabaseUrl/rest/v1/maintenance_records") {
                headers {
                    append("apikey", anonKey)
                    append("Authorization", "Bearer $anonKey")
                    append("Prefer", "resolution=merge-duplicates,return=representation")
                }
                setBody(records)
            }

            if (response.status.isSuccess()) {
                val result: List<SupabaseMaintenanceRecord> = response.body()
                Result.success(result)
            } else {
                val error = response.bodyAsText()
                Log.e("SupabaseClient", "Failed to upsert maintenance: $error")
                Result.failure(Exception("Failed to upsert maintenance: ${response.status}"))
            }
        } catch (e: Exception) {
            Log.e("SupabaseClient", "Error upserting maintenance", e)
            Result.failure(e)
        }
    }

    /**
     * Fetch maintenance records from Supabase for the given organization.
     * Used to get records created from the web portal.
     */
    suspend fun fetchMaintenanceRecords(
        supabaseUrl: String,
        anonKey: String,
        accessToken: String,
        orgId: String
    ): Result<List<SupabaseMaintenanceRecord>> {
        return try {
            val response: HttpResponse = httpClient.get("$supabaseUrl/rest/v1/maintenance_records") {
                parameter("org_id", "eq.$orgId")
                parameter("select", "*")
                headers {
                    append("apikey", anonKey)
                    append("Authorization", "Bearer $anonKey")
                    append("Prefer", "return=representation")
                }
            }

            if (response.status.isSuccess()) {
                val records: List<SupabaseMaintenanceRecord> = response.body()
                Result.success(records)
            } else {
                val error = response.bodyAsText()
                Log.e("SupabaseClient", "Failed to fetch maintenance: $error")
                Result.failure(Exception("Failed to fetch maintenance: ${response.status}"))
            }
        } catch (e: Exception) {
            Log.e("SupabaseClient", "Error fetching maintenance", e)
            Result.failure(e)
        }
    }

    /**
     * Update vehicle status in Supabase.
     */
    suspend fun updateVehicleStatus(
        supabaseUrl: String,
        anonKey: String,
        accessToken: String,
        vehicleId: String,
        status: String
    ): Result<Unit> {
        return try {
            Log.d("SupabaseClient", "Updating vehicle $vehicleId status to $status")
            val response: HttpResponse = httpClient.patch("$supabaseUrl/rest/v1/vehicles") {
                parameter("id", "eq.$vehicleId")
                headers {
                    append("apikey", anonKey)
                    append("Authorization", "Bearer $anonKey")
                }
                setBody(mapOf("status" to status))
            }

            if (response.status.isSuccess()) {
                Result.success(Unit)
            } else {
                val error = response.bodyAsText()
                Log.e("SupabaseClient", "Failed to update vehicle status: $error")
                Result.failure(Exception("Failed to update vehicle status: ${response.status}"))
            }
        } catch (e: Exception) {
            Log.e("SupabaseClient", "Error updating vehicle status", e)
            Result.failure(e)
        }
    }

    fun close() {
        httpClient.close()
    }
}
