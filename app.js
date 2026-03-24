import {
  buildMagnitudeBuckets,
  filterEarthquakes,
  summarizeEarthquakes,
  topPlaces
} from "./scripts/lib/quake-data.mjs";

const data = await fetch("./data/earthquakes.json").then((response) => response.json());

const state = {
  minMagnitude: 2,
  search: ""
};

const heroMeta = document.querySelector("#hero-meta");
const stats = document.querySelector("#stats");
const table = document.querySelector("#quake-table");
const topPlacesList = document.querySelector("#top-places");
const scatterplot = document.querySelector("#scatterplot");
const histogram = document.querySelector("#histogram");
const minMagnitudeInput = document.querySelector("#min-magnitude");
const minMagnitudeLabel = document.querySelector("#min-magnitude-label");
const placeSearchInput = document.querySelector("#place-search");

heroMeta.innerHTML = `
  <span>Source: ${escapeHtml(data.source.title)}</span>
  <span>Snapshot: ${formatDateTime(data.source.generatedAt)}</span>
  <span>Total events: ${formatNumber(data.source.count)}</span>
`;

minMagnitudeInput.addEventListener("input", (event) => {
  state.minMagnitude = Number(event.target.value);
  minMagnitudeLabel.textContent = `${state.minMagnitude.toFixed(1)}+`;
  render();
});

placeSearchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  render();
});

render();

function render() {
  const filtered = filterEarthquakes(data.earthquakes, state);
  const summary = summarizeEarthquakes(filtered);

  renderStats(summary);
  renderScatterplot(filtered);
  renderHistogram(filtered);
  renderTopPlaces(filtered);
  renderTable(filtered);
}

function renderStats(summary) {
  const cards = [
    {
      value: formatNumber(summary.count),
      label: "Filtered earthquakes"
    },
    {
      value: summary.strongest ? summary.strongest.magnitude.toFixed(1) : "0.0",
      label: summary.strongest
        ? `Strongest: ${summary.strongest.place}`
        : "No earthquakes match the filter"
    },
    {
      value: summary.averageDepth.toFixed(1),
      label: "Average depth (km)"
    },
    {
      value: formatNumber(summary.last24Hours),
      label: "Occurred in the last 24 hours"
    }
  ];

  stats.innerHTML = cards
    .map(
      (card) => `
        <article>
          <h2>${escapeHtml(card.value)}</h2>
          <p>${escapeHtml(card.label)}</p>
        </article>
      `
    )
    .join("");
}

function renderScatterplot(earthquakes) {
  if (!earthquakes.length) {
    scatterplot.innerHTML = emptySvgMessage(820, 360, "No earthquakes match the current filter.");
    return;
  }

  const width = 820;
  const height = 360;
  const margin = { top: 20, right: 30, bottom: 42, left: 48 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const maxDepth = Math.max(...earthquakes.map((quake) => quake.depth));
  const minMagnitude = Math.min(...earthquakes.map((quake) => quake.magnitude));
  const maxMagnitude = Math.max(...earthquakes.map((quake) => quake.magnitude));

  const topMagnitude = [...earthquakes]
    .sort((left, right) => right.magnitude - left.magnitude || right.time - left.time)
    .slice(0, 12);
  const topIds = new Set(topMagnitude.map((quake) => quake.id));

  const dots = earthquakes
    .slice(0, 500)
    .map((quake, index) => {
      const x =
        margin.left +
        ((earthquakes.length - 1 - index) / Math.max(earthquakes.length - 1, 1)) * innerWidth;
      const y =
        margin.top +
        innerHeight -
        ((quake.magnitude - minMagnitude) / Math.max(maxMagnitude - minMagnitude, 0.1)) * innerHeight;
      const radius = 2 + Math.min(7, Math.max(0, quake.depth) / 90);

      return `<circle class="dot${topIds.has(quake.id) ? " top" : ""}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius.toFixed(1)}">
        <title>${escapeHtml(`${quake.place} | M ${quake.magnitude.toFixed(1)} | ${quake.depth.toFixed(1)} km`)}</title>
      </circle>`;
    })
    .join("");

  scatterplot.innerHTML = `
    <line class="axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" />
    <line class="axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" />
    <line class="grid-line" x1="${margin.left}" y1="${margin.top}" x2="${width - margin.right}" y2="${margin.top}" />
    <text class="axis-label" x="${width / 2}" y="${height - 8}" text-anchor="middle">Older to newer events</text>
    <text class="axis-label" x="18" y="${height / 2}" transform="rotate(-90 18 ${height / 2})" text-anchor="middle">Magnitude</text>
    <text class="axis-label" x="${width - margin.right}" y="${margin.top + 12}" text-anchor="end">Max depth ${maxDepth.toFixed(0)} km</text>
    ${dots}
  `;
}

function renderHistogram(earthquakes) {
  const buckets = buildMagnitudeBuckets(earthquakes);
  const width = 420;
  const height = 280;
  const margin = { top: 16, right: 14, bottom: 42, left: 30 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const barWidth = innerWidth / buckets.length - 12;
  const peak = Math.max(...buckets.map((bucket) => bucket.count), 1);

  histogram.innerHTML = buckets
    .map((bucket, index) => {
      const x = margin.left + index * (barWidth + 12);
      const barHeight = (bucket.count / peak) * innerHeight;
      const y = margin.top + innerHeight - barHeight;

      return `
        <rect class="bar" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="8" />
        <text class="axis-label" x="${x + barWidth / 2}" y="${height - 14}" text-anchor="middle">${bucket.label}</text>
        <text class="axis-label" x="${x + barWidth / 2}" y="${Math.max(14, y - 6)}" text-anchor="middle">${bucket.count}</text>
      `;
    })
    .join("");
}

function renderTopPlaces(earthquakes) {
  const places = topPlaces(earthquakes);
  topPlacesList.innerHTML = places.length
    ? places
        .map(
          (place) =>
            `<li><span>${escapeHtml(place.name)}</span><strong>${formatNumber(place.count)}</strong></li>`
        )
        .join("")
    : `<li class="empty">No regional breakdown is available for this filter.</li>`;
}

function renderTable(earthquakes) {
  const rows = [...earthquakes]
    .sort((left, right) => right.magnitude - left.magnitude || right.time - left.time)
    .slice(0, 12);

  table.innerHTML = rows.length
    ? rows
        .map(
          (quake) => `
            <tr>
              <td><a href="${quake.url}" target="_blank" rel="noreferrer">M ${quake.magnitude.toFixed(1)}</a></td>
              <td>${escapeHtml(quake.place)}</td>
              <td>${quake.depth.toFixed(1)} km</td>
              <td>${formatDateTime(quake.time)}</td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="4" class="empty">No earthquakes match the current filter.</td></tr>`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(value));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function emptySvgMessage(width, height, message) {
  return `<rect width="${width}" height="${height}" fill="transparent"></rect>
    <text class="axis-label" x="${width / 2}" y="${height / 2}" text-anchor="middle">${escapeHtml(message)}</text>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
