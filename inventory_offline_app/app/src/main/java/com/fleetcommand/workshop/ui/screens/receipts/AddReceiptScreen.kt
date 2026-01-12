package com.fleetcommand.workshop.ui.screens.receipts

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
fun AddReceiptScreen(
    navController: NavController,
    viewModel: ReceiptsViewModel = hiltViewModel()
) {
    var supplier by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var invoiceNumber by remember { mutableStateOf("") }
    var isPaid by remember { mutableStateOf(true) }
    var isSaving by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            WorkshopTopBar(
                title = "Add COD Receipt",
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
                value = supplier,
                onValueChange = { supplier = it },
                label = { Text("Supplier Name") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            OutlinedTextField(
                value = amount,
                onValueChange = { amount = it.filter { c -> c.isDigit() || c == '.' } },
                label = { Text("Amount") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                prefix = { Text("$") }
            )

            OutlinedTextField(
                value = invoiceNumber,
                onValueChange = { invoiceNumber = it },
                label = { Text("Invoice Number (optional)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Payment Received",
                    style = MaterialTheme.typography.bodyLarge
                )
                Switch(
                    checked = isPaid,
                    onCheckedChange = { isPaid = it }
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = {
                    val amountValue = amount.toDoubleOrNull()
                    if (supplier.isNotBlank() && amountValue != null && amountValue > 0) {
                        isSaving = true
                        viewModel.addReceipt(
                            supplier = supplier,
                            amount = amountValue,
                            invoiceNumber = invoiceNumber.ifBlank { null },
                            paid = isPaid
                        )
                        navController.popBackStack()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = supplier.isNotBlank() && amount.toDoubleOrNull() != null && !isSaving
            ) {
                Text("Save Receipt")
            }
        }
    }
}
