package com.fleetcommand.workshop.ui.screens.inventory

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.fleetcommand.workshop.ui.components.WorkshopTopBar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddPartScreen(
    navController: NavController,
    viewModel: InventoryViewModel = hiltViewModel()
) {
    var name by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var unit by remember { mutableStateOf("pcs") }
    var minStock by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }

    val unitOptions = listOf("pcs", "liters", "kg", "meters", "sets", "pairs")

    Scaffold(
        topBar = {
            WorkshopTopBar(
                title = "Add New Part",
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
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Part Name") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            OutlinedTextField(
                value = category,
                onValueChange = { category = it },
                label = { Text("Category") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                placeholder = { Text("e.g., Brakes, Engine, Electrical") }
            )

            // Unit Dropdown
            var expanded by remember { mutableStateOf(false) }
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = !expanded }
            ) {
                OutlinedTextField(
                    value = unit,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Unit") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(),
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) }
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    unitOptions.forEach { option ->
                        DropdownMenuItem(
                            text = { Text(option) },
                            onClick = {
                                unit = option
                                expanded = false
                            }
                        )
                    }
                }
            }

            OutlinedTextField(
                value = minStock,
                onValueChange = { minStock = it.filter { c -> c.isDigit() } },
                label = { Text("Minimum Stock Level") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true
            )

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = {
                    if (name.isNotBlank() && category.isNotBlank()) {
                        isSaving = true
                        viewModel.addPart(
                            name = name,
                            category = category,
                            unit = unit,
                            minStock = minStock.toIntOrNull() ?: 0
                        )
                        navController.popBackStack()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = name.isNotBlank() && category.isNotBlank() && !isSaving
            ) {
                Text("Add Part")
            }
        }
    }
}
