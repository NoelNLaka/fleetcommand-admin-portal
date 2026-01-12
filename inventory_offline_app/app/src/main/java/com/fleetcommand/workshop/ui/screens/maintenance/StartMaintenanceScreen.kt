package com.fleetcommand.workshop.ui.screens.maintenance

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import com.fleetcommand.workshop.ui.components.WorkshopTopBar

// Common service types for the dropdown
private val serviceTypes = listOf(
    "Oil Change",
    "Brake Repair",
    "Tire Rotation",
    "Tire Replacement",
    "Engine Repair",
    "Transmission Service",
    "Battery Replacement",
    "Air Filter Replacement",
    "Coolant Flush",
    "Inspection",
    "General Maintenance",
    "Other"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StartMaintenanceScreen(
    navController: NavController,
    viewModel: MaintenanceViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    var selectedVehicleId by remember { mutableStateOf<String?>(null) }
    var selectedMechanicId by remember { mutableStateOf<String?>(null) }
    var selectedServiceType by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var arrivalMileage by remember { mutableStateOf("") }
    var costEstimate by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            WorkshopTopBar(
                title = "Start Maintenance",
                onBackClick = { navController.popBackStack() }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Vehicle Selection
            var vehicleExpanded by remember { mutableStateOf(false) }
            val availableVehicles = uiState.vehicles.filter {
                it.status != "Maintenance" && it.status != "maintenance"
            }
            val selectedVehicle = availableVehicles.find { it.id == selectedVehicleId }

            ExposedDropdownMenuBox(
                expanded = vehicleExpanded,
                onExpandedChange = { vehicleExpanded = !vehicleExpanded }
            ) {
                OutlinedTextField(
                    value = selectedVehicle?.let { "${it.plate} - ${it.name}" } ?: "",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Select Vehicle *") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(),
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = vehicleExpanded) },
                    supportingText = {
                        if (availableVehicles.isEmpty()) {
                            Text("No vehicles available. Sync to load fleet.")
                        }
                    }
                )
                ExposedDropdownMenu(
                    expanded = vehicleExpanded,
                    onDismissRequest = { vehicleExpanded = false }
                ) {
                    availableVehicles.forEach { vehicle ->
                        DropdownMenuItem(
                            text = {
                                Column {
                                    Text("${vehicle.plate} - ${vehicle.name}")
                                    vehicle.mileage?.let {
                                        Text(
                                            text = "Mileage: $it",
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                    }
                                }
                            },
                            onClick = {
                                selectedVehicleId = vehicle.id
                                // Pre-fill mileage if available
                                vehicle.mileage?.let {
                                    arrivalMileage = it.replace(",", "").replace(" ", "")
                                }
                                vehicleExpanded = false
                            }
                        )
                    }
                }
            }

            // Service Type Selection
            var serviceTypeExpanded by remember { mutableStateOf(false) }

            ExposedDropdownMenuBox(
                expanded = serviceTypeExpanded,
                onExpandedChange = { serviceTypeExpanded = !serviceTypeExpanded }
            ) {
                OutlinedTextField(
                    value = selectedServiceType,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Service Type *") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(),
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = serviceTypeExpanded) }
                )
                ExposedDropdownMenu(
                    expanded = serviceTypeExpanded,
                    onDismissRequest = { serviceTypeExpanded = false }
                ) {
                    serviceTypes.forEach { serviceType ->
                        DropdownMenuItem(
                            text = { Text(serviceType) },
                            onClick = {
                                selectedServiceType = serviceType
                                serviceTypeExpanded = false
                            }
                        )
                    }
                }
            }

            // Mechanic Selection
            var mechanicExpanded by remember { mutableStateOf(false) }
            val selectedMechanic = uiState.mechanics.find { it.id == selectedMechanicId }

            ExposedDropdownMenuBox(
                expanded = mechanicExpanded,
                onExpandedChange = { mechanicExpanded = !mechanicExpanded }
            ) {
                OutlinedTextField(
                    value = selectedMechanic?.name ?: "",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Assign Mechanic *") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(),
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = mechanicExpanded) },
                    supportingText = {
                        if (uiState.mechanics.isEmpty()) {
                            Text("No mechanics available. Add mechanics first.")
                        }
                    }
                )
                ExposedDropdownMenu(
                    expanded = mechanicExpanded,
                    onDismissRequest = { mechanicExpanded = false }
                ) {
                    uiState.mechanics.forEach { mechanic ->
                        DropdownMenuItem(
                            text = { Text("${mechanic.name} (${mechanic.role})") },
                            onClick = {
                                selectedMechanicId = mechanic.id
                                mechanicExpanded = false
                            }
                        )
                    }
                }
            }

            // Arrival Mileage
            OutlinedTextField(
                value = arrivalMileage,
                onValueChange = { arrivalMileage = it.filter { c -> c.isDigit() } },
                label = { Text("Arrival Mileage") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                placeholder = { Text("Current odometer reading") }
            )

            // Cost Estimate
            OutlinedTextField(
                value = costEstimate,
                onValueChange = { costEstimate = it.filter { c -> c.isDigit() || c == '.' } },
                label = { Text("Cost Estimate") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                prefix = { Text("$") },
                placeholder = { Text("Estimated cost") }
            )

            // Notes
            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Notes") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3,
                maxLines = 5,
                placeholder = { Text("Describe the maintenance work to be done...") }
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Start Button
            Button(
                onClick = {
                    val mechanic = uiState.mechanics.find { it.id == selectedMechanicId }
                    if (selectedVehicleId != null && selectedMechanicId != null &&
                        selectedServiceType.isNotBlank() && mechanic != null) {
                        isSaving = true
                        viewModel.startMaintenance(
                            vehicleId = selectedVehicleId!!,
                            mechanicId = selectedMechanicId!!,
                            mechanicName = mechanic.name,
                            serviceType = selectedServiceType,
                            notes = notes.ifBlank { null },
                            arrivalMileage = arrivalMileage.toIntOrNull(),
                            costEstimate = costEstimate.toDoubleOrNull()
                        )
                        navController.popBackStack()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = selectedVehicleId != null &&
                         selectedMechanicId != null &&
                         selectedServiceType.isNotBlank() &&
                         !isSaving
            ) {
                Text("Start Maintenance")
            }
        }
    }
}
