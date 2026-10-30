package `in`.nammalink.app

import android.Manifest
import android.content.Context
import android.os.Bundle
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.time.LocalDate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private val Ink = Color(0xFF12211B)
private val Paper = Color(0xFFF5F4EC)
private val Green = Color(0xFF156B52)
private val Mint = Color(0xFFD9EFE4)
private val Amber = Color(0xFFFFC857)
private val Coral = Color(0xFFD95D39)
private val Muted = Color(0xFF617068)
private val PurpleLine = Color(0xFF8C2877)
private val YellowLine = Color(0xFFD6A900)
private val LocationBlue = Color(0xFF2F6FED)

private data class RouteSupply(val route: String, val agency: String, val trips: Int, val color: Color)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { NammaLinkApp() }
    }
}

@Composable
private fun NammaLinkApp() {
    val context = LocalContext.current
    val journeyPreferences = remember(context) { context.getSharedPreferences("journeys", Context.MODE_PRIVATE) }
    val restoredJourney = remember { decodeStoredJourney(journeyPreferences.getString("saved_network_journey", null)) }
    var tab by rememberSaveable { mutableIntStateOf(0) }
    var saved by rememberSaveable { mutableStateOf(restoredJourney != null) }
    var networkJourney by remember { mutableStateOf(restoredJourney) }
    var restoredOffline by remember { mutableStateOf(restoredJourney != null) }
    var deviceLocation by remember { mutableStateOf<DeviceLocation?>(null) }

    MaterialTheme {
        Scaffold(
            containerColor = Paper,
            bottomBar = {
                NavigationBar(containerColor = Color.White) {
                    listOf("Plan", "Journey", "Operator").forEachIndexed { index, label ->
                        NavigationBarItem(
                            selected = tab == index,
                            onClick = { tab = index },
                            icon = { Text(listOf("⌖", "⇢", "▥")[index], fontSize = 20.sp) },
                            label = { Text(label) }
                        )
                    }
                }
            }
        ) { padding ->
            Box(Modifier.padding(padding).fillMaxSize()) {
                key(tab) {
                    when (tab) {
                        0 -> PlannerScreen(
                            onPlan = { journey -> networkJourney = journey; saved = false; restoredOffline = false; tab = 1 },
                            onOfflineDemo = { networkJourney = null; saved = journeyPreferences.getBoolean("demo_saved", false); restoredOffline = false; tab = 1 },
                            onLocationUpdated = { deviceLocation = it },
                        )
                        1 -> JourneyScreen(
                            networkJourney = networkJourney,
                            deviceLocation = deviceLocation,
                            saved = saved,
                            restoredOffline = restoredOffline,
                            onSave = {
                                if (networkJourney != null) {
                                    if (saved) journeyPreferences.edit().remove("saved_network_journey").apply()
                                    else journeyPreferences.edit().putString("saved_network_journey", networkJourney!!.encodeForStorage()).apply()
                                } else {
                                    journeyPreferences.edit().putBoolean("demo_saved", !saved).apply()
                                }
                                saved = !saved
                            }
                        )
                        else -> OperatorScreen()
                    }
                }
            }
        }
    }
}

@Composable
private fun ScreenHeader(kicker: String, title: String, subtitle: String) {
    Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 18.dp)) {
        Text(kicker.uppercase(), color = Green, fontWeight = FontWeight.Bold, fontSize = 12.sp, letterSpacing = 1.sp)
        Text(title, color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 30.sp, lineHeight = 34.sp)
        Spacer(Modifier.height(6.dp))
        Text(subtitle, color = Muted, fontSize = 14.sp, lineHeight = 20.sp)
    }
}

