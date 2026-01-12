package com.fleetcommand.workshop.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Device configuration entity - stores organization binding and access token.
 * This is a singleton table (only one row with id = 1).
 */
@Entity(tableName = "device_config")
data class DeviceConfigEntity(
    @PrimaryKey
    val id: Int = 1,

    @ColumnInfo(name = "org_id")
    val orgId: String,

    @ColumnInfo(name = "org_name")
    val orgName: String,

    @ColumnInfo(name = "access_token")
    val accessToken: String,

    @ColumnInfo(name = "device_id")
    val deviceId: String,

    @ColumnInfo(name = "supabase_url")
    val supabaseUrl: String,

    @ColumnInfo(name = "supabase_anon_key")
    val supabaseAnonKey: String,

    @ColumnInfo(name = "last_sync_at")
    val lastSyncAt: Long? = null,

    @ColumnInfo(name = "setup_completed_at")
    val setupCompletedAt: Long = System.currentTimeMillis()
)
