package com.fleetcommand.workshop.server

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.fleetcommand.workshop.MainActivity
import com.fleetcommand.workshop.R
import com.fleetcommand.workshop.WorkshopApplication
import com.fleetcommand.workshop.data.local.AppDatabase
import com.fleetcommand.workshop.data.repository.DeviceConfigRepository
import dagger.hilt.android.AndroidEntryPoint
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class KtorServerService : Service() {

    @Inject
    lateinit var database: AppDatabase

    @Inject
    lateinit var deviceConfigRepository: DeviceConfigRepository

    private var server: NettyApplicationEngine? = null
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        startForeground(NOTIFICATION_ID, createNotification())
        startKtorServer()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onDestroy() {
        stopKtorServer()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startKtorServer() {
        serviceScope.launch {
            try {
                server = embeddedServer(Netty, port = SERVER_PORT, host = "0.0.0.0") {
                    configureServer(database, deviceConfigRepository)
                }.start(wait = false)

                android.util.Log.i(TAG, "Ktor server started on port $SERVER_PORT")
            } catch (e: Exception) {
                android.util.Log.e(TAG, "Failed to start Ktor server", e)
            }
        }
    }

    private fun stopKtorServer() {
        try {
            server?.stop(1000, 2000)
            android.util.Log.i(TAG, "Ktor server stopped")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error stopping Ktor server", e)
        }
    }

    private fun createNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, WorkshopApplication.CHANNEL_SERVER)
            .setContentTitle(getString(R.string.server_notification_title))
            .setContentText(getString(R.string.server_notification_text))
            .setSmallIcon(android.R.drawable.ic_menu_share)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    companion object {
        private const val TAG = "KtorServerService"
        const val NOTIFICATION_ID = 1001
        const val SERVER_PORT = 8080
    }
}