@Composable
private fun PlannerScreen(onPlan: (NetworkJourney) -> Unit, onOfflineDemo: () -> Unit, onLocationUpdated: (DeviceLocation) -> Unit) {
    var from by rememberSaveable { mutableStateOf("Kempegowda Bus Station") }
    var to by rememberSaveable { mutableStateOf("Central Silk Board") }
    var timeMode by rememberSaveable { mutableStateOf("Depart after") }
    var requestedTime by rememberSaveable { mutableStateOf("08:00") }
    var ranking by rememberSaveable { mutableStateOf("Safest") }
    var maxWalk by rememberSaveable { mutableStateOf("800 m") }
    var origin by remember { mutableStateOf(StopOption("20921", "Kempegowda Bus Station", 12.98, 77.57)) }
    var destination by remember { mutableStateOf(StopOption("20707", "Central Silk Board", 12.92, 77.62)) }
    var suggestions by remember { mutableStateOf(emptyList<StopOption>()) }
    var nearby by remember { mutableStateOf(emptyList<StopOption>()) }
    var currentFix by remember { mutableStateOf<DeviceLocation?>(null) }
    var activeField by rememberSaveable { mutableStateOf("") }
    var planning by remember { mutableStateOf(false) }
    var locating by remember { mutableStateOf(false) }
    var locationRequestNonce by remember { mutableIntStateOf(0) }
    var locationStatus by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { grants ->
        if (grants.values.any { it }) locationRequestNonce += 1
        else locationStatus = "Location permission was not granted. You can still search for any stop manually."
    }

    val activeQuery = if (activeField == "from") from else to
    LaunchedEffect(activeField, activeQuery) {
        if (activeField.isBlank() || activeQuery.length < 2) { suggestions = emptyList(); return@LaunchedEffect }
        delay(300)
        suggestions = runCatching { withContext(Dispatchers.IO) { searchNetworkStops(activeQuery) } }.getOrElse { emptyList() }
    }

    LaunchedEffect(locationRequestNonce) {
        if (locationRequestNonce == 0) return@LaunchedEffect
        locating = true
        nearby = emptyList()
        runCatching {
            val fix = getCurrentDeviceLocation(context)
            val stops = withContext(Dispatchers.IO) { findNearbyNetworkStops(fix.latitude, fix.longitude) }
            fix to stops
        }.onSuccess { (fix, stops) ->
            onLocationUpdated(fix)
            currentFix = fix
            nearby = stops
            locationStatus = if (stops.isEmpty()) {
                "Location found (±${fix.accuracyMeters.toInt()} m), but no indexed stop is within 5 km. Search manually instead."
            } else {
                "Location found (±${fix.accuracyMeters.toInt()} m). Choose a nearby verified stop as your origin."
            }
        }.onFailure { locationStatus = it.message ?: "Current location is unavailable." }
        locating = false
    }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        ScreenHeader("Bengaluru public transport", "Arrive with confidence.", "A journey contract that plans for your deadline—not just the shortest path.")
        Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            StatusPill("● 10,043 searchable bus + Metro stops · static schedule", Green)
            OutlinedTextField(from, { from = it; origin = origin.copy(id = "", distanceMeters = null); activeField = "from" }, label = { Text("From") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            if (activeField == "from") StopSuggestions(suggestions) { origin = it; from = it.name; activeField = "" }
            OutlinedButton(
                onClick = {
                    locationStatus = null
                    if (hasLocationPermission(context)) locationRequestNonce += 1
                    else permissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
                },
                enabled = !locating,
                modifier = Modifier.fillMaxWidth().semantics { contentDescription = "Find nearby boarding stops" },
            ) { Text(if (locating) "Finding your location…" else "⌖ Find nearby boarding stops") }
            locationStatus?.let { Text(it, color = if (nearby.isEmpty()) Muted else Green, fontWeight = FontWeight.Bold, fontSize = 12.sp) }
            if (nearby.isNotEmpty()) {
                Text("Nearby boarding stops", color = Ink, fontWeight = FontWeight.ExtraBold)
                StopSuggestions(nearby) { origin = it; from = it.name; nearby = emptyList(); locationStatus = "Origin selected from your nearby stops." }
            }
            OutlinedTextField(to, { to = it; destination = destination.copy(id = ""); activeField = "to" }, label = { Text("To") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            if (activeField == "to") StopSuggestions(suggestions) { destination = it; to = it.name; activeField = "" }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("Depart after", "Arrive by").forEach { choice ->
                    FilterChip(selected = timeMode == choice, onClick = { timeMode = choice }, label = { Text(choice) })
                }
            }
            OutlinedTextField(requestedTime, { requestedTime = it }, label = { Text("$timeMode (HH:MM)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            Text("Priority", fontWeight = FontWeight.Bold, color = Ink)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("Safest", "Fastest", "Direct").forEach { choice ->
                    FilterChip(selected = ranking == choice, onClick = { ranking = choice }, label = { Text(choice) })
                }
            }
            Text("Maximum walking", fontWeight = FontWeight.Bold, color = Ink)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("400 m", "800 m", "1.5 km").forEach { choice ->
                    FilterChip(selected = maxWalk == choice, onClick = { maxWalk = choice }, label = { Text(choice) })
                }
            }
            Button(
                onClick = {
                    if (origin.id.isBlank() || destination.id.isBlank()) { error = "Select both stops from the verified suggestions."; return@Button }
                    planning = true; error = null
                    scope.launch {
                        val maximumWalkingMeters = when (maxWalk) { "400 m" -> 400; "800 m" -> 800; else -> 1_500 }
                        val priorityValue = ranking.lowercase()
                        val timeModeValue = if (timeMode == "Arrive by") "arriveBy" else "departAfter"
                        val accessLocation = currentFix.takeIf { origin.distanceMeters != null }
                        runCatching { withContext(Dispatchers.IO) { planNetworkJourney(origin, destination, LocalDate.now().toString(), timeModeValue, requestedTime, priorityValue, maximumWalkingMeters, accessLocation) } }
                            .onSuccess(onPlan)
                            .onFailure { error = it.message ?: "Network journey unavailable." }
                        planning = false
                    }
                },
                enabled = !planning,
                modifier = Modifier.fillMaxWidth().height(54.dp).semantics { contentDescription = "Plan journey" },
                colors = ButtonDefaults.buttonColors(containerColor = Green),
                shape = RoundedCornerShape(14.dp)
            ) { Text(if (planning) "Scanning the schedule…" else "Plan across bus + Metro", fontWeight = FontWeight.Bold) }
            error?.let { Text(it, color = Coral, fontWeight = FontWeight.Bold, fontSize = 13.sp) }
            OutlinedButton(onClick = onOfflineDemo, modifier = Modifier.fillMaxWidth()) { Text("Open bounded offline demonstration") }
            Text("Safest applies a three-minute interchange buffer, Fastest removes that extra buffer, and Direct permits one transit ride. The selected transfer-walking budget is enforced by the city-scale scan. The offline demonstration remains available explicitly.", color = Muted, fontSize = 12.sp)
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun StopSuggestions(stops: List<StopOption>, onSelect: (StopOption) -> Unit) {
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        stops.forEach { stop ->
            Card(Modifier.fillMaxWidth().clickable { onSelect(stop) }, colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(Modifier.padding(12.dp)) {
                    Text(stop.name, fontWeight = FontWeight.Bold, color = Ink)
                    val distance = stop.distanceMeters?.let { " · ${it} m away" } ?: ""
                    Text("${stop.agency} ${stop.mode} stop ${stop.id.removePrefix("metro:")}$distance", color = Muted, fontSize = 11.sp)
                }
            }
        }
    }
}

@Composable
private fun JourneyScreen(networkJourney: NetworkJourney?, deviceLocation: DeviceLocation?, saved: Boolean, restoredOffline: Boolean, onSave: () -> Unit) {
    var disrupted by rememberSaveable { mutableStateOf(false) }
    if (networkJourney != null) {
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            ScreenHeader("Full-network schedule", "Arrive at ${networkJourney.arrival}.", "Depart ${networkJourney.departure} · ${networkJourney.transfers} transfer${if (networkJourney.transfers == 1) "" else "s"} · static BMTC + BMRCL feeds")
            Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                StatusPill("${networkJourney.priority.replaceFirstChar { it.uppercase() }} contract · ${networkJourney.walkingMeters}/${networkJourney.maximumWalkingMeters} m walk · ${if (restoredOffline) "restored offline" else "${networkJourney.queryMilliseconds.toInt()} ms"}", Green)
                if (networkJourney.timeMode == "arriveBy") {
                    StatusPill("Deadline ${networkJourney.requestedTime} met · latest start ${networkJourney.latestStart}", Green)
                }
                RouteMap(false, networkJourney.origin, networkJourney.destination, networkJourney.rides, deviceLocation)
                networkJourney.rides.forEach { ride ->
                    ItineraryCard(
                        ride.departure,
                        when (ride.mode) { "metro" -> "Take Metro ${ride.route}"; "walk" -> "Walk ${ride.distanceMeters} m"; else -> "Take bus ${ride.route}" },
                        if (ride.mode == "walk") "${ride.from} → ${ride.to} · estimated transfer walk" else "${ride.from} → ${ride.to} · toward ${ride.headsign}",
                        if (ride.mode == "walk") "${ride.arrival} arrival" else "${ride.stopCount} stops",
                        when (ride.mode) { "walk" -> Amber; "metro" -> PurpleLine; else -> Green },
                    )
                }
                OutlinedButton(onClick = onSave, modifier = Modifier.fillMaxWidth()) { Text(if (saved) "Saved ✓" else "Save offline") }
                Text(if (restoredOffline) "Saved schedule snapshot restored locally. Replan online before travel to check for a newer schedule." else "Schedule-only result. It does not use live vehicle positions, observed delay, or a trained prediction model.", color = Muted, fontSize = 12.sp)
                Spacer(Modifier.height(16.dp))
            }
        }
        return
    }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        ScreenHeader("Journey contract", if (disrupted) "Recovery is ready." else "You can make 09:35.", if (disrupted) "Your completed leg is preserved; only the remaining journey changed." else "Scheduled arrival 09:18 · 17-minute safety margin")
        Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            StatusPill(if (disrupted) "Deadline at risk · arrive 09:42" else "Verified against static GTFS schedule", if (disrupted) Coral else Green)
            RouteMap(disrupted, "Majestic", "Silk Board")
            ItineraryCard("08:20", "Majestic", "Walk 240 m to Kempegowda Bus Station", "6 min", Green)
            ItineraryCard("08:28", if (disrupted) "Take route 500-D" else "Take route 365", if (disrupted) "Board from platform 12 · recovery option" else "Kempegowda Bus Station → Corporation", "24 min", if (disrupted) Coral else Green)
            ItineraryCard("08:55", "Transfer at Corporation", "8-minute protected connection · platform evidence unavailable", "8 min", Amber)
            ItineraryCard("09:03", "Take route 356-M", "Corporation → Silk Board", "15 min", Green)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(onClick = onSave, modifier = Modifier.weight(1f)) { Text(if (saved) "Saved ✓" else "Save offline") }
                OutlinedButton(onClick = { disrupted = !disrupted }, modifier = Modifier.weight(1f)) { Text(if (disrupted) "Clear demo" else "Simulate disruption") }
            }
            Text("Demonstration incident data is explicitly simulated. It never masquerades as a live authority alert.", color = Muted, fontSize = 12.sp)
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun RouteMap(disrupted: Boolean, origin: String, destination: String, rides: List<NetworkRide> = emptyList(), deviceLocation: DeviceLocation? = null) {
    val geographicRides = rides.filter { ride ->
        ride.fromLat.isFinite() && ride.fromLon.isFinite() && ride.toLat.isFinite() && ride.toLon.isFinite()
    }
    val currentLocationVisible = if (geographicRides.isNotEmpty() && deviceLocation != null) {
        val latitudes = geographicRides.flatMap { listOf(it.fromLat, it.toLat) }
        val longitudes = geographicRides.flatMap { listOf(it.fromLon, it.toLon) }
        val latitudeMargin = (latitudes.max() - latitudes.min()).coerceAtLeast(.0001) * .2
        val longitudeMargin = (longitudes.max() - longitudes.min()).coerceAtLeast(.0001) * .2
        deviceLocation.latitude in (latitudes.min() - latitudeMargin)..(latitudes.max() + latitudeMargin)
            && deviceLocation.longitude in (longitudes.min() - longitudeMargin)..(longitudes.max() + longitudeMargin)
    } else false
    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFE8E5D8)), shape = RoundedCornerShape(18.dp)) {
        Column {
            Box(Modifier.fillMaxWidth().height(if (geographicRides.isEmpty()) 190.dp else 220.dp).padding(20.dp)) {
                Canvas(Modifier.fillMaxSize()) {
                if (geographicRides.isNotEmpty()) {
                    val latitudes = geographicRides.flatMap { listOf(it.fromLat, it.toLat) }
                    val longitudes = geographicRides.flatMap { listOf(it.fromLon, it.toLon) }
                    val minLat = latitudes.min(); val maxLat = latitudes.max()
                    val minLon = longitudes.min(); val maxLon = longitudes.max()
                    val latRange = (maxLat - minLat).coerceAtLeast(.0001)
                    val lonRange = (maxLon - minLon).coerceAtLeast(.0001)
                    val left = 18f; val right = size.width - 18f; val top = 72f; val bottom = size.height - 82f
                    fun point(lat: Double, lon: Double) = Offset(
                        left + (((lon - minLon) / lonRange).toFloat() * (right - left)),
                        bottom - (((lat - minLat) / latRange).toFloat() * (bottom - top)),
                    )
                    (1..3).forEach { step ->
                        val fraction = step / 4f
                        drawLine(Muted.copy(alpha = .14f), Offset(left, top + (bottom - top) * fraction), Offset(right, top + (bottom - top) * fraction), strokeWidth = 2f)
                        drawLine(Muted.copy(alpha = .14f), Offset(left + (right - left) * fraction, top), Offset(left + (right - left) * fraction, bottom), strokeWidth = 2f)
                    }
                    geographicRides.forEach { ride ->
                        val color = when (ride.mode) { "metro" -> PurpleLine; "walk" -> Amber; else -> Green }
                        val start = point(ride.fromLat, ride.fromLon); val end = point(ride.toLat, ride.toLon)
                        drawLine(color, start, end, strokeWidth = if (ride.mode == "walk") 8f else 12f, cap = StrokeCap.Round)
                        drawCircle(Paper, 9f, start); drawCircle(color, 9f, start, style = Stroke(4f))
                        drawCircle(Paper, 9f, end); drawCircle(color, 9f, end, style = Stroke(4f))
                    }
                    val visibleFix = deviceLocation?.takeIf { currentLocationVisible }
                    visibleFix?.let { fix ->
                        val marker = point(fix.latitude, fix.longitude)
                        val accuracyRadius = (fix.accuracyMeters * ((bottom - top) / (latRange * 111_320))).toFloat().coerceIn(10f, 34f)
                        drawCircle(LocationBlue.copy(alpha = .18f), accuracyRadius, marker)
                        drawCircle(Paper, 12f, marker)
                        drawCircle(LocationBlue, 10f, marker)
                        drawCircle(Color.White, 3.5f, marker)
                    }
                } else {
                    val y = size.height * .52f
                    drawLine(Green, Offset(20f, y), Offset(size.width - 20f, y), strokeWidth = 14f, cap = StrokeCap.Round)
                    drawLine(if (disrupted) Coral else Amber, Offset(size.width * .48f, y), Offset(size.width * .72f, y), strokeWidth = 14f, cap = StrokeCap.Round)
                    listOf(.08f, .48f, .72f, .92f).forEach { x ->
                        drawCircle(Paper, 13f, Offset(size.width * x, y))
                        drawCircle(Ink, 13f, Offset(size.width * x, y), style = Stroke(5f))
                    }
                }
                }
                Text(origin.take(18), Modifier.align(Alignment.BottomStart), color = Ink, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                Text(destination.take(18), Modifier.align(Alignment.BottomEnd), color = Ink, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                Text(
                    when { geographicRides.isNotEmpty() -> "Geographic fallback · straight stop-to-stop estimates"; disrupted -> "Schematic · recovery path"; else -> "Native schematic · map key not required" },
                    Modifier.align(Alignment.TopStart).semantics { contentDescription = if (geographicRides.isNotEmpty()) "Geographic route fallback using real stop coordinates and straight estimated segments" else "Route schematic" },
                    color = Muted,
                    fontSize = 12.sp,
                )
            }
            if (geographicRides.isNotEmpty()) {
                Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    LegendItem("Bus", Green)
                    LegendItem("Metro", PurpleLine)
                    LegendItem("Walk", Amber)
                    if (currentLocationVisible) LegendItem("You", LocationBlue)
                }
                deviceLocation?.let {
                    Text(
                        if (currentLocationVisible) "Current fix ±${it.accuracyMeters.toInt()} m · session only" else "Current fix is outside this route view · session only",
                        Modifier.padding(horizontal = 20.dp, vertical = 10.dp),
                        color = Muted,
                        fontSize = 11.sp,
                    )
                } ?: Spacer(Modifier.height(14.dp))
            }
        }
    }
}

