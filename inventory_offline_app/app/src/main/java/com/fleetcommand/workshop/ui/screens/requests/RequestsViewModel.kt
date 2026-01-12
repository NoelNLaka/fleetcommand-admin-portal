package com.fleetcommand.workshop.ui.screens.requests

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fleetcommand.workshop.data.local.dao.PartRequestWithItems
import com.fleetcommand.workshop.data.repository.RequestItem
import com.fleetcommand.workshop.data.repository.RequestRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class RequestsUiState(
    val isLoading: Boolean = true,
    val requests: List<PartRequestWithItems> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class RequestsViewModel @Inject constructor(
    private val requestRepository: RequestRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(RequestsUiState())
    val uiState: StateFlow<RequestsUiState> = _uiState.asStateFlow()

    init {
        loadRequests()
    }

    private fun loadRequests() {
        viewModelScope.launch {
            try {
                requestRepository.getAllWithItems().collect { requests ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        requests = requests
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

    fun createRequest(requestedBy: String, items: List<RequestItem>, notes: String?) {
        viewModelScope.launch {
            try {
                requestRepository.createRequest(requestedBy, items, notes)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = e.message)
            }
        }
    }
}
