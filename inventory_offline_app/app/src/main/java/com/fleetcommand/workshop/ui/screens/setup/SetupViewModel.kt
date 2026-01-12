package com.fleetcommand.workshop.ui.screens.setup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fleetcommand.workshop.data.local.entities.DeviceConfigEntity
import com.fleetcommand.workshop.data.repository.DeviceConfigRepository
import com.fleetcommand.workshop.sync.SyncManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import javax.inject.Inject

@Serializable
data class QrSetupData(
    val orgId: String,
    val orgName: String,
    val token: String,
    val deviceId: String,
    val supabaseUrl: String,
    val supabaseAnonKey: String
)

data class SetupUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSetupComplete: Boolean = false
)

@HiltViewModel
class SetupViewModel @Inject constructor(
    private val deviceConfigRepository: DeviceConfigRepository,
    private val syncManager: SyncManager,
    private val json: Json
) : ViewModel() {

    private val _uiState = MutableStateFlow(SetupUiState())
    val uiState: StateFlow<SetupUiState> = _uiState.asStateFlow()

    fun parseAndSaveQrData(qrContent: String): Boolean {
        return try {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            val data = json.decodeFromString<QrSetupData>(qrContent)
            saveDeviceConfig(data)
            true
        } catch (e: Exception) {
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                error = "Invalid QR code format: ${e.message}"
            )
            false
        }
    }

    private fun saveDeviceConfig(data: QrSetupData) {
        viewModelScope.launch {
            try {
                val config = DeviceConfigEntity(
                    orgId = data.orgId,
                    orgName = data.orgName,
                    accessToken = data.token,
                    deviceId = data.deviceId,
                    supabaseUrl = data.supabaseUrl,
                    supabaseAnonKey = data.supabaseAnonKey
                )
                deviceConfigRepository.saveConfig(config)

                // Trigger immediate sync to pull vehicles from Supabase
                syncManager.triggerImmediateSync()

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    isSetupComplete = true
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Failed to save configuration: ${e.message}"
                )
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
