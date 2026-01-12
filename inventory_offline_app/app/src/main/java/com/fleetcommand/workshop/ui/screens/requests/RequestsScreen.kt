package com.fleetcommand.workshop.ui.screens.requests

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.fleetcommand.workshop.data.local.dao.PartRequestWithItems
import com.fleetcommand.workshop.ui.components.*
import com.fleetcommand.workshop.ui.navigation.NavRoutes
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestsScreen(
    navController: NavController,
    viewModel: RequestsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var selectedTab by remember { mutableStateOf(0) }

    Scaffold(
        topBar = {
            WorkshopTopBar(
                title = "Parts Requests",
                onBackClick = { navController.popBackStack() }
            )
        },
        bottomBar = {
            BottomNavBar(
                currentRoute = "requests",
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(NavRoutes.Dashboard.route) { saveState = true }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { navController.navigate(NavRoutes.CreateRequest.route) }
            ) {
                Icon(Icons.Default.Add, contentDescription = "New Request")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Tabs
            TabRow(selectedTabIndex = selectedTab) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Pending") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Approved") }
                )
                Tab(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    text = { Text("All") }
                )
            }

            when {
                uiState.isLoading -> LoadingIndicator()
                else -> {
                    val filteredRequests = when (selectedTab) {
                        0 -> uiState.requests.filter { it.request.status == "pending" }
                        1 -> uiState.requests.filter { it.request.status == "approved" }
                        else -> uiState.requests
                    }

                    if (filteredRequests.isEmpty()) {
                        EmptyState(
                            message = "No requests found",
                            icon = Icons.Default.Assignment
                        )
                    } else {
                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(filteredRequests) { request ->
                                RequestCard(
                                    request = request,
                                    onClick = { /* Navigate to detail */ }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RequestCard(
    request: PartRequestWithItems,
    onClick: () -> Unit
) {
    val dateFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${request.items.size} items",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                StatusBadge(status = request.request.status)
            }

            Spacer(modifier = Modifier.height(8.dp))

            // List items
            request.items.take(3).forEach { item ->
                Text(
                    text = "- ${item.partName} x ${item.quantity}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            if (request.items.size > 3) {
                Text(
                    text = "... and ${request.items.size - 3} more",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = dateFormat.format(Date(request.request.createdAt)),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
            )
        }
    }
}
