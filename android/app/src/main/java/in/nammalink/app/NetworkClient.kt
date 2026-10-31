package `in`.nammalink.app

import java.net.HttpURLConnection
import java.net.SocketTimeoutException
import java.net.URI
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import org.json.JSONArray
import org.json.JSONObject

data class StopOption(
    val id: String,
    val name: String,
    val lat: Double,
    val lon: Double,
    val agency: String = "BMTC",
    val mode: String = "bus",
    val distanceMeters: Int? = null,
    val accessLatitude: Double? = null,
    val accessLongitude: Double? = null,
    val placeLabel: String? = null,
)
data class MapPoint(val latitude: Double, val longitude: Double)
data class PlaceResult(val placeId: String, val text: String, val location: MapPoint)
data class WalkingRoute(val distanceMeters: Int, val durationSeconds: Int, val geometry: List<MapPoint>)
data class NetworkRide(
    val route: String, val agency: String, val mode: String, val headsign: String,
    val from: String, val to: String, val departure: String, val arrival: String,
    val stopCount: Int, val distanceMeters: Int,
    val fromLat: Double = Double.NaN, val fromLon: Double = Double.NaN,
    val toLat: Double = Double.NaN, val toLon: Double = Double.NaN,
)
data class ContractAlternative(val priority: String, val departure: String, val arrival: String, val durationMinutes: Int, val scheduledWaitingMinutes: Int, val transfers: Int, val walkingMeters: Int, val journey: NetworkJourney? = null)
data class NetworkJourney(val origin: String, val destination: String, val departure: String, val arrival: String, val transfers: Int, val walkingMeters: Int, val timeMode: String, val requestedTime: String, val latestStart: String, val deadlineMet: Boolean, val priority: String, val maximumWalkingMeters: Int, val rides: List<NetworkRide>, val queryMilliseconds: Double, val durationMinutes: Int = 0, val scheduledWaitingMinutes: Int = 0, val recommendationTitle: String = "Schedule recommendation", val recommendationReasons: List<String> = emptyList(), val alternatives: List<ContractAlternative> = emptyList())

enum class NetworkFailure { CONFIGURATION, OFFLINE, TIMEOUT, SERVER, RESPONSE }
class NammaLinkNetworkException(val failure: NetworkFailure, message: String, val requestId: String? = null) : Exception(message)
data class BackendHealth(
    val service: String,
    val version: String,
    val revision: String,
    val stopSearch: Boolean,
    val scheduleRouting: Boolean,
    val geocoding: Boolean,
    val walkingRoutes: Boolean,
    val autocomplete: Boolean,
)
data class AirportStop(val id: String, val name: String, val lat: Double, val lon: Double, val departure: String)
data class AirportDeparture(val departure: String, val waitMinutes: Int)
data class AirportRoute(
    val id: String, val route: String, val longName: String, val direction: String,
    val origin: AirportStop, val destination: AirportStop, val stops: List<AirportStop>,
    val upcoming: List<AirportDeparture>, val proximityMeters: Int?, val minimumFare: Int?, val maximumFare: Int?,
)

fun AirportRoute.encodeForStorage(savedAt: Long = System.currentTimeMillis()): String = JSONObject().apply {
    put("version", 1); put("savedAt", savedAt); put("id", id); put("route", route); put("longName", longName); put("direction", direction)
    fun encodeStop(stop: AirportStop) = JSONObject().apply {
        put("id", stop.id); put("name", stop.name); put("lat", stop.lat); put("lon", stop.lon); put("departure", stop.departure)
    }
    put("origin", encodeStop(origin)); put("destination", encodeStop(destination))
    put("stops", JSONArray().apply { stops.forEach { put(encodeStop(it)) } })
    put("upcoming", JSONArray().apply { upcoming.forEach { put(JSONObject().put("departure", it.departure).put("waitMinutes", it.waitMinutes)) } })
    proximityMeters?.let { put("proximityMeters", it) }
    minimumFare?.let { put("minimumFare", it) }; maximumFare?.let { put("maximumFare", it) }
}.toString()