@Composable
private fun LegendItem(label: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
        Box(Modifier.size(9.dp).background(color, CircleShape))
        Text(label, color = Muted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ItineraryCard(time: String, title: String, detail: String, duration: String, accent: Color) {
    Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(16.dp)) {
        Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.Top) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(time, color = Ink, fontWeight = FontWeight.ExtraBold)
                Spacer(Modifier.height(8.dp))
                Box(Modifier.size(12.dp).background(accent, CircleShape))
            }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(title, color = Ink, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(detail, color = Muted, fontSize = 13.sp, lineHeight = 18.sp)
            }
            Text(duration, color = Green, fontWeight = FontWeight.Bold, fontSize = 12.sp)
        }
    }
}

@Composable
private fun OperatorScreen() {
    val routeSupply = listOf(
        RouteSupply("Purple", "BMRCL", 1_265, PurpleLine),
        RouteSupply("Green", "BMRCL", 1_149, Green),
        RouteSupply("Yellow", "BMRCL", 865, YellowLine),
        RouteSupply("375-D", "BMTC", 398, Green),
        RouteSupply("401-M", "BMTC", 328, Green),
        RouteSupply("378", "BMTC", 318, Green),
        RouteSupply("410-FA", "BMTC", 316, Green),
        RouteSupply("226-N", "BMTC", 310, Green),
    )
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        ScreenHeader("Operator intelligence", "City-scale schedule supply.", "Full BMTC + BMRCL static-feed evidence—not live fleet performance.")
        Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricCard("61,115", "scheduled trips", Modifier.weight(1f))
                MetricCard("10,043", "searchable stops", Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricCard("4,419", "route records", Modifier.weight(1f))
                MetricCard("1,563,324", "connections", Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricCard("670", "transfer footpaths", Modifier.weight(1f))
                MetricCard("5,153", "connections filtered", Modifier.weight(1f))
            }
            Card(colors = CardDefaults.cardColors(containerColor = Mint), shape = RoundedCornerShape(16.dp)) {
                Column(Modifier.padding(16.dp)) {
                    Text("0 trained ML models · evidence gate", fontWeight = FontWeight.ExtraBold, color = Ink, fontSize = 18.sp)
                    Text("No labelled historical arrival data has been validated, so no delay model or fabricated evaluation chart is shown. Schedule baselines remain the honest reference.", color = Muted, lineHeight = 20.sp)
                }
            }
            Text("Top routes by scheduled trip count", color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
            routeSupply.forEach { route -> SupplyBar(route, routeSupply.first().trips) }
            Text("BMTC 20260907 + BMRCL 20260817 community GTFS · bars show scheduled trip counts only. They are not ridership, punctuality, occupancy, revenue, or actual utilization.", color = Muted, fontSize = 12.sp, lineHeight = 18.sp)
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun MetricCard(value: String, label: String, modifier: Modifier = Modifier) {
    Card(modifier, colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(16.dp)) {
            Text(value, color = Green, fontWeight = FontWeight.ExtraBold, fontSize = if (value.length > 7) 20.sp else 28.sp)
            Text(label, color = Muted, fontSize = 12.sp)
        }
    }
}

@Composable
private fun SupplyBar(route: RouteSupply, maximumTrips: Int) {
    val value = route.trips.toFloat() / maximumTrips
    Column {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column {
                Text(route.route, color = Ink, fontWeight = FontWeight.Bold)
                Text(route.agency, color = Muted, fontSize = 11.sp)
            }
            Text("${route.trips} trips", color = Muted, fontSize = 12.sp)
        }
        Spacer(Modifier.height(6.dp))
        Box(Modifier.fillMaxWidth().height(12.dp).background(Color(0xFFDEDCD2), RoundedCornerShape(8.dp))) {
            Box(Modifier.fillMaxWidth(value).height(12.dp).background(route.color, RoundedCornerShape(8.dp)))
        }
    }
}

@Composable
private fun StatusPill(text: String, color: Color) {
    Box(Modifier.border(1.dp, color.copy(alpha = .35f), RoundedCornerShape(20.dp)).background(color.copy(alpha = .09f), RoundedCornerShape(20.dp)).padding(horizontal = 12.dp, vertical = 8.dp)) {
        Text(text, color = color, fontWeight = FontWeight.Bold, fontSize = 12.sp)
    }
}
