package com.fleetcommand.workshop.ui.screens.inventory

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import com.fleetcommand.workshop.data.local.dao.PartWithStock
import com.fleetcommand.workshop.ui.components.*
import com.fleetcommand.workshop.ui.navigation.NavRoutes
import com.fleetcommand.workshop.ui.theme.InStock
import com.fleetcommand.workshop.ui.theme.LowStock
import com.fleetcommand.workshop.ui.theme.Warning

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventoryScreen(
    navController: NavController,
    viewModel: InventoryViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            WorkshopTopBar(
                title = "Inventory",
                onBackClick = { navController.popBackStack() }
            )
        },
        bottomBar = {
            BottomNavBar(
                currentRoute = "inventory",
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
                onClick = { navController.navigate(NavRoutes.AddPart.route) }
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Part")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = {
                    searchQuery = it
                    viewModel.search(it)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                placeholder = { Text("Search parts...") },
                leadingIcon = { Icon(Icons.Default.Search, null) },
                singleLine = true,
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = {
                            searchQuery = ""
                            viewModel.search("")
                        }) {
                            Icon(Icons.Default.Clear, null)
                        }
                    }
                }
            )

            // Category Filter Chips
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    FilterChip(
                        selected = selectedCategory == null,
                        onClick = {
                            selectedCategory = null
                            viewModel.filterByCategory(null)
                        },
                        label = { Text("All") }
                    )
                }
                items(uiState.categories) { category ->
                    FilterChip(
                        selected = selectedCategory == category,
                        onClick = {
                            selectedCategory = category
                            viewModel.filterByCategory(category)
                        },
                        label = { Text(category) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Parts List
            when {
                uiState.isLoading -> LoadingIndicator()
                uiState.filteredParts.isEmpty() -> EmptyState(
                    message = "No parts found",
                    icon = Icons.Default.Inventory2
                )
                else -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(uiState.filteredParts) { part ->
                            PartCard(
                                part = part,
                                onClick = {
                                    navController.navigate(
                                        NavRoutes.InventoryDetail.createRoute(part.id)
                                    )
                                },
                                onRecordUsage = {
                                    navController.navigate(
                                        NavRoutes.AddMovement.createRoute(part.id)
                                    )
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PartCard(
    part: PartWithStock,
    onClick: () -> Unit,
    onRecordUsage: () -> Unit
) {
    val stockStatus = when {
        part.currentStock <= 0 -> "OUT_OF_STOCK" to LowStock
        part.currentStock <= part.minStock -> "LOW_STOCK" to Warning
        else -> "IN_STOCK" to InStock
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = part.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = part.category,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${part.currentStock} ${part.unit}",
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Bold,
                        color = stockStatus.second
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "(min: ${part.minStock})",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                }
            }

            IconButton(onClick = onRecordUsage) {
                Icon(
                    Icons.Default.RemoveCircle,
                    contentDescription = "Record Usage",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}
