# Quake Window

Quake Window is a small static earthquake exploration site built around a bundled snapshot of the USGS "All Earthquakes, Past Month" feed. It exists to make a real open dataset easy to inspect locally without any backend, API key, or build step beyond producing the bundled JSON snapshot.

## Why it exists

The USGS monthly feed is useful, but the raw GeoJSON is not especially friendly for quick visual scanning. This project turns that feed into a lightweight local artifact with client-side filtering, a few focused visual summaries, and a plain deployment path to GitHub Pages.

## Features

- Bundles a real USGS monthly earthquake snapshot into the repo
- Filters locally by minimum magnitude and place text
- Shows key summary stats for the current filter
- Renders an SVG scatterplot and magnitude histogram without a framework
- Lists the most common filtered regions and the largest matching earthquakes
- Includes Node-based tests for normalization and summary logic

## Project structure

- `index.html`, `styles.css`, `app.js`: static frontend
- `scripts/lib/quake-data.mjs`: shared normalization and aggregation logic
- `scripts/build-data.mjs`: generates `data/earthquakes.json` from the raw GeoJSON snapshot
- `data/source/usgs-all-month.geojson`: bundled source snapshot fetched during this run
- `tests/`: automated tests
- `docs/`: additional project and data notes

## Setup

Requirements:

- Node.js 20+ recommended
- Python 3 for the simple static server command

Install:

```bash
npm install
```

There are no runtime dependencies, so this only creates a lockfile-free local npm context for scripts.

## How to run

Build the bundled JSON snapshot from the stored GeoJSON file:

```bash
npm run build:data
```

Serve the repo root as a static site:

```bash
npm run serve
```

Then open `http://localhost:4173`.

## How to test

```bash
npm test
```

## Example usage

1. Run `npm run build:data`.
2. Run `npm run serve`.
3. Open the app and drag the magnitude slider to `4.0+`.
4. Type `Alaska` or `Japan` into the place search box.
5. Inspect the filtered scatterplot, region list, and top-earthquake table.

## Data source

- Source feed: USGS Earthquake Hazards Program monthly GeoJSON feed
- Snapshot file: `data/source/usgs-all-month.geojson`
- Generated bundle: `data/earthquakes.json`

More detail is in [docs/data-notes.md](./docs/data-notes.md).

## Limitations

- The visualization uses a monthly snapshot committed to the repo, not a live feed.
- The scatterplot prioritizes speed and readability over exact geographic encoding.
- Region grouping is based on the suffix of the USGS place label, so it is approximate.
- GitHub Pages serves the committed snapshot; it does not auto-refresh from USGS.

## Next ideas

- Add a small refresh helper that refetches the latest monthly snapshot
- Add date-range filtering and richer depth band analysis
- Explore a compact map projection that still works without online tile services
