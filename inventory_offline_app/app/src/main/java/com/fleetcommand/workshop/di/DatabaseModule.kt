package com.fleetcommand.workshop.di

import android.content.Context
import androidx.room.Room
import com.fleetcommand.workshop.data.local.AppDatabase
import com.fleetcommand.workshop.data.local.dao.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(
        @ApplicationContext context: Context
    ): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            AppDatabase.DATABASE_NAME
        )
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    fun provideDeviceConfigDao(database: AppDatabase): DeviceConfigDao {
        return database.deviceConfigDao()
    }

    @Provides
    fun provideMechanicDao(database: AppDatabase): MechanicDao {
        return database.mechanicDao()
    }

    @Provides
    fun provideVehicleDao(database: AppDatabase): VehicleDao {
        return database.vehicleDao()
    }

    @Provides
    fun providePartDao(database: AppDatabase): PartDao {
        return database.partDao()
    }

    @Provides
    fun provideInventoryMovementDao(database: AppDatabase): InventoryMovementDao {
        return database.inventoryMovementDao()
    }

    @Provides
    fun providePartRequestDao(database: AppDatabase): PartRequestDao {
        return database.partRequestDao()
    }

    @Provides
    fun providePartRequestItemDao(database: AppDatabase): PartRequestItemDao {
        return database.partRequestItemDao()
    }

    @Provides
    fun provideReceiptDao(database: AppDatabase): ReceiptDao {
        return database.receiptDao()
    }

    @Provides
    fun provideMaintenanceRecordDao(database: AppDatabase): MaintenanceRecordDao {
        return database.maintenanceRecordDao()
    }

    @Provides
    fun provideMaintenancePartDao(database: AppDatabase): MaintenancePartDao {
        return database.maintenancePartDao()
    }

    @Provides
    fun provideShiftReportDao(database: AppDatabase): ShiftReportDao {
        return database.shiftReportDao()
    }
}
