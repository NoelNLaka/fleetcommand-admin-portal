package com.fleetcommand.workshop.ui.screens.shift

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import com.fleetcommand.workshop.data.local.entities.MechanicEntity
import com.fleetcommand.workshop.data.local.entities.ShiftReportEntity
import com.fleetcommand.workshop.ui.components.*
import com.fleetcommand.workshop.ui.theme.InStock
import com.fleetcommand.workshop.ui.theme.Warning
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShiftReportScreen(
    navController: NavController,
    viewModel: ShiftReportViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var selectedMechanic by remember { mutableStateOf<MechanicEntity?>(null) }
    var summary by remember { mutableStateOf("") }
    var mechanicExpanded by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.submitSuccess) {
        if (uiState.submitSuccess) {
            navController.popBackStack()
        }
    }

    Scaffold(
        topBar = {
            WorkshopTopBar(
                title = "End Shift Report",
                onBackClick = { navController.popBackStack() }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingIndicator()
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Shift Summary Card
                    item {
                        ShiftSummaryCard(summary = uiState.shiftSummary)
                    }

                    // Submit Report Section
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                Text(
                                    text = "Submit Shift Report",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )

                                // Mechanic Selector
                                ExposedDropdownMenuBox(
                                    expanded = mechanicExpanded,
                                    onExpandedChange = { mechanicExpanded = it }
                                ) {
                                    OutlinedTextField(
                                        value = selectedMechanic?.name ?: "",
                                        onValueChange = {},
                                        readOnly = true,
                                        label = { Text("Mechanic") },
                                        trailingIcon = {
                                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = mechanicExpanded)
                                        },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .menuAnchor()
                                    )
                                    ExposedDropdownMenu(
                                        expanded = mechanicExpanded,
                                        onDismissRequest = { mechanicExpanded = false }
                                    ) {
                                        uiState.mechanics.forEach { mechanic ->
                                            DropdownMenuItem(
                                                text = { Text(mechanic.name) },
                                                onClick = {
                                                    selectedMechanic = mechanic
                                                    mechanicExpanded = false
                                                }
                                            )
                                        }
                                    }
                                }

                                // Summary Text
                                OutlinedTextField(
                                    value = summary,
                                    onValueChange = { summary = it },
                                    label = { Text("Shift Summary") },
                                    placeholder = { Text("Describe work completed, issues encountered, notes for next shift...") },
                                    modifier = Modifier.fillMaxWidth(),
                                    minLines = 4,
                                    maxLines = 8
                                )

                                Button(
                                    onClick = {
                                        selectedMechanic?.let { mechanic ->
                                            viewModel.submitReport(mechanic.id, summary)
                                        }
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = selectedMechanic != null &&
                                            summary.isNotBlank() &&
                                            !uiState.isSubmitting
                                ) {
                                    if (uiState.isSubmitting) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(20.dp),
                                            strokeWidth = 2.dp
                                        )
                                    } else {
                                        Icon(Icons.Default.Check, null)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Submit & Lock Shift")
                                    }
                                }

                                Text(
                                    text = "Note: Submitting will lock all records from this shift. This cannot be undone.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                        }
                    }

                    // Previous Reports Section
                    if (uiState.previousReports.isNotEmpty()) {
                        item {
                            Text(
                                text = "Previous Reports",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        items(uiState.previousReports) { report ->
                            PreviousReportCard(
                                report = report,
                                mechanics = uiState.mechanics
                            )
                        }
                    }
                }
            }
        }
    }

    // Error Snackbar
    uiState.error?.let { error ->
        LaunchedEffect(error) {
            viewModel.clearError()
        }
    }
}

@Composable
private fun ShiftSummaryCard(summary: ShiftSummary) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Current Shift Summary",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                SummaryItem(
                    icon = Icons.Default.CheckCircle,
                    value = summary.maintenanceCompleted.toString(),
                    label = "Jobs Done",
                    color = InStock
                )
                SummaryItem(
                    icon = Icons.Default.Build,
                    value = summary.maintenanceInProgress.toString(),
                    label = "In Progress",
                    color = Warning
                )
            }

            HorizontalDivider()

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Receipts Total",
                        style = MaterialTheme.typography.labelSmall
                    )
                    Text(
                        text = formatCurrency(summary.receiptsTotal),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Unpaid",
                        style = MaterialTheme.typography.labelSmall
                    )
                    Text(
                        text = formatCurrency(summary.receiptsUnpaid),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (summary.receiptsUnpaid > 0) Warning else InStock
                    )
                }
            }
        }
    }
}

@Composable
private fun SummaryItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    value: String,
    label: String,
    color: androidx.compose.ui.graphics.Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = color,
            modifier = Modifier.size(32.dp)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )
    }
}

@Composable
private fun PreviousReportCard(
    report: ShiftReportEntity,
    mechanics: List<MechanicEntity>
) {
    val dateFormat = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
    val mechanicName = mechanics.find { it.id == report.mechanicId }?.name ?: "Unknown"

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = mechanicName,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = dateFormat.format(Date(report.createdAt)),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                }
                if (report.locked) {
                    Icon(
                        Icons.Default.Lock,
                        contentDescription = "Locked",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = report.summary,
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 3
            )
        }
    }
}

private fun formatCurrency(amount: Double): String {
    val format = NumberFormat.getCurrencyInstance(Locale.US)
    return format.format(amount)
}