data class SavedAirportRoute(val route: AirportRoute, val savedAt: Long)

fun decodeStoredAirportRoute(value: String?): SavedAirportRoute? = runCatching {
    val json = JSONObject(value ?: error("Missing airport route"))
    if (json.getInt("version") != 1) error("Unsupported airport snapshot")
    fun stop(item: JSONObject) = AirportStop(item.getString("id"), item.getString("name"), item.getDouble("lat"), item.getDouble("lon"), item.optString("departure"))
    val stops = json.getJSONArray("stops").let { values -> List(values.length()) { stop(values.getJSONObject(it)) } }
    val upcoming = json.getJSONArray("upcoming").let { values -> List(values.length()) { index ->
        values.getJSONObject(index).let { AirportDeparture(it.getString("departure"), it.getInt("waitMinutes")) }
    } }
    SavedAirportRoute(
        AirportRoute(
            json.getString("id"), json.getString("route"), json.getString("longName"), json.getString("direction"),
            stop(json.getJSONObject("origin")), stop(json.getJSONObject("destination")), stops, upcoming,
            if (json.has("proximityMeters")) json.getInt("proximityMeters") else null,
            if (json.has("minimumFare")) json.getInt("minimumFare") else null,
            if (json.has("maximumFare")) json.getInt("maximumFare") else null,
        ),
        json.getLong("savedAt"),
    )
}.getOrNull()

fun Throwable.userMessage(): String = when (this) {
    is NammaLinkNetworkException -> message.orEmpty() + (requestId?.let { " (reference $it)" } ?: "")
    else -> message ?: "NammaLink could not complete the request."
}

private fun serviceMinute(value: String): Int? {
    val parts = value.split(":")
    return if (parts.size == 2) parts[0].toIntOrNull()?.let { hour -> parts[1].toIntOrNull()?.let { minute -> hour * 60 + minute } } else null
}

private fun deriveWaitingMinutes(rides: List<NetworkRide>, timeMode: String, requestedTime: String, latestStart: String): Int {
    var cursor = serviceMinute(if (timeMode == "departAfter") requestedTime else latestStart) ?: return 0
    return rides.sumOf { ride ->
        val departure = serviceMinute(ride.departure) ?: cursor
        val waiting = (departure - cursor).coerceAtLeast(0)
        cursor = serviceMinute(ride.arrival) ?: departure
        waiting
    }
}

private fun fallbackRecommendation(priority: String, walkingMeters: Int, maximumWalkingMeters: Int): Pair<String, List<String>> = when (priority) {
    "safest" -> "Protected-transfer recommendation" to listOf("Every vehicle change reserves at least 3 minutes.", "$walkingMeters m total walking stays within the $maximumWalkingMeters m limit.")
    "direct" -> "Direct-only recommendation" to listOf("The search excludes journeys that require changing vehicles.", "$walkingMeters m total walking stays within the $maximumWalkingMeters m limit.")
    else -> "Earliest-arrival recommendation" to listOf("Selected from the indexed static timetable under the fastest contract.", "$walkingMeters m total walking stays within the $maximumWalkingMeters m limit.")
}

fun NetworkJourney.waitBeforeRideMinutes(index: Int): Int {
    if (index !in rides.indices) return 0
    val previousTime = if (index == 0) {
        if (timeMode == "departAfter") requestedTime else latestStart
    } else rides[index - 1].arrival
    return ((serviceMinute(rides[index].departure) ?: 0) - (serviceMinute(previousTime) ?: 0)).coerceAtLeast(0)
}

