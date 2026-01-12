package com.fleetcommand.workshop.di

import com.fleetcommand.workshop.data.local.dao.*
import com.fleetcommand.workshop.data.repository.*
import com.fleetcommand.workshop.sync.SyncManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides
    @Singleton
    fun provideDeviceConfigRepository(
        deviceConfigDao: DeviceConfigDao
    ): DeviceConfigRepository {
        return DeviceConfigRepositoryImpl(deviceConfigDao)
    }

    @Provides
    @Singleton
    fun provideInventoryRepository(
        partDao: PartDao,
        inventoryMovementDao: InventoryMovementDao,
        deviceConfigDao: DeviceConfigDao
    ): InventoryRepository {
        return InventoryRepositoryImpl(partDao, inventoryMovementDao, deviceConfigDao)
    }

    @Provides
    @Singleton
    fun provideMaintenanceRepository(
        maintenanceRecordDao: MaintenanceRecordDao,
        maintenancePartDao: MaintenancePartDao,
        vehicleDao: VehicleDao,
        deviceConfigDao: DeviceConfigDao,
        syncManager: SyncManager
    ): MaintenanceRepository {
        return MaintenanceRepositoryImpl(
            maintenanceRecordDao,
            maintenancePartDao,
            vehicleDao,
            deviceConfigDao,
            syncManager
        )
    }

    @Provides
    @Singleton
    fun provideRequestRepository(
        partRequestDao: PartRequestDao,
        partRequestItemDao: PartRequestItemDao,
        deviceConfigDao: DeviceConfigDao
    ): RequestRepository {
        return RequestRepositoryImpl(partRequestDao, partRequestItemDao, deviceConfigDao)
    }

    @Provides
    @Singleton
    fun provideReceiptRepository(
        receiptDao: ReceiptDao,
        deviceConfigDao: DeviceConfigDao
    ): ReceiptRepository {
        return ReceiptRepositoryImpl(receiptDao, deviceConfigDao)
    }

    @Provides
    @Singleton
    fun provideVehicleRepository(
        vehicleDao: VehicleDao,
        deviceConfigDao: DeviceConfigDao
    ): VehicleRepository {
        return VehicleRepositoryImpl(vehicleDao, deviceConfigDao)
    }

    @Provides
    @Singleton
    fun provideMechanicRepository(
        mechanicDao: MechanicDao,
        deviceConfigDao: DeviceConfigDao
    ): MechanicRepository {
        return MechanicRepositoryImpl(mechanicDao, deviceConfigDao)
    }

    @Provides
    @Singleton
    fun provideShiftReportRepository(
        shiftReportDao: ShiftReportDao,
        deviceConfigDao: DeviceConfigDao
    ): ShiftReportRepository {
        return ShiftReportRepositoryImpl(shiftReportDao, deviceConfigDao)
    }
}
