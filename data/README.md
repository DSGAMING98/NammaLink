# Reference network data

`demo-network.json` is a bounded derivative of the community BMTC GTFS feed published by [Vonter](https://github.com/Vonter/bmtc-gtfs). It contains only routes `8931`, `2704`, and `8950`, their 53 trips, 216 referenced stops, and 1,343 stop-time records. The source snapshot is version `20260907`, valid from 7 September 2026 through 7 September 2027.

The source and this derivative are made available under the [Open Data Commons Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/), with underlying BMTC rights noted by the upstream publisher. The fixture is generated reproducibly with:

```powershell
$env:BMTC_GTFS_DIR = '..\bmtc'
npm run data:build
```

This is an unofficial static schedule fixture. It is not a live feed, does not establish that a service operated on a particular day, and must not be used as evidence of current vehicle location or punctuality.

`transit-stops.json` is a compact multimodal index containing 9,960 searchable BMTC stops, 83 searchable BMRCL stations, and 170 internal Metro platform nodes. It retains agency, mode, coordinates, station/platform relationships, and feed provenance. It is generated reproducibly with:

```powershell
$env:BMTC_GTFS_DIR = '..\bmtc'
$env:BMRCL_GTFS_DIR = '..\bmrcl'
npm run data:build-stops
```

The stop search index enables real feed-supported selection. Internal platform nodes are excluded from suggestions while station endpoints expand to their valid platforms.

`transit-connections.bin.gz` and `transit-connections.meta.json` are the full-feed bus + Metro routing index. The build converts adjacent GTFS stop times into time-sorted binary connections, records service calendars/exceptions, adds nearby bus–Metro walking links, rejects physically implausible records, and gzip-compresses the binary table:

```powershell
npm run data:build-connections
```

The current snapshot contains 61,115 trips, 1,563,324 admitted connections, and 670 directed transfer footpaths. Metadata records the 5,153 rejected source connections and the 250 m/1.25 m·s⁻¹ straight-line walking policy. It is static schedule data, not realtime evidence.
