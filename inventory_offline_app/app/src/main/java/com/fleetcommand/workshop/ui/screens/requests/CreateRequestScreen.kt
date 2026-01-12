package com.fleetcommand.workshop.ui.screens.requests

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.fleetcommand.workshop.data.repository.RequestItem
import com.fleetcommand.workshop.ui.components.WorkshopTopBar

data class RequestItemInput(
    val partName: String = "",
    val quantity: String = ""
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateRequestScreen(
    navController: NavController,
    viewModel: RequestsViewModel = hiltViewModel()
) {
    var items by remember { mutableStateOf(listOf(RequestItemInput())) }
    var notes by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            WorkshopTopBar(
                title = "New Parts Request",
                onBackClick = { navController.popBackStack() }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Text(
                        text = "Items",
                        style = MaterialTheme.typography.labelLarge
                    )
                }

                itemsIndexed(items) { index, item ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Item ${index + 1}",
                                    style = MaterialTheme.typography.labelMedium
                                )
                                if (items.size > 1) {
                                    IconButton(
                                        onClick = {
                                            items = items.toMutableList().also { it.removeAt(index) }
                                        }
                                    ) {
                                        Icon(Icons.Default.Close, "Remove")
                                    }
                                }
                            }

                            OutlinedTextField(
                                value = item.partName,
                                onValueChange = { newValue ->
                                    items = items.toMutableList().also {
                                        it[index] = it[index].copy(partName = newValue)
                                    }
                                },
                                label = { Text("Part Name") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            OutlinedTextField(
                                value = item.quantity,
                                onValueChange = { newValue ->
                                    items = items.toMutableList().also {
                                        it[index] = it[index].copy(quantity = newValue.filter { c -> c.isDigit() })
                                    }
                                },
                                label = { Text("Quantity") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                            )
                        }
                    }
                }

                item {
                    OutlinedButton(
                        onClick = { items = items + RequestItemInput() },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Add, null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Add Item")
                    }
                }

                item {
                    OutlinedTextField(
                        value = notes,
                        onValueChange = { notes = it },
                        label = { Text("Notes (optional)") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                        maxLines = 4
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                    val validItems = items.filter {
                        it.partName.isNotBlank() && it.quantity.isNotBlank()
                    }.map {
                        RequestItem(it.partName, it.quantity.toInt())
                    }
                    if (validItems.isNotEmpty()) {
                        isSaving = true
                        viewModel.createRequest(
                            requestedBy = "current_user", // TODO: Get from auth
                            items = validItems,
                            notes = notes.ifBlank { null }
                        )
                        navController.popBackStack()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = items.any { it.partName.isNotBlank() && it.quantity.isNotBlank() } && !isSaving
            ) {
                Text("Submit Request")
            }
        }
    }
}