fun NetworkJourney.encodeForStorage(): String = JSONObject().apply {
    put("version", 5)
    put("origin", origin)
    put("destination", destination)
    put("departure", departure)
    put("arrival", arrival)
    put("transfers", transfers)
    put("walkingMeters", walkingMeters)
    put("timeMode", timeMode)
    put("requestedTime", requestedTime)
    put("latestStart", latestStart)
    put("deadlineMet", deadlineMet)
    put("priority", priority)
    put("maximumWalkingMeters", maximumWalkingMeters)
    put("queryMilliseconds", queryMilliseconds)
    put("durationMinutes", durationMinutes)
    put("scheduledWaitingMinutes", scheduledWaitingMinutes)
    put("recommendationTitle", recommendationTitle)
    put("recommendationReasons", JSONArray(recommendationReasons))
    put("alternatives", JSONArray().apply {
        alternatives.forEach { alternative ->
            put(JSONObject().apply {
                put("priority", alternative.priority); put("departure", alternative.departure); put("arrival", alternative.arrival)
                put("durationMinutes", alternative.durationMinutes); put("scheduledWaitingMinutes", alternative.scheduledWaitingMinutes)
                put("transfers", alternative.transfers); put("walkingMeters", alternative.walkingMeters)
                alternative.journey?.let { put("journey", JSONObject(it.copy(alternatives = emptyList()).encodeForStorage())) }
            })
        }
    })
    put("rides", JSONArray().apply {
        rides.forEach { ride ->
            put(JSONObject().apply {
                put("route", ride.route); put("agency", ride.agency); put("mode", ride.mode); put("headsign", ride.headsign)
                put("from", ride.from); put("to", ride.to); put("departure", ride.departure); put("arrival", ride.arrival)
                put("stopCount", ride.stopCount); put("distanceMeters", ride.distanceMeters)
                put("fromLat", ride.fromLat.takeIf { it.isFinite() } ?: JSONObject.NULL)
                put("fromLon", ride.fromLon.takeIf { it.isFinite() } ?: JSONObject.NULL)
                put("toLat", ride.toLat.takeIf { it.isFinite() } ?: JSONObject.NULL)
                put("toLon", ride.toLon.takeIf { it.isFinite() } ?: JSONObject.NULL)
            })
        }
    })
}.toString()

fun decodeStoredJourney(value: String?): NetworkJourney? = runCatching {
    val json = JSONObject(value ?: error("Missing journey"))
    if (json.getInt("version") !in 1..5) error("Unsupported saved journey")
    val ridesJson = json.getJSONArray("rides")
    val rides = List(ridesJson.length()) { index ->
        val ride = ridesJson.getJSONObject(index)
        NetworkRide(
            route = ride.getString("route"), agency = ride.getString("agency"), mode = ride.getString("mode"), headsign = ride.getString("headsign"),
            from = ride.getString("from"), to = ride.getString("to"), departure = ride.getString("departure"), arrival = ride.getString("arrival"),
            stopCount = ride.getInt("stopCount"), distanceMeters = ride.getInt("distanceMeters"),
            fromLat = ride.optDouble("fromLat", Double.NaN), fromLon = ride.optDouble("fromLon", Double.NaN),
            toLat = ride.optDouble("toLat", Double.NaN), toLon = ride.optDouble("toLon", Double.NaN),
        )
    }
    val priority = json.getString("priority")
    val walkingMeters = json.getInt("walkingMeters")
    val maximumWalkingMeters = json.getInt("maximumWalkingMeters")
    val fallbackRecommendation = fallbackRecommendation(priority, walkingMeters, maximumWalkingMeters)
    val departure = json.getString("departure")
    val arrival = json.getString("arrival")
    val timeMode = json.getString("timeMode")
    val requestedTime = json.getString("requestedTime")
    val latestStart = json.getString("latestStart")
    NetworkJourney(
        origin = json.getString("origin"), destination = json.getString("destination"), departure = departure, arrival = arrival,
        transfers = json.getInt("transfers"), walkingMeters = walkingMeters, timeMode = timeMode, requestedTime = requestedTime,
        latestStart = latestStart, deadlineMet = json.getBoolean("deadlineMet"), priority = priority, maximumWalkingMeters = maximumWalkingMeters,
        rides = rides,
        queryMilliseconds = json.getDouble("queryMilliseconds"),
        durationMinutes = json.optInt("durationMinutes", ((serviceMinute(arrival) ?: 0) - (serviceMinute(departure) ?: 0)).coerceAtLeast(0)),
        scheduledWaitingMinutes = json.optInt("scheduledWaitingMinutes", deriveWaitingMinutes(rides, timeMode, requestedTime, latestStart)),
        recommendationTitle = json.optString("recommendationTitle", fallbackRecommendation.first),
        recommendationReasons = json.optJSONArray("recommendationReasons")?.let { reasons -> List(reasons.length()) { reasons.getString(it) } } ?: fallbackRecommendation.second,
        alternatives = json.optJSONArray("alternatives")?.let { alternatives -> List(alternatives.length()) { index ->
            alternatives.getJSONObject(index).let { alternative -> ContractAlternative(
                priority = alternative.getString("priority"), departure = alternative.getString("departure"), arrival = alternative.getString("arrival"),
                durationMinutes = alternative.getInt("durationMinutes"), scheduledWaitingMinutes = alternative.getInt("scheduledWaitingMinutes"),
                transfers = alternative.getInt("transfers"), walkingMeters = alternative.getInt("walkingMeters"),
                journey = alternative.optJSONObject("journey")?.let { decodeStoredJourney(it.toString()) },
            ) }
        } } ?: emptyList(),
    )
}.getOrNull()

