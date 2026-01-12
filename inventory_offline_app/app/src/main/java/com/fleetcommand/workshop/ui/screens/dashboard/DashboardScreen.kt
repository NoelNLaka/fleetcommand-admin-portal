package com.fleetcommand.workshop.ui.screens.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import com.fleetcommand.workshop.ui.navigation.NavRoutes
import com.fleetcommand.workshop.ui.theme.Error

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    navController: NavController,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            WorkshopTopBar(
                title = "Workshop Dashboard",
                actions = {
                    IconButton(onClick = { viewModel.logout() }) {
                        Icon(
                            Icons.Default.Logout,
                            contentDescription = "Logout",
                            tint = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                    IconButton(onClick = { /* Server status */ }) {
                        Icon(
                            Icons.Default.Cloud,
                            contentDescription = "Server Status",
                            tint = if (uiState.serverRunning)
                                MaterialTheme.colorScheme.onPrimary
                            else
                                Error
                        )
                    }
                }
            )
        },
        bottomBar = {
            BottomNavBar(
                currentRoute = "dashboard",
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(NavRoutes.Dashboard.route) { saveState = true }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Organization info
            uiState.orgName?.let { orgName ->
                Text(
                    text = orgName,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Stats Cards Row 1
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                StatsCard(
                    title = "Parts in Stock",
                    value = uiState.totalParts.toString(),
                    icon = Icons.Default.Inventory2,
                    modifier = Modifier.weight(1f),
                    onClick = { navController.navigate(NavRoutes.Inventory.route) }
                )
                StatsCard(
                    title = "Low Stock",
                    value = uiState.lowStockCount.toString(),
                    icon = Icons.Default.Warning,
                    iconTint = Error,
                    modifier = Modifier.weight(1f),
                    onClick = { navController.navigate(NavRoutes.Inventory.route) }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Stats Cards Row 2
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                StatsCard(
                    title = "Open Maintenance",
                    value = uiState.openMaintenance.toString(),
                    icon = Icons.Default.Build,
                    modifier = Modifier.weight(1f),
                    onClick = { navController.navigate(NavRoutes.Maintenance.route) }
                )
                StatsCard(
                    title = "Pending Requests",
                    value = uiState.pendingRequests.toString(),
                    icon = Icons.Default.Assignment,
                    modifier = Modifier.weight(1f),
                    onClick = { navController.navigate(NavRoutes.Requests.route) }
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Quick Actions Section
            Text(
                text = "Quick Actions",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(12.dp))

            QuickActionButton(
                text = "Record Parts Usage",
                icon = Icons.Default.RemoveCircle,
                onClick = { navController.navigate(NavRoutes.Inventory.route) }
            )

            QuickActionButton(
                text = "Start Maintenance",
                icon = Icons.Default.CarRepair,
                onClick = { navController.navigate(NavRoutes.StartMaintenance.route) }
            )

            QuickActionButton(
                text = "New Parts Request",
                icon = Icons.Default.AddShoppingCart,
                onClick = { navController.navigate(NavRoutes.CreateRequest.route) }
            )

            QuickActionButton(
                text = "Log COD Receipt",
                icon = Icons.Default.Receipt,
                onClick = { navController.navigate(NavRoutes.AddReceipt.route) }
            )

            QuickActionButton(
                text = "End Shift Report",
                icon = Icons.Default.Assignment,
                onClick = { navController.navigate(NavRoutes.ShiftReport.route) }
            )
        }
    }
}
