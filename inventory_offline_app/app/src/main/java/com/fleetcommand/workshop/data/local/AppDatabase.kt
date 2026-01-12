package com.fleetcommand.workshop.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.fleetcommand.workshop.data.local.converters.DateConverters
import com.fleetcommand.workshop.data.local.dao.*
import com.fleetcommand.workshop.data.local.entities.*

@Database(
    entities = [
        DeviceConfigEntity::class,
        MechanicEntity::class,
        VehicleEntity::class,
        PartEntity::class,
        InventoryMovementEntity::class,
        PartRequestEntity::class,
        PartRequestItemEntity::class,
        ReceiptEntity::class,
        MaintenanceRecordEntity::class,
        MaintenancePartEntity::class,
        ShiftReportEntity::class
    ],
    version = 3, // Bumped for staff sync schema changes (jobId, department, jobTitle)
    exportSchema = true
)
@TypeConverters(DateConverters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun deviceConfigDao(): DeviceConfigDao
    abstract fun mechanicDao(): MechanicDao
    abstract fun vehicleDao(): VehicleDao
    abstract fun partDao(): PartDao
    abstract fun inventoryMovementDao(): InventoryMovementDao
    abstract fun partRequestDao(): PartRequestDao
    abstract fun partRequestItemDao(): PartRequestItemDao
    abstract fun receiptDao(): ReceiptDao
    abstract fun maintenanceRecordDao(): MaintenanceRecordDao
    abstract fun maintenancePartDao(): MaintenancePartDao
    abstract fun shiftReportDao(): ShiftReportDao

    companion object {
        const val DATABASE_NAME = "workshop_database"
    }
}
