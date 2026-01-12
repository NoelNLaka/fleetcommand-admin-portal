package com.fleetcommand.workshop.ui.navigation

sealed class NavRoutes(val route: String) {
    // Setup
    object Setup : NavRoutes("setup")
    object QrScanner : NavRoutes("qr_scanner")

    // Main
    object Dashboard : NavRoutes("dashboard")

    // Inventory
    object Inventory : NavRoutes("inventory")
    object InventoryDetail : NavRoutes("inventory/{partId}") {
        fun createRoute(partId: String) = "inventory/$partId"
    }
    object AddMovement : NavRoutes("inventory/movement/{partId}") {
        fun createRoute(partId: String) = "inventory/movement/$partId"
    }
    object AddPart : NavRoutes("inventory/add_part")

    // Maintenance
    object Maintenance : NavRoutes("maintenance")
    object MaintenanceDetail : NavRoutes("maintenance/{id}") {
        fun createRoute(id: String) = "maintenance/$id"
    }
    object StartMaintenance : NavRoutes("maintenance/start")

    // Requests
    object Requests : NavRoutes("requests")
    object RequestDetail : NavRoutes("requests/{id}") {
        fun createRoute(id: String) = "requests/$id"
    }
    object CreateRequest : NavRoutes("requests/create")

    // Receipts
    object Receipts : NavRoutes("receipts")
    object AddReceipt : NavRoutes("receipts/add")
    object ReceiptDetail : NavRoutes("receipts/{id}") {
        fun createRoute(id: String) = "receipts/$id"
    }

    // Shift
    object ShiftReport : NavRoutes("shift_report")
}
