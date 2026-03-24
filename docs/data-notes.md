# Data Notes

## Source

This project uses the USGS Earthquake Hazards Program GeoJSON feed:

- Feed name: `All Earthquakes, Past Month`
- Canonical URL: `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson`

The raw file fetched during this run is stored at `data/source/usgs-all-month.geojson`.

## What gets bundled

`npm run build:data` reads the raw GeoJSON and writes `data/earthquakes.json` with:

- source metadata
- a precomputed summary
- a simplified array of earthquake records with the fields used by the app

The frontend only needs the simplified file, which keeps client logic straightforward and avoids repeating transformation work in the browser.

## Normalization choices

- Records missing magnitude, depth, coordinates, or timestamps are discarded.
- Earthquakes are sorted newest first.
- Region names for the "Top regions" list are inferred from the place label suffix or from the part after `"of "` when there is no comma.
- The magnitude histogram uses coarse buckets so it stays legible on small screens.

## Rebuilding

If you want a newer snapshot:

1. Replace `data/source/usgs-all-month.geojson` with a newly downloaded copy from the canonical URL.
2. Run `npm run build:data`.
3. Run `npm test` before committing.
