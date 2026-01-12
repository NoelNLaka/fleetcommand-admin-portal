package com.fleetcommand.workshop.ui.screens.maintenance

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import com.fleetcommand.workshop.ui.components.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MaintenanceDetailScreen(
    maintenanceId: String,
    navController: NavController,
    viewModel: MaintenanceDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val dateFormat = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())

    LaunchedEffect(maintenanceId) {
        viewModel.loadMaintenance(maintenanceId)
    }

    LaunchedEffect(uiState.isCompleted) {
        if (uiState.isCompleted) {
            navController.popBackStack()
        }
    }

    Scaffold(
        topBar = {
            WorkshopTopBar(
                title = "Maintenance Details",
                onBackClick = { navController.popBackStack() }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingIndicator()
            uiState.maintenance == null -> EmptyState(message = "Maintenance record not found")
            else -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Vehicle Info
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = uiState.vehicle?.plate ?: "Unknown",
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                StatusBadge(status = uiState.maintenance!!.status)
                            }
                            Text(
                                text = uiState.vehicle?.name ?: "",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }

                    // Service Info
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "Service Type",
                                style = MaterialTheme.typography.labelLarge
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = uiState.maintenance!!.serviceType,
                                style = MaterialTheme.typography.bodyLarge
                            )
                            uiState.maintenance!!.notes?.let { notes ->
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Notes: $notes",
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                        }
                    }

                    // Timeline
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "Timeline",
                                style = MaterialTheme.typography.labelLarge
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Row {
                                Icon(Icons.Default.PlayArrow, null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Started: ${dateFormat.format(Date(uiState.maintenance!!.startedAt))}")
                            }
                            uiState.maintenance!!.completedAt?.let { completedAt ->
                                Spacer(modifier = Modifier.height(4.dp))
                                Row {
                                    Icon(Icons.Default.Check, null)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Completed: ${dateFormat.format(Date(completedAt))}")
                                }
                            }
                        }
                    }

                    // Parts Used
                    if (uiState.parts.isNotEmpty()) {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "Parts Used",
                                    style = MaterialTheme.typography.labelLarge
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                uiState.parts.forEach { part ->
                                    Text("- Part ID: ${part.partId} x ${part.quantity}")
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.weight(1f))

                    // Complete Button
                    if (uiState.maintenance!!.status == "open") {
                        Button(
                            onClick = { viewModel.completeMaintenance(maintenanceId) },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !uiState.isProcessing
                        ) {
                            if (uiState.isProcessing) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Icon(Icons.Default.Check, null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Complete Maintenance")
                            }
                        }
                    }
                }
            }
        }
    }
}