private fun request(path: String, method: String = "GET", payload: JSONObject? = null): JSONObject {
    val baseUri = runCatching { URI.create(BuildConfig.API_BASE_URL) }.getOrElse {
        throw NammaLinkNetworkException(NetworkFailure.CONFIGURATION, "The app backend address is invalid.")
    }
    if (BuildConfig.IS_PRESENTATION_BUILD && (baseUri.scheme != "https" || baseUri.host in setOf("localhost", "127.0.0.1", "10.0.2.2"))) {
        throw NammaLinkNetworkException(NetworkFailure.CONFIGURATION, "This build is not connected to a public HTTPS service.")
    }
    val connection = baseUri.resolve(path).toURL().openConnection() as HttpURLConnection
    connection.connectTimeout = 4_000
    connection.readTimeout = 8_000
    connection.requestMethod = method
    connection.setRequestProperty("Accept", "application/json")
    if (payload != null) {
        connection.doOutput = true
        connection.setRequestProperty("Content-Type", "application/json")
        connection.outputStream.bufferedWriter(StandardCharsets.UTF_8).use { it.write(payload.toString()) }
    }
    return connection.run {
        try {
            val stream = if (responseCode in 200..299) inputStream else errorStream
            val body = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            if (responseCode !in 200..299) {
                val json = runCatching { JSONObject(body) }.getOrNull()
                val errorObject = json?.optJSONObject("error")
                val message = errorObject?.optString("message")?.takeIf { it.isNotBlank() }
                    ?: json?.optString("error")?.takeIf { it.isNotBlank() }
                    ?: "NammaLink service returned HTTP $responseCode."
                throw NammaLinkNetworkException(NetworkFailure.SERVER, message, headerFields["X-Request-Id"]?.firstOrNull())
            }
            if (body.isBlank()) throw NammaLinkNetworkException(NetworkFailure.RESPONSE, "The service returned an empty response.")
            JSONObject(body)
        } catch (error: SocketTimeoutException) {
            throw NammaLinkNetworkException(NetworkFailure.TIMEOUT, "The service took too long to respond. Check your connection and retry.")
        } catch (error: NammaLinkNetworkException) {
            throw error
        } catch (error: java.io.IOException) {
            throw NammaLinkNetworkException(NetworkFailure.OFFLINE, "Cannot reach NammaLink. Check internet access and retry.")
        } catch (error: org.json.JSONException) {
            throw NammaLinkNetworkException(NetworkFailure.RESPONSE, "The service returned an unreadable response.")
        } finally {
            disconnect()
        }
    }
}

fun checkBackendHealth(): BackendHealth {
    val response = request("/api/health")
    if (response.optString("status") != "ok") throw NammaLinkNetworkException(NetworkFailure.SERVER, "NammaLink is not ready yet.")
    val capabilities = response.optJSONObject("capabilities") ?: JSONObject()
    return BackendHealth(
        response.optString("service", "nammalink-api"), response.optString("version", "unknown"), response.optString("revision", "unknown"),
        capabilities.optBoolean("stopSearch"), capabilities.optBoolean("scheduleRouting"), capabilities.optBoolean("geocoding"),
        capabilities.optBoolean("walkingRoutes"), capabilities.optBoolean("autocomplete"),
    )
}

