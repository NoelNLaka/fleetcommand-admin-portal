package com.fleetcommand.workshop.ui.screens.inventory

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fleetcommand.workshop.data.local.entities.InventoryMovementEntity
import com.fleetcommand.workshop.data.local.entities.PartEntity
import com.fleetcommand.workshop.data.repository.InventoryRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class InventoryDetailUiState(
    val isLoading: Boolean = true,
    val part: PartEntity? = null,
    val currentStock: Int = 0,
    val movements: List<InventoryMovementEntity> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class InventoryDetailViewModel @Inject constructor(
    private val inventoryRepository: InventoryRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(InventoryDetailUiState())
    val uiState: StateFlow<InventoryDetailUiState> = _uiState.asStateFlow()

    fun loadPartDetails(partId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)

                val part = inventoryRepository.getPartById(partId)
                val stock = inventoryRepository.getStockLevel(partId)

                inventoryRepository.getMovementsByPart(partId).collect { movements ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        part = part,
                        currentStock = stock,
                        movements = movements
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
}
