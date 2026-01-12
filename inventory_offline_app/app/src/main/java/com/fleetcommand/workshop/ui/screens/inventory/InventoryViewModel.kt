package com.fleetcommand.workshop.ui.screens.inventory

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fleetcommand.workshop.data.local.dao.PartWithStock
import com.fleetcommand.workshop.data.local.entities.PartEntity
import com.fleetcommand.workshop.data.repository.InventoryRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class InventoryUiState(
    val isLoading: Boolean = true,
    val parts: List<PartWithStock> = emptyList(),
    val filteredParts: List<PartWithStock> = emptyList(),
    val categories: List<String> = emptyList(),
    val searchQuery: String = "",
    val selectedCategory: String? = null,
    val error: String? = null
)

@HiltViewModel
class InventoryViewModel @Inject constructor(
    private val inventoryRepository: InventoryRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(InventoryUiState())
    val uiState: StateFlow<InventoryUiState> = _uiState.asStateFlow()

    init {
        loadInventory()
    }

    private fun loadInventory() {
        viewModelScope.launch {
            try {
                inventoryRepository.getInventoryLevels().collect { parts ->
                    val categories = parts.map { it.category }.distinct().sorted()
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        parts = parts,
                        filteredParts = applyFilters(parts),
                        categories = categories
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

    fun search(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        _uiState.value = _uiState.value.copy(
            filteredParts = applyFilters(_uiState.value.parts)
        )
    }

    fun filterByCategory(category: String?) {
        _uiState.value = _uiState.value.copy(selectedCategory = category)
        _uiState.value = _uiState.value.copy(
            filteredParts = applyFilters(_uiState.value.parts)
        )
    }

    private fun applyFilters(parts: List<PartWithStock>): List<PartWithStock> {
        val state = _uiState.value
        return parts.filter { part ->
            val matchesSearch = state.searchQuery.isEmpty() ||
                    part.name.contains(state.searchQuery, ignoreCase = true)
            val matchesCategory = state.selectedCategory == null ||
                    part.category == state.selectedCategory
            matchesSearch && matchesCategory
        }
    }

    fun addPart(name: String, category: String, unit: String, minStock: Int) {
        viewModelScope.launch {
            val part = PartEntity(
                id = UUID.randomUUID().toString(),
                orgId = "", // Will be set by repository
                name = name,
                category = category,
                unit = unit,
                minStock = minStock
            )
            inventoryRepository.addPart(part)
        }
    }
}
