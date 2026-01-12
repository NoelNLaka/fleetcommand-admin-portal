package com.fleetcommand.workshop.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fleetcommand.workshop.data.repository.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardUiState(
    val isLoading: Boolean = true,
    val orgName: String? = null,
    val totalParts: Int = 0,
    val lowStockCount: Int = 0,
    val openMaintenance: Int = 0,
    val pendingRequests: Int = 0,
    val serverRunning: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val deviceConfigRepository: DeviceConfigRepository,
    private val inventoryRepository: InventoryRepository,
    private val maintenanceRepository: MaintenanceRepository,
    private val requestRepository: RequestRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadDashboardData()
    }

    fun loadDashboardData() {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)

                // Get org name
                val config = deviceConfigRepository.getConfigSync()
                val orgName = config?.orgName

                // Get inventory stats
                val inventoryLevels = inventoryRepository.getInventoryLevelsSync()
                val totalParts = inventoryLevels.size
                val lowStockCount = inventoryRepository.countLowStockItems()

                // Get maintenance count
                val openMaintenance = maintenanceRepository.countOpen()

                // Get pending requests
                val pendingRequests = requestRepository.countPending()

                _uiState.value = DashboardUiState(
                    isLoading = false,
                    orgName = orgName,
                    totalParts = totalParts,
                    lowStockCount = lowStockCount,
                    openMaintenance = openMaintenance,
                    pendingRequests = pendingRequests,
                    serverRunning = true
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun refresh() {
        loadDashboardData()
    }

    fun logout() {
        viewModelScope.launch {
            deviceConfigRepository.clearConfig()
        }
    }
}
