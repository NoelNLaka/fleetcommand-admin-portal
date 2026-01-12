package com.fleetcommand.workshop.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Receipt entity - represents COD (Cash on Delivery) payment records.
 */
@Entity(
    tableName = "receipts",
    indices = [Index("org_id"), Index("created_at")]
)
data class ReceiptEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "org_id")
    val orgId: String,

    val supplier: String,

    val amount: Double,

    @ColumnInfo(name = "invoice_number")
    val invoiceNumber: String?,

    @ColumnInfo(name = "image_path")
    val imagePath: String?, // Local file path to receipt image

    val paid: Boolean = false,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis()
)
