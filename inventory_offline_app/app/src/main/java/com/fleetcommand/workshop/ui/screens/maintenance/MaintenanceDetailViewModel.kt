package com.fleetcommand.workshop.ui.screens.maintenance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fleetcommand.workshop.data.local.entities.MaintenancePartEntity
import com.fleetcommand.workshop.data.local.entities.MaintenanceRecordEntity
import com.fleetcommand.workshop.data.local.entities.VehicleEntity
import com.fleetcommand.workshop.data.repository.MaintenanceRepository
import com.fleetcommand.workshop.data.repository.VehicleRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MaintenanceDetailUiState(
    val isLoading: Boolean = true,
    val isProcessing: Boolean = false,
    val isCompleted: Boolean = false,
    val maintenance: MaintenanceRecordEntity? = null,
    val vehicle: VehicleEntity? = null,
    val parts: List<MaintenancePartEntity> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class MaintenanceDetailViewModel @Inject constructor(
    private val maintenanceRepository: MaintenanceRepository,
    private val vehicleRepository: VehicleRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MaintenanceDetailUiState())
    val uiState: StateFlow<MaintenanceDetailUiState> = _uiState.asStateFlow()

    fun loadMaintenance(id: String) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)

                val maintenanceWithParts = maintenanceRepository.getRecordWithParts(id)
                val maintenance = maintenanceWithParts?.maintenance
                val parts = maintenanceWithParts?.parts ?: emptyList()
                val vehicle = maintenance?.let { vehicleRepository.getVehicleById(it.vehicleId) }

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    maintenance = maintenance,
                    vehicle = vehicle,
                    parts = parts
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun completeMaintenance(id: String) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isProcessing = true)
                maintenanceRepository.completeMaintenance(id)
                _uiState.value = _uiState.value.copy(
                    isProcessing = false,
                    isCompleted = true
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isProcessing = false,
                    error = e.message
                )
            }
        }
    }
}
