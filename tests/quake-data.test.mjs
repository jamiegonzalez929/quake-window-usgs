import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMagnitudeBuckets,
  buildSnapshot,
  extractRegion,
  filterEarthquakes,
  summarizeEarthquakes,
  topPlaces
} from "../scripts/lib/quake-data.mjs";

const fixtureFeed = {
  metadata: {
    title: "Fixture Feed",
    url: "https://example.com/feed"
  },
  features: [
    {
      id: "a",
      properties: {
        place: "10 km S of Town, Alaska",
        mag: 2.4,
        magType: "ml",
        time: 1_700_000_000_000,
        updated: 1_700_000_100_000,
        tsunami: 0,
        felt: 2,
        sig: 89,
        url: "https://example.com/a"
      },
      geometry: {
        coordinates: [-150.1, 61.2, 12.4]
      }
    },
    {
      id: "b",
      properties: {
        place: "Near the coast of Nicaragua",
        mag: 5.1,
        magType: "mww",
        time: 1_700_040_000_000,
        updated: 1_700_040_100_000,
        tsunami: 1,
        felt: null,
        sig: 401,
        url: "https://example.com/b"
      },
      geometry: {
        coordinates: [-86.1, 11.4, 43.2]
      }
    },
    {
      id: "c",
      properties: {
        place: "3 km ENE of Pahala, Hawaii",
        mag: 0.4,
        magType: "md",
        time: 1_700_070_000_000,
        updated: 1_700_070_100_000,
        tsunami: 0,
        felt: 1,
        sig: 3,
        url: "https://example.com/c"
      },
      geometry: {
        coordinates: [-155.4, 19.2, 33]
      }
    }
  ]
};

test("buildSnapshot sorts earthquakes descending by time and includes summary", () => {
  const snapshot = buildSnapshot(fixtureFeed, "2026-03-24T00:00:00.000Z");

  assert.equal(snapshot.source.count, 3);
  assert.equal(snapshot.earthquakes[0].id, "c");
  assert.equal(snapshot.earthquakes[2].id, "a");
  assert.equal(snapshot.summary.strongest.id, "b");
});

test("summarizeEarthquakes computes the main metrics", () => {
  const earthquakes = buildSnapshot(fixtureFeed).earthquakes;
  const summary = summarizeEarthquakes(earthquakes, 1_700_080_000_000);

  assert.equal(summary.count, 3);
  assert.equal(summary.averageMagnitude, 2.63);
  assert.equal(summary.averageDepth, 29.5);
  assert.equal(summary.feltReports, 3);
  assert.equal(summary.tsunamiCount, 1);
  assert.equal(summary.last24Hours, 3);
});

test("filterEarthquakes applies magnitude and text filters together", () => {
  const earthquakes = buildSnapshot(fixtureFeed).earthquakes;
  const filtered = filterEarthquakes(earthquakes, {
    minMagnitude: 1,
    search: "alaska"
  });

  assert.deepEqual(filtered.map((quake) => quake.id), ["a"]);
});

test("buildMagnitudeBuckets and topPlaces group the filtered data", () => {
  const earthquakes = buildSnapshot(fixtureFeed).earthquakes;

  assert.deepEqual(buildMagnitudeBuckets(earthquakes), [
    { label: "<1", count: 1 },
    { label: "1-1.9", count: 0 },
    { label: "2-2.9", count: 1 },
    { label: "3-3.9", count: 0 },
    { label: "4-4.9", count: 0 },
    { label: "5+", count: 1 }
  ]);

  assert.deepEqual(topPlaces(earthquakes, 3), [
    { name: "Alaska", count: 1 },
    { name: "Hawaii", count: 1 },
    { name: "Nicaragua", count: 1 }
  ]);
});

test("extractRegion keeps simple place names usable", () => {
  assert.equal(extractRegion("Nevada"), "Nevada");
  assert.equal(extractRegion("57 km W of Anchor Point, Alaska"), "Alaska");
  assert.equal(extractRegion("Near the coast of Nicaragua"), "Nicaragua");
});
