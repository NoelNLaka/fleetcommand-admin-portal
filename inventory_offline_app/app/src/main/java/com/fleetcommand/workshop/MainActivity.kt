package com.fleetcommand.workshop

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.fleetcommand.workshop.data.repository.DeviceConfigRepository
import com.fleetcommand.workshop.server.KtorServerService
import com.fleetcommand.workshop.sync.SyncManager
import com.fleetcommand.workshop.ui.navigation.NavGraph
import com.fleetcommand.workshop.ui.theme.WorkshopInventoryTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var deviceConfigRepository: DeviceConfigRepository

    @Inject
    lateinit var syncManager: SyncManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            WorkshopInventoryTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    val config by deviceConfigRepository.getConfig().collectAsState(initial = null)
                    val isDeviceSetup = config != null
                    val scope = rememberCoroutineScope()

                    // Handle server and sync based on setup state
                    LaunchedEffect(isDeviceSetup) {
                        if (isDeviceSetup) {
                            startKtorServer()
                            syncManager.schedulePeriodicSync()
                        } else {
                            stopKtorServer()
                            syncManager.cancelSync()
                        }
                    }

                    // Show navigation
                    NavGraph(
                        navController = navController,
                        isDeviceSetup = isDeviceSetup,
                        onSetupComplete = {
                            scope.launch {
                                // Handled by config flow observer above
                            }
                        }
                    )
                }
            }
        }
    }

    private fun startKtorServer() {
        val serviceIntent = Intent(this, KtorServerService::class.java)
        startForegroundService(serviceIntent)
    }

    private fun stopKtorServer() {
        val serviceIntent = Intent(this, KtorServerService::class.java)
        stopService(serviceIntent)
    }

    override fun onDestroy() {
        // Server will continue running as a foreground service
        super.onDestroy()
    }
}
