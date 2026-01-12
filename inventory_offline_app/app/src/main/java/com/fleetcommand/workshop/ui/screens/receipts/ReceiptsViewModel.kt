package com.fleetcommand.workshop.ui.screens.receipts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fleetcommand.workshop.data.local.entities.ReceiptEntity
import com.fleetcommand.workshop.data.repository.ReceiptRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ReceiptsUiState(
    val isLoading: Boolean = true,
    val receipts: List<ReceiptEntity> = emptyList(),
    val totalUnpaid: Double = 0.0,
    val error: String? = null
)

@HiltViewModel
class ReceiptsViewModel @Inject constructor(
    private val receiptRepository: ReceiptRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReceiptsUiState())
    val uiState: StateFlow<ReceiptsUiState> = _uiState.asStateFlow()

    init {
        loadReceipts()
    }

    private fun loadReceipts() {
        viewModelScope.launch {
            try {
                receiptRepository.getAllReceipts().collect { receipts ->
                    val totalUnpaid = receiptRepository.getTotalUnpaid()
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        receipts = receipts,
                        totalUnpaid = totalUnpaid
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

    fun addReceipt(supplier: String, amount: Double, invoiceNumber: String?, paid: Boolean) {
        viewModelScope.launch {
            try {
                receiptRepository.addReceipt(supplier, amount, invoiceNumber, paid)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = e.message)
            }
        }
    }

    fun markAsPaid(id: String) {
        viewModelScope.launch {
            try {
                receiptRepository.updatePaidStatus(id, true)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = e.message)
            }
        }
    }
}
