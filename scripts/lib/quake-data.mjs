const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function simplifyFeature(feature) {
  const { properties, geometry, id } = feature;
  const [longitude, latitude, depth] = geometry.coordinates;

  return {
    id,
    place: properties.place,
    magnitude: properties.mag,
    magnitudeType: properties.magType || "",
    time: properties.time,
    updated: properties.updated,
    tsunami: properties.tsunami,
    feltReports: properties.felt ?? 0,
    significance: properties.sig,
    longitude,
    latitude,
    depth,
    url: properties.url
  };
}

export function buildSnapshot(feed, generatedAt = new Date().toISOString()) {
  const earthquakes = feed.features
    .map(simplifyFeature)
    .filter((quake) =>
      Number.isFinite(quake.magnitude) &&
      Number.isFinite(quake.depth) &&
      Number.isFinite(quake.latitude) &&
      Number.isFinite(quake.longitude) &&
      Number.isFinite(quake.time)
    )
    .sort((left, right) => right.time - left.time);

  return {
    source: {
      title: feed.metadata.title,
      generatedAt,
      feedUrl: feed.metadata.url,
      count: earthquakes.length
    },
    summary: summarizeEarthquakes(earthquakes),
    earthquakes
  };
}

export function summarizeEarthquakes(earthquakes, now = Date.now()) {
  if (!earthquakes.length) {
    return {
      count: 0,
      strongest: null,
      averageMagnitude: 0,
      averageDepth: 0,
      feltReports: 0,
      tsunamiCount: 0,
      last24Hours: 0
    };
  }

  const strongest = earthquakes.reduce((best, quake) =>
    quake.magnitude > best.magnitude ? quake : best
  );

  const totals = earthquakes.reduce(
    (accumulator, quake) => {
      accumulator.magnitude += quake.magnitude;
      accumulator.depth += quake.depth;
      accumulator.feltReports += quake.feltReports;
      accumulator.tsunamiCount += quake.tsunami ? 1 : 0;
      accumulator.last24Hours += now - quake.time <= MS_PER_DAY ? 1 : 0;
      return accumulator;
    },
    {
      magnitude: 0,
      depth: 0,
      feltReports: 0,
      tsunamiCount: 0,
      last24Hours: 0
    }
  );

  return {
    count: earthquakes.length,
    strongest,
    averageMagnitude: roundTo(totals.magnitude / earthquakes.length, 2),
    averageDepth: roundTo(totals.depth / earthquakes.length, 1),
    feltReports: totals.feltReports,
    tsunamiCount: totals.tsunamiCount,
    last24Hours: totals.last24Hours
  };
}

export function filterEarthquakes(
  earthquakes,
  { minMagnitude = -10, search = "" } = {}
) {
  const normalizedSearch = search.trim().toLowerCase();
  return earthquakes.filter((quake) => {
    if (quake.magnitude < minMagnitude) {
      return false;
    }

    if (normalizedSearch && !quake.place.toLowerCase().includes(normalizedSearch)) {
      return false;
    }

    return true;
  });
}

export function buildMagnitudeBuckets(earthquakes) {
  const labels = ["<1", "1-1.9", "2-2.9", "3-3.9", "4-4.9", "5+"];
  const buckets = labels.map((label) => ({ label, count: 0 }));

  for (const quake of earthquakes) {
    let index = 0;
    if (quake.magnitude >= 5) {
      index = 5;
    } else if (quake.magnitude >= 4) {
      index = 4;
    } else if (quake.magnitude >= 3) {
      index = 3;
    } else if (quake.magnitude >= 2) {
      index = 2;
    } else if (quake.magnitude >= 1) {
      index = 1;
    }

    buckets[index].count += 1;
  }

  return buckets;
}

export function topPlaces(earthquakes, limit = 6) {
  const counts = new Map();

  for (const quake of earthquakes) {
    const region = extractRegion(quake.place);
    counts.set(region, (counts.get(region) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, limit);
}

export function extractRegion(place) {
  const parts = place.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts.at(-1);
  }

  const ofIndex = place.toLowerCase().lastIndexOf(" of ");
  if (ofIndex !== -1) {
    return place.slice(ofIndex + 4).trim();
  }

  return place.trim();
}

function roundTo(value, digits) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}