fun searchNetworkStops(query: String): List<StopOption> {
    if (query.trim().length < 2) return emptyList()
    val encoded = URLEncoder.encode(query.trim(), StandardCharsets.UTF_8)
    val array = request("/api/stops?q=$encoded&limit=5").getJSONArray("stops")
    return List(array.length()) { index ->
        val stop = array.getJSONObject(index)
        StopOption(stop.getString("id"), stop.getString("name"), stop.getDouble("lat"), stop.getDouble("lon"), stop.optString("agency", "BMTC"), stop.optString("mode", "bus"))
    }
}

fun findNearbyNetworkStops(latitude: Double, longitude: Double): List<StopOption> {
    val array = request("/api/stops?lat=$latitude&lon=$longitude&radiusMeters=5000&limit=8").getJSONArray("stops")
    return List(array.length()) { index ->
        val stop = array.getJSONObject(index)
        StopOption(
            stop.getString("id"), stop.getString("name"), stop.getDouble("lat"), stop.getDouble("lon"),
            stop.optString("agency", "BMTC"), stop.optString("mode", "bus"), stop.optInt("distanceMeters"),
        )
    }
}

fun geocodePassengerPlace(query: String): List<PlaceResult> {
    if (query.trim().length < 2) return emptyList()
    val encoded = URLEncoder.encode(query.trim(), StandardCharsets.UTF_8)
    val results = request("/api/maps/geocode?q=$encoded").getJSONArray("results")
    return List(results.length()) { index ->
        val item = results.getJSONObject(index)
        val location = item.getJSONObject("location")
        PlaceResult(item.optString("placeId"), item.getString("text"), MapPoint(location.getDouble("latitude"), location.getDouble("longitude")))
    }
}

fun resolvePassengerPlace(placeId: String): PlaceResult? {
    if (placeId.isBlank()) return null
    val encoded = URLEncoder.encode(placeId, StandardCharsets.UTF_8)
    val place = request("/api/maps/place?placeId=$encoded").optJSONObject("place") ?: return null
    val location = place.getJSONObject("location")
    return PlaceResult(place.optString("placeId", placeId), place.getString("text"), MapPoint(location.getDouble("latitude"), location.getDouble("longitude")))
}

fun searchPassengerLocations(query: String): List<StopOption> {
    val stops = searchNetworkStops(query)
    if (stops.size >= 3) return stops
    val places = runCatching { geocodePassengerPlace(query) }.getOrDefault(emptyList()).take(2).map { place ->
        runCatching { resolvePassengerPlace(place.placeId) }.getOrNull() ?: place
    }
    val placeStops = places.flatMap { place ->
        findNearbyNetworkStops(place.location.latitude, place.location.longitude).take(2).map { stop ->
            stop.copy(
                accessLatitude = place.location.latitude,
                accessLongitude = place.location.longitude,
                placeLabel = place.text,
            )
        }
    }
    return (stops + placeStops).distinctBy { it.id }.take(6)
}

fun decodeGooglePolyline(encoded: String): List<MapPoint> {
    val points = mutableListOf<MapPoint>()
    var index = 0
    var latitude = 0
    var longitude = 0
    while (index < encoded.length) {
        fun component(): Int {
            var result = 0
            var shift = 0
            var value: Int
            do {
                if (index >= encoded.length) throw IllegalArgumentException("Truncated encoded polyline")
                value = encoded[index++].code - 63
                result = result or ((value and 0x1f) shl shift)
                shift += 5
            } while (value >= 0x20)
            return if (result and 1 != 0) (result shr 1).inv() else result shr 1
        }
        latitude += component()
        longitude += component()
        points += MapPoint(latitude / 100000.0, longitude / 100000.0)
    }
    return points
}

