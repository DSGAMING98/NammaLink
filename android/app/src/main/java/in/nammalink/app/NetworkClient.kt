package `in`.nammalink.app

import java.net.HttpURLConnection
import java.net.URI
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import org.json.JSONArray
import org.json.JSONObject

data class StopOption(val id: String, val name: String, val lat: Double, val lon: Double, val agency: String = "BMTC", val mode: String = "bus", val distanceMeters: Int? = null)
data class NetworkRide(
    val route: String, val agency: String, val mode: String, val headsign: String,
    val from: String, val to: String, val departure: String, val arrival: String,
    val stopCount: Int, val distanceMeters: Int,
    val fromLat: Double = Double.NaN, val fromLon: Double = Double.NaN,
    val toLat: Double = Double.NaN, val toLon: Double = Double.NaN,
)
data class NetworkJourney(val origin: String, val destination: String, val departure: String, val arrival: String, val transfers: Int, val walkingMeters: Int, val timeMode: String, val requestedTime: String, val latestStart: String, val deadlineMet: Boolean, val priority: String, val maximumWalkingMeters: Int, val rides: List<NetworkRide>, val queryMilliseconds: Double, val durationMinutes: Int = 0, val scheduledWaitingMinutes: Int = 0, val recommendationTitle: String = "Schedule recommendation", val recommendationReasons: List<String> = emptyList())

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

fun NetworkJourney.encodeForStorage(): String = JSONObject().apply {
    put("version", 3)
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
    if (json.getInt("version") !in 1..3) error("Unsupported saved journey")
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
    )
}.getOrNull()

private fun request(path: String): JSONObject {
    val connection = URI.create("${BuildConfig.API_BASE_URL}$path").toURL().openConnection() as HttpURLConnection
    connection.connectTimeout = 4_000
    connection.readTimeout = 8_000
    connection.requestMethod = "GET"
    connection.setRequestProperty("Accept", "application/json")
    return connection.run {
        try {
            val stream = if (responseCode in 200..299) inputStream else errorStream
            val body = stream.bufferedReader().use { it.readText() }
            if (responseCode !in 200..299) error(JSONObject(body).optString("error", "Request failed ($responseCode)"))
            JSONObject(body)
        } finally {
            disconnect()
        }
    }
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

fun planNetworkJourney(origin: StopOption, destination: StopOption, serviceDate: String, timeMode: String, requestedTime: String, priority: String, maximumWalkingMeters: Int, accessLocation: DeviceLocation? = null): NetworkJourney {
    val encodedOrigin = URLEncoder.encode(origin.id, StandardCharsets.UTF_8)
    val encodedDestination = URLEncoder.encode(destination.id, StandardCharsets.UTF_8)
    val encodedTime = URLEncoder.encode(requestedTime, StandardCharsets.UTF_8)
    val timeParameter = if (timeMode == "arriveBy") "arriveBy" else "departAfter"
    val accessParameters = accessLocation?.let { "&accessLat=${it.latitude}&accessLon=${it.longitude}" } ?: ""
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
