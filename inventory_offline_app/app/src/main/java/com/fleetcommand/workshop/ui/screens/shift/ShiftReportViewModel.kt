package com.fleetcommand.workshop.ui.screens.shift

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fleetcommand.workshop.data.local.entities.MechanicEntity
import com.fleetcommand.workshop.data.local.entities.ShiftReportEntity
import com.fleetcommand.workshop.data.repository.MaintenanceRepository
import com.fleetcommand.workshop.data.repository.MechanicRepository
import com.fleetcommand.workshop.data.repository.ReceiptRepository
import com.fleetcommand.workshop.data.repository.ShiftReportRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ShiftSummary(
    val maintenanceCompleted: Int = 0,
    val maintenanceInProgress: Int = 0,
    val receiptsTotal: Double = 0.0,
    val receiptsUnpaid: Double = 0.0
)

data class ShiftReportUiState(
    val isLoading: Boolean = true,
    val mechanics: List<MechanicEntity> = emptyList(),
    val previousReports: List<ShiftReportEntity> = emptyList(),
    val shiftSummary: ShiftSummary = ShiftSummary(),
    val isSubmitting: Boolean = false,
    val submitSuccess: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ShiftReportViewModel @Inject constructor(
    private val shiftReportRepository: ShiftReportRepository,
    private val mechanicRepository: MechanicRepository,
    private val maintenanceRepository: MaintenanceRepository,
    private val receiptRepository: ReceiptRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ShiftReportUiState())
    val uiState: StateFlow<ShiftReportUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        viewModelScope.launch {
            try {
                // Load mechanics
                mechanicRepository.getActiveMechanics().collect { mechanics ->
                    _uiState.value = _uiState.value.copy(
                        mechanics = mechanics
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = e.message
                )
            }
        }

        viewModelScope.launch {
            try {
                // Load previous reports
                shiftReportRepository.getAllReports().collect { reports ->
                    _uiState.value = _uiState.value.copy(
                        previousReports = reports.take(10) // Last 10 reports
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = e.message
                )
            }
        }

        viewModelScope.launch {
            try {
                // Load shift summary
                val maintenanceCompleted = maintenanceRepository.getCompletedCount()
                val maintenanceInProgress = maintenanceRepository.getInProgressCount()
                val receiptsTotal = receiptRepository.getTotalAmount()
                val receiptsUnpaid = receiptRepository.getTotalUnpaid()

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    shiftSummary = ShiftSummary(
                        maintenanceCompleted = maintenanceCompleted,
                        maintenanceInProgress = maintenanceInProgress,
                        receiptsTotal = receiptsTotal,
                        receiptsUnpaid = receiptsUnpaid
                    )
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun submitReport(mechanicId: String, summary: String) {
        if (mechanicId.isBlank() || summary.isBlank()) return

        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isSubmitting = true)
                shiftReportRepository.submitReport(mechanicId, summary)
                _uiState.value = _uiState.value.copy(
                    isSubmitting = false,
                    submitSuccess = true
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isSubmitting = false,
                    error = e.message
                )
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
