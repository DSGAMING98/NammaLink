package `in`.nammalink.app

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.CancellationSignal
import android.os.Looper
import kotlin.coroutines.resume
import kotlinx.coroutines.suspendCancellableCoroutine

data class DeviceLocation(val latitude: Double, val longitude: Double, val accuracyMeters: Float)

fun hasLocationPermission(context: Context): Boolean =
    context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        || context.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

@Suppress("MissingPermission")
suspend fun getCurrentDeviceLocation(context: Context): DeviceLocation = suspendCancellableCoroutine { continuation ->
    check(hasLocationPermission(context)) { "Location permission is required." }
    val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    val providers = listOf(LocationManager.NETWORK_PROVIDER, LocationManager.GPS_PROVIDER)
        .filter { provider -> runCatching { manager.isProviderEnabled(provider) }.getOrDefault(false) }
    if (providers.isEmpty()) {
        continuation.resumeWith(Result.failure(IllegalStateException("Turn on device location, then try again.")))
        return@suspendCancellableCoroutine
    }
    val provider = providers.first()

    fun finish(location: Location?) {
        if (!continuation.isActive) return
        if (location == null) continuation.resumeWith(Result.failure(IllegalStateException("No location fix is available. Move outdoors or retry.")))
        else continuation.resume(DeviceLocation(location.latitude, location.longitude, location.accuracy))
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val cancellationSignal = CancellationSignal()
        continuation.invokeOnCancellation { cancellationSignal.cancel() }
        manager.getCurrentLocation(provider, cancellationSignal, context.mainExecutor, ::finish)
    } else {
        val listener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                manager.removeUpdates(this)
                finish(location)
            }
            override fun onProviderDisabled(provider: String) = Unit
            override fun onProviderEnabled(provider: String) = Unit
            @Deprecated("Deprecated in Android")
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) = Unit
        }
        continuation.invokeOnCancellation { manager.removeUpdates(listener) }
        manager.requestSingleUpdate(provider, listener, Looper.getMainLooper())
    }
}
