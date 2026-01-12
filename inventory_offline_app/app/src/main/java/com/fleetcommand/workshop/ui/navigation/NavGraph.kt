package com.fleetcommand.workshop.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.fleetcommand.workshop.ui.screens.dashboard.DashboardScreen
import com.fleetcommand.workshop.ui.screens.inventory.AddMovementScreen
import com.fleetcommand.workshop.ui.screens.inventory.AddPartScreen
import com.fleetcommand.workshop.ui.screens.inventory.InventoryDetailScreen
import com.fleetcommand.workshop.ui.screens.inventory.InventoryScreen
import com.fleetcommand.workshop.ui.screens.maintenance.MaintenanceDetailScreen
import com.fleetcommand.workshop.ui.screens.maintenance.MaintenanceScreen
import com.fleetcommand.workshop.ui.screens.maintenance.StartMaintenanceScreen
import com.fleetcommand.workshop.ui.screens.receipts.AddReceiptScreen
import com.fleetcommand.workshop.ui.screens.receipts.ReceiptsScreen
import com.fleetcommand.workshop.ui.screens.requests.CreateRequestScreen
import com.fleetcommand.workshop.ui.screens.requests.RequestsScreen
import com.fleetcommand.workshop.ui.screens.setup.QrScannerScreen
import com.fleetcommand.workshop.ui.screens.setup.SetupScreen
import com.fleetcommand.workshop.ui.screens.shift.ShiftReportScreen

@Composable
fun NavGraph(
    navController: NavHostController,
    isDeviceSetup: Boolean,
    onSetupComplete: () -> Unit
) {
    NavHost(
        navController = navController,
        startDestination = if (isDeviceSetup) NavRoutes.Dashboard.route else NavRoutes.Setup.route
    ) {
        // Setup Flow
        composable(NavRoutes.Setup.route) {
            SetupScreen(
                onScanQrCode = {
                    navController.navigate(NavRoutes.QrScanner.route)
                }
            )
        }

        composable(NavRoutes.QrScanner.route) {
            QrScannerScreen(
                onQrScanned = {
                    onSetupComplete()
                    navController.navigate(NavRoutes.Dashboard.route) {
                        popUpTo(NavRoutes.Setup.route) { inclusive = true }
                    }
                },
                onBack = {
                    navController.popBackStack()
                }
            )
        }

        // Dashboard
        composable(NavRoutes.Dashboard.route) {
            DashboardScreen(navController = navController)
        }

        // Inventory
        composable(NavRoutes.Inventory.route) {
            InventoryScreen(navController = navController)
        }

        composable(
            route = NavRoutes.InventoryDetail.route,
            arguments = listOf(navArgument("partId") { type = NavType.StringType })
        ) { backStackEntry ->
            val partId = backStackEntry.arguments?.getString("partId") ?: return@composable
            InventoryDetailScreen(
                partId = partId,
                navController = navController
            )
        }

        composable(
            route = NavRoutes.AddMovement.route,
            arguments = listOf(navArgument("partId") { type = NavType.StringType })
        ) { backStackEntry ->
            val partId = backStackEntry.arguments?.getString("partId") ?: return@composable
            AddMovementScreen(
                partId = partId,
                navController = navController
            )
        }

        composable(NavRoutes.AddPart.route) {
            AddPartScreen(navController = navController)
        }

        // Maintenance
        composable(NavRoutes.Maintenance.route) {
            MaintenanceScreen(navController = navController)
        }

        composable(
            route = NavRoutes.MaintenanceDetail.route,
            arguments = listOf(navArgument("id") { type = NavType.StringType })
        ) { backStackEntry ->
            val id = backStackEntry.arguments?.getString("id") ?: return@composable
            MaintenanceDetailScreen(
                maintenanceId = id,
                navController = navController
            )
        }

        composable(NavRoutes.StartMaintenance.route) {
            StartMaintenanceScreen(navController = navController)
        }

        // Requests
        composable(NavRoutes.Requests.route) {
            RequestsScreen(navController = navController)
        }

        composable(NavRoutes.CreateRequest.route) {
            CreateRequestScreen(navController = navController)
        }

        // Receipts
        composable(NavRoutes.Receipts.route) {
            ReceiptsScreen(navController = navController)
        }

        composable(NavRoutes.AddReceipt.route) {
            AddReceiptScreen(navController = navController)
        }

        // Shift Report
        composable(NavRoutes.ShiftReport.route) {
            ShiftReportScreen(navController = navController)
        }
    }
}
