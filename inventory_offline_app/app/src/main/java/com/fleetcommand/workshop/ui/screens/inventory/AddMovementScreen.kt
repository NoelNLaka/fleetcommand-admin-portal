package com.fleetcommand.workshop.ui.screens.inventory

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import com.fleetcommand.workshop.ui.components.WorkshopTopBar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddMovementScreen(
    partId: String,
    navController: NavController,
    viewModel: AddMovementViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    var quantity by remember { mutableStateOf("") }
    var selectedType by remember { mutableStateOf("OUT") }
    var reason by remember { mutableStateOf("") }

    LaunchedEffect(partId) {
        viewModel.loadPart(partId)
    }

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) {
            navController.popBackStack()
        }
    }

    Scaffold(
        topBar = {
            WorkshopTopBar(
                title = "Record Movement",
                onBackClick = { navController.popBackStack() }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Part Info
            uiState.part?.let { part ->
                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = part.name,
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            text = "Current stock: ${uiState.currentStock} ${part.unit}",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }

            // Movement Type Selection
            Text(
                text = "Movement Type",
                style = MaterialTheme.typography.labelLarge
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("IN", "OUT", "ADJUSTMENT").forEach { type ->
                    FilterChip(
                        selected = selectedType == type,
                        onClick = { selectedType = type },
                        label = { Text(type) },
                        leadingIcon = {
                            when (type) {
                                "IN" -> Icon(Icons.Default.Add, null)
                                "OUT" -> Icon(Icons.Default.Remove, null)
                                else -> Icon(Icons.Default.SwapVert, null)
                            }
                        }
                    )
                }
            }

            // Quantity
            OutlinedTextField(
                value = quantity,
                onValueChange = { quantity = it.filter { c -> c.isDigit() } },
                label = { Text("Quantity") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true
            )

            // Reason
            OutlinedTextField(
                value = reason,
                onValueChange = { reason = it },
                label = { Text("Reason (optional)") },
                modifier = Modifier.fillMaxWidth(),
                maxLines = 3
            )

            Spacer(modifier = Modifier.weight(1f))

            // Save Button
            Button(
                onClick = {
                    val qty = quantity.toIntOrNull() ?: 0
                    if (qty > 0) {
                        viewModel.recordMovement(
                            partId = partId,
                            quantity = qty,
                            movementType = selectedType,
                            reason = reason.ifBlank { null }
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = quantity.isNotBlank() && !uiState.isLoading
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("Save Movement")
                }
            }

            // Error
            uiState.error?.let { error ->
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}