fun fetchWalkingRoute(origin: MapPoint, destination: MapPoint): WalkingRoute? {
    val payload = JSONObject().apply {
        put("origin", JSONObject().put("latitude", origin.latitude).put("longitude", origin.longitude))
        put("destination", JSONObject().put("latitude", destination.latitude).put("longitude", destination.longitude))
    }
    val routes = request("/api/maps/walking-route", "POST", payload).getJSONArray("routes")
    if (routes.length() == 0) return null
    val route = routes.getJSONObject(0)
    return WalkingRoute(
        route.optInt("distanceMeters"),
        route.optString("duration", "0s").removeSuffix("s").toDoubleOrNull()?.toInt() ?: 0,
        decodeGooglePolyline(route.optString("encodedPolyline")),
    )
}

fun searchAirportRoutes(mode: String, serviceDate: String, after: String, query: String = "", location: DeviceLocation? = null): List<AirportRoute> {
    val encodedQuery = URLEncoder.encode(query.trim(), StandardCharsets.UTF_8)
    val locationParameters = location?.let { "&lat=${it.latitude}&lon=${it.longitude}" } ?: ""
    val response = request("/api/airport?mode=$mode&date=$serviceDate&after=${URLEncoder.encode(after, StandardCharsets.UTF_8)}&q=$encodedQuery$locationParameters")
    val array = response.getJSONArray("routes")
    fun stop(json: JSONObject) = AirportStop(json.getString("id"), json.getString("name"), json.getDouble("lat"), json.getDouble("lon"), json.optString("departure"))
    return List(array.length()) { index ->
        val route = array.getJSONObject(index)
        val stops = route.getJSONArray("stops").let { values -> List(values.length()) { stop(values.getJSONObject(it)) } }
        val upcoming = route.getJSONArray("upcoming").let { values -> List(values.length()) { item -> values.getJSONObject(item).let { AirportDeparture(it.getString("departure"), it.getInt("waitMinutes")) } } }
        val fare = route.optJSONObject("fareRange")
        AirportRoute(
            id = route.getString("id"), route = route.getString("route"), longName = route.getString("longName"), direction = route.getString("direction"),
            origin = stop(route.getJSONObject("origin")), destination = stop(route.getJSONObject("destination")), stops = stops, upcoming = upcoming,
            proximityMeters = if (route.isNull("proximityMeters")) null else route.getInt("proximityMeters"),
            minimumFare = fare?.optInt("minimum"), maximumFare = fare?.optInt("maximum"),
        )
    }
}

