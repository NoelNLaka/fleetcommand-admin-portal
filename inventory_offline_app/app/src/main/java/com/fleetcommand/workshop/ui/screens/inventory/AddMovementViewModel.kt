package com.fleetcommand.workshop.ui.screens.inventory

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fleetcommand.workshop.data.local.entities.PartEntity
import com.fleetcommand.workshop.data.repository.InventoryRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AddMovementUiState(
    val isLoading: Boolean = false,
    val part: PartEntity? = null,
    val currentStock: Int = 0,
    val isSuccess: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class AddMovementViewModel @Inject constructor(
    private val inventoryRepository: InventoryRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AddMovementUiState())
    val uiState: StateFlow<AddMovementUiState> = _uiState.asStateFlow()

    fun loadPart(partId: String) {
        viewModelScope.launch {
            try {
                val part = inventoryRepository.getPartById(partId)
                val stock = inventoryRepository.getStockLevel(partId)
                _uiState.value = _uiState.value.copy(
                    part = part,
                    currentStock = stock
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = e.message)
            }
        }
    }

    fun recordMovement(
        partId: String,
        quantity: Int,
        movementType: String,
        reason: String?
    ) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true, error = null)

                inventoryRepository.recordMovement(
                    partId = partId,
                    quantity = quantity,
                    movementType = movementType,
                    reason = reason
                )

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    isSuccess = true
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }
}
