package `in`.nammalink.app

import java.net.HttpURLConnection
import java.net.URI
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import org.json.JSONObject

data class StopOption(val id: String, val name: String, val lat: Double, val lon: Double, val agency: String = "BMTC", val mode: String = "bus")
data class NetworkRide(val route: String, val agency: String, val mode: String, val headsign: String, val from: String, val to: String, val departure: String, val arrival: String, val stopCount: Int, val distanceMeters: Int)
data class NetworkJourney(val origin: String, val destination: String, val departure: String, val arrival: String, val transfers: Int, val walkingMeters: Int, val timeMode: String, val requestedTime: String, val latestStart: String, val deadlineMet: Boolean, val priority: String, val maximumWalkingMeters: Int, val rides: List<NetworkRide>, val queryMilliseconds: Double)

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

fun planNetworkJourney(origin: StopOption, destination: StopOption, serviceDate: String, timeMode: String, requestedTime: String, priority: String, maximumWalkingMeters: Int): NetworkJourney {
    val encodedOrigin = URLEncoder.encode(origin.id, StandardCharsets.UTF_8)
    val encodedDestination = URLEncoder.encode(destination.id, StandardCharsets.UTF_8)
    val encodedTime = URLEncoder.encode(requestedTime, StandardCharsets.UTF_8)
    val timeParameter = if (timeMode == "arriveBy") "arriveBy" else "departAfter"
    val path = "/api/network-journeys?origin=$encodedOrigin&destination=$encodedDestination&date=$serviceDate&$timeParameter=$encodedTime&priority=$priority&maxWalkingMeters=$maximumWalkingMeters"
    val response = request(path)
    val journey = response.optJSONObject("journey") ?: error("No scheduled path found for these stops and time.")
    val contract = journey.getJSONObject("contract")
    val ridesJson = journey.getJSONArray("rides")
    val rides = List(ridesJson.length()) { index ->
        val ride = ridesJson.getJSONObject(index)
        NetworkRide(
            route = ride.getString("route"),
            agency = ride.optString("agency", "BMTC"),
            mode = ride.optString("mode", "bus"),
            headsign = ride.optString("headsign"),
            from = ride.getJSONObject("from").getString("name"),
            to = ride.getJSONObject("to").getString("name"),
            departure = ride.getString("departure"),
            arrival = ride.getString("arrival"),
            stopCount = ride.getInt("stopCount"),
            distanceMeters = ride.optInt("distanceMeters", 0),
        )
    }
    return NetworkJourney(
        origin = journey.getJSONObject("origin").getString("name"),
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
    )
}
