package `in`.nammalink.app

import android.graphics.Color as AndroidColor
import android.graphics.drawable.GradientDrawable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.OnlineTileSourceBase
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.BoundingBox
import org.osmdroid.util.GeoPoint
import org.osmdroid.util.MapTileIndex
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polyline

private val SatelliteTiles = object : OnlineTileSourceBase(
    "Esri World Imagery", 0, 19, 256, ".jpg",
    arrayOf("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/"),
    "Tiles © Esri",
) {
    override fun getTileURLString(index: Long): String =
        baseUrl + MapTileIndex.getZoom(index) + "/" + MapTileIndex.getY(index) + "/" + MapTileIndex.getX(index) + mImageFilenameEnding
}

@Composable
fun InteractiveRouteMap(
    origin: String,
    destination: String,
    rides: List<NetworkRide>,
    deviceLocation: DeviceLocation?,
    mapHeight: Dp = 330.dp,
    showDescription: Boolean = true,
    showControls: Boolean = true,
    showExpandButton: Boolean = true,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var satellite by remember { mutableStateOf(false) }
    var recenterNonce by remember { mutableIntStateOf(0) }
    var mapView by remember { mutableStateOf<MapView?>(null) }
    var fullScreen by remember { mutableStateOf(false) }
    val rendered = remember { mutableMapOf<String, String>() }
    val walkingGeometry = remember { mutableStateMapOf<Int, WalkingRoute>() }
    val geographicRides = rides.filter { it.fromLat.isFinite() && it.fromLon.isFinite() && it.toLat.isFinite() && it.toLon.isFinite() }

    LaunchedEffect(rides) {
        walkingGeometry.clear()
        rides.forEachIndexed { index, ride ->
            if (ride.mode == "walk" && ride.fromLat.isFinite() && ride.toLat.isFinite()) {
                runCatching { withContext(Dispatchers.IO) { fetchWalkingRoute(MapPoint(ride.fromLat, ride.fromLon), MapPoint(ride.toLat, ride.toLon)) } }
                    .getOrNull()?.let { walkingGeometry[index] = it }
            }
        }
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> mapView?.onResume()
                Lifecycle.Event.ON_PAUSE -> mapView?.onPause()
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column {
            AndroidView(
                    modifier = Modifier.fillMaxWidth().height(mapHeight),
                    factory = { viewContext ->
                        Configuration.getInstance().apply {
                            load(viewContext, viewContext.getSharedPreferences("osmdroid", android.content.Context.MODE_PRIVATE))
                            userAgentValue = "NammaLink/0.1 (native Android passenger app)"
                        }
                        MapView(viewContext).apply {
                            setMultiTouchControls(true); minZoomLevel = 4.0; maxZoomLevel = 20.0
                            controller.setZoom(13.0); controller.setCenter(GeoPoint(12.9716, 77.5946)); mapView = this
                        }
                    },
                    update = { view ->
                        val tileMode = if (satellite) "satellite" else "street"
                        if (rendered["tiles"] != tileMode) {
                            view.setTileSource(if (satellite) SatelliteTiles else TileSourceFactory.MAPNIK)
                            rendered["tiles"] = tileMode
                        }
                        val routeSignature = buildString {
                            rides.forEach { append(it.mode).append(it.fromLat).append(it.fromLon).append(it.toLat).append(it.toLon) }
                            walkingGeometry.forEach { (index, route) -> append(index).append(route.geometry.size) }
                            deviceLocation?.let { append(it.latitude).append(it.longitude) }
                        }
                        if (rendered["route"] == routeSignature) return@AndroidView
                        view.overlays.clear()
                        val points = mutableListOf<GeoPoint>()
                        geographicRides.forEachIndexed { visibleIndex, ride ->
                            val verifiedWalk = walkingGeometry[rides.indexOf(ride)]
                            val segment = verifiedWalk?.geometry?.takeIf { it.size > 1 }?.map { GeoPoint(it.latitude, it.longitude) }
                                ?: listOf(GeoPoint(ride.fromLat, ride.fromLon), GeoPoint(ride.toLat, ride.toLon))
                            points += segment
                            view.overlays += Polyline(view).apply {
                                setPoints(segment)
                                outlinePaint.color = when (ride.mode) { "metro" -> AndroidColor.rgb(140, 40, 119); "walk" -> AndroidColor.rgb(214, 145, 0); else -> AndroidColor.rgb(21, 107, 82) }
                                outlinePaint.strokeWidth = if (ride.mode == "walk") 8f else 10f
                                title = if (verifiedWalk != null) "Verified walking route" else "Scheduled stop alignment"
                            }
                            if (visibleIndex == 0) view.overlays += Marker(view).apply {
                                position = segment.first(); title = origin; subDescription = "Origin"
                                icon = mapDot(AndroidColor.rgb(47, 111, 237)); setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                            }
                            if (visibleIndex == geographicRides.lastIndex) view.overlays += Marker(view).apply {
                                position = segment.last(); title = destination; subDescription = "Destination"
                                icon = mapDot(AndroidColor.rgb(21, 107, 82)); setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                            }
                        }
                        deviceLocation?.let { fix ->
                            val current = GeoPoint(fix.latitude, fix.longitude); points += current
                            view.overlays += Marker(view).apply {
                                position = current; title = "Current location"; subDescription = "Last fix ±${fix.accuracyMeters.toInt()} m"
                                icon = mapDot(AndroidColor.rgb(47, 111, 237), 34); setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                            }
                        }
                        if (points.size == 1) view.post { view.controller.setZoom(15.5); view.controller.animateTo(points.first()) }
                        else if (points.size > 1) view.post { runCatching { view.zoomToBoundingBox(BoundingBox.fromGeoPoints(points), true, 70) } }
                        rendered["route"] = routeSignature
                        view.invalidate()
                    },
            )
            if (showControls) {
                Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = !satellite, onClick = { satellite = false }, label = { Text("Street", fontSize = 12.sp) }, modifier = Modifier.weight(1f))
                    FilterChip(selected = satellite, onClick = { satellite = true }, label = { Text("Satellite", fontSize = 12.sp) }, modifier = Modifier.weight(1f))
                    OutlinedButton(onClick = { recenterNonce += 1 }, modifier = Modifier.weight(1f)) { Text("Recenter", fontSize = 12.sp) }
                }
            }
            if (showDescription) {
                Text("Interactive map · pan and pinch to zoom. Walking lines use the Routes API when available; transit lines connect verified scheduled stops and are not street-level vehicle traces.", Modifier.padding(12.dp), fontSize = 11.sp, color = Color(0xFF617068))
            }
            if (showExpandButton) {
                OutlinedButton(onClick = { fullScreen = true }, modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp)) {
                    Text("Expand map")
                }
            }
        }
    }
    if (fullScreen) {
        Dialog(onDismissRequest = { fullScreen = false }, properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false)) {
            Card(Modifier.fillMaxWidth().padding(10.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column {
                    OutlinedButton(onClick = { fullScreen = false }, modifier = Modifier.fillMaxWidth().padding(10.dp)) { Text("Close full-screen map") }
                    InteractiveRouteMap(origin, destination, rides, deviceLocation, mapHeight = 600.dp, showDescription = false, showControls = true, showExpandButton = false)
                }
            }
        }
    }
    LaunchedEffect(recenterNonce) {
        if (recenterNonce > 0) {
            val points = geographicRides.flatMap { listOf(GeoPoint(it.fromLat, it.fromLon), GeoPoint(it.toLat, it.toLon)) }
            if (points.isNotEmpty()) mapView?.zoomToBoundingBox(BoundingBox.fromGeoPoints(points), true, 70)
            else deviceLocation?.let { mapView?.controller?.animateTo(GeoPoint(it.latitude, it.longitude)) }
        }
    }
}

private fun mapDot(color: Int, size: Int = 42) = GradientDrawable().apply {
    shape = GradientDrawable.OVAL
    setColor(color)
    setStroke(5, AndroidColor.WHITE)
    setSize(size, size)
}