private fun planSingleNetworkJourney(origin: StopOption, destination: StopOption, serviceDate: String, timeMode: String, requestedTime: String, priority: String, maximumWalkingMeters: Int, accessLocation: DeviceLocation? = null): NetworkJourney {
    val encodedOrigin = URLEncoder.encode(origin.id, StandardCharsets.UTF_8)
    val encodedDestination = URLEncoder.encode(destination.id, StandardCharsets.UTF_8)
    val encodedTime = URLEncoder.encode(requestedTime, StandardCharsets.UTF_8)
    val timeParameter = if (timeMode == "arriveBy") "arriveBy" else "departAfter"
    val selectedAccess = accessLocation ?: origin.accessLatitude?.let { latitude -> origin.accessLongitude?.let { longitude -> DeviceLocation(latitude, longitude, 0f) } }
    val accessParameters = selectedAccess?.let { "&accessLat=${it.latitude}&accessLon=${it.longitude}" } ?: ""
    val path = "/api/network-journeys?origin=$encodedOrigin&destination=$encodedDestination&date=$serviceDate&$timeParameter=$encodedTime&priority=$priority&maxWalkingMeters=$maximumWalkingMeters$accessParameters"
    val response = request(path)
    val journey = response.optJSONObject("journey") ?: error(response.optString("evidence", "No scheduled path found for these stops and time."))
    val contract = journey.getJSONObject("contract")
    val recommendation = journey.getJSONObject("recommendation")
    val ridesJson = journey.getJSONArray("rides")
    val transitRides = List(ridesJson.length()) { index ->
        val ride = ridesJson.getJSONObject(index)
        val fromStop = ride.getJSONObject("from")
        val toStop = ride.getJSONObject("to")
        NetworkRide(
            route = ride.getString("route"),
            agency = ride.optString("agency", "BMTC"),
            mode = ride.optString("mode", "bus"),
            headsign = ride.optString("headsign"),
            from = fromStop.getString("name"),
            to = toStop.getString("name"),
            departure = ride.getString("departure"),
            arrival = ride.getString("arrival"),
            stopCount = ride.getInt("stopCount"),
            distanceMeters = ride.optInt("distanceMeters", 0),
            fromLat = fromStop.getDouble("lat"),
            fromLon = fromStop.getDouble("lon"),
            toLat = toStop.getDouble("lat"),
            toLon = toStop.getDouble("lon"),
        )
    }
    val access = journey.optJSONObject("access")?.let { walk ->
        val fromStop = walk.getJSONObject("from")
        val toStop = walk.getJSONObject("to")
        NetworkRide(
            route = "Walk", agency = "NammaLink", mode = "walk", headsign = "",
            from = fromStop.getString("name"), to = toStop.getString("name"),
            departure = walk.getString("departure"), arrival = walk.getString("arrival"),
            stopCount = 0, distanceMeters = walk.getInt("distanceMeters"),
            fromLat = fromStop.getDouble("lat"), fromLon = fromStop.getDouble("lon"),
            toLat = toStop.getDouble("lat"), toLon = toStop.getDouble("lon"),
        )
    }
    val rides = listOfNotNull(access) + transitRides
    return NetworkJourney(
        origin = access?.from ?: journey.getJSONObject("origin").getString("name"),
        destination = journey.getJSONObject("destination").getString("name"),
        departure = journey.getString("departure"),
        arrival = journey.getString("arrival"),
        transfers = journey.getInt("transfers"),
        walkingMeters = journey.optInt("walkingMeters", 0),
        timeMode = contract.getString("timeMode"),
        requestedTime = contract.getString("requestedTime"),
        latestStart = contract.optString("latestStart", journey.getString("departure")),
        deadlineMet = contract.optBoolean("deadlineMet", false),
        priority = contract.getString("priority"),
        maximumWalkingMeters = contract.getInt("maximumWalkingMeters"),
        rides = rides,
        queryMilliseconds = response.getDouble("queryMilliseconds"),
        durationMinutes = (journey.getInt("durationSeconds") + 59) / 60,
        scheduledWaitingMinutes = (journey.getInt("scheduledWaitingSeconds") + 59) / 60,
        recommendationTitle = recommendation.getString("title"),
        recommendationReasons = recommendation.getJSONArray("reasons").let { reasons -> List(reasons.length()) { reasons.getString(it) } },
    )
}

fun planNetworkJourney(origin: StopOption, destination: StopOption, serviceDate: String, timeMode: String, requestedTime: String, priority: String, maximumWalkingMeters: Int, accessLocation: DeviceLocation? = null): NetworkJourney {
    val selected = planSingleNetworkJourney(origin, destination, serviceDate, timeMode, requestedTime, priority, maximumWalkingMeters, accessLocation)
    val journeysByPriority = buildMap {
        put(priority, selected)
        listOf("safest", "fastest", "direct").filterNot { it == priority }.forEach { candidate ->
            runCatching { planSingleNetworkJourney(origin, destination, serviceDate, timeMode, requestedTime, candidate, maximumWalkingMeters, accessLocation) }
                .getOrNull()?.let { put(candidate, it) }
        }
    }
    val alternatives = listOf("safest", "fastest", "direct").mapNotNull { candidate -> journeysByPriority[candidate]?.let { journey ->
        ContractAlternative(candidate, if (journey.timeMode == "departAfter") journey.requestedTime else journey.latestStart, journey.arrival, journey.durationMinutes, journey.scheduledWaitingMinutes, journey.transfers, journey.walkingMeters, journey.copy(alternatives = emptyList()))
    } }
    return selected.copy(alternatives = alternatives)
}
