package com.fleetcommand.workshop.ui.screens.maintenance

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fleetcommand.workshop.data.local.dao.MaintenanceWithVehicle
import com.fleetcommand.workshop.data.local.entities.MechanicEntity
import com.fleetcommand.workshop.data.local.entities.VehicleEntity
import com.fleetcommand.workshop.data.repository.MaintenanceRepository
import com.fleetcommand.workshop.data.repository.MechanicRepository
import com.fleetcommand.workshop.data.repository.VehicleRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val TAG = "MaintenanceViewModel"

data class MaintenanceUiState(
    val isLoading: Boolean = true,
    val records: List<MaintenanceWithVehicle> = emptyList(),
    val vehicles: List<VehicleEntity> = emptyList(),
    val mechanics: List<MechanicEntity> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class MaintenanceViewModel @Inject constructor(
    private val maintenanceRepository: MaintenanceRepository,
    private val vehicleRepository: VehicleRepository,
    private val mechanicRepository: MechanicRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MaintenanceUiState())
    val uiState: StateFlow<MaintenanceUiState> = _uiState.asStateFlow()

    init {
        loadMaintenance()
        loadVehiclesAndMechanics()
    }

    private fun loadMaintenance() {
        viewModelScope.launch {
            try {
                maintenanceRepository.getAllWithVehicle().collect { records ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        records = records
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    private fun loadVehiclesAndMechanics() {
        viewModelScope.launch {
            try {
                vehicleRepository.getAllVehicles().collect { vehicles ->
                    _uiState.value = _uiState.value.copy(vehicles = vehicles)
                }
            } catch (e: Exception) {
                // Handle error
            }
        }
        viewModelScope.launch {
            try {
                mechanicRepository.getActiveMechanics().collect { mechanics ->
                    _uiState.value = _uiState.value.copy(mechanics = mechanics)
                }
            } catch (e: Exception) {
                // Handle error
            }
        }
    }

    fun startMaintenance(
        vehicleId: String,
        mechanicId: String,
        mechanicName: String,
        serviceType: String,
        notes: String? = null,
        arrivalMileage: Int? = null,
        costEstimate: Double? = null
    ) {
        Log.d(TAG, "startMaintenance called in ViewModel")
        Log.d(TAG, "vehicleId=$vehicleId, mechanicId=$mechanicId, serviceType=$serviceType")

        viewModelScope.launch {
            try {
                Log.d(TAG, "Calling repository.startMaintenance...")
                val record = maintenanceRepository.startMaintenance(
                    vehicleId = vehicleId,
                    mechanicId = mechanicId,
                    mechanicName = mechanicName,
                    serviceType = serviceType,
                    notes = notes,
                    arrivalMileage = arrivalMileage,
                    costEstimate = costEstimate
                )
                Log.d(TAG, "Repository returned record: ${record.id}")
            } catch (e: Exception) {
                Log.e(TAG, "Error in startMaintenance: ${e.message}", e)
                _uiState.value = _uiState.value.copy(error = e.message)
            }
        }
    }

    fun completeMaintenance(id: String) {
        viewModelScope.launch {
            try {
                maintenanceRepository.completeMaintenance(id)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = e.message)
            }
        }
    }
}
