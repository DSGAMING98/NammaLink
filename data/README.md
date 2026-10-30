# Committed demonstration data

`demo-network.json` is a bounded derivative of the community BMTC GTFS feed published by [Vonter](https://github.com/Vonter/bmtc-gtfs). It contains only routes `8931`, `2704`, and `8950`, their 53 trips, 216 referenced stops, and 1,343 stop-time records. The source snapshot is version `20260907`, valid from 7 September 2026 through 7 September 2027.

The source and this derivative are made available under the [Open Data Commons Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/), with underlying BMTC rights noted by the upstream publisher. The fixture is generated reproducibly with:

```powershell
$env:BMTC_GTFS_DIR = '..\bmtc'
npm run data:build
```

This is an unofficial static schedule fixture. It is not a live feed, does not establish that a service operated on a particular day, and must not be used as evidence of current vehicle location or punctuality.

`bmtc-stops.json` is a compact 9,960-record search index from the same feed. It contains only stop ID, name, latitude, and longitude plus provenance; it is generated reproducibly with:

```powershell
$env:BMTC_GTFS_DIR = '..\bmtc'
npm run data:build-stops
```

The stop search index enables real feed-supported place selection but does not imply that every pair is routable by the current bounded schedule engine.

`bmtc-connections.bin.gz` and `bmtc-connections.meta.json` are the full-feed schedule-routing index. The build converts adjacent GTFS stop times into time-sorted binary connection records, rejects physically implausible records, and gzip-compresses the result:

```powershell
npm run data:build-connections
```

The current snapshot contains 1,477,697 admitted connections and records the 5,153 rejected source connections in metadata. It is static schedule data, not realtime evidence.
