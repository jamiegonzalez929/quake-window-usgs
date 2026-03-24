import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSnapshot } from "./lib/quake-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "data", "source", "usgs-all-month.geojson");
const outputPath = path.join(rootDir, "data", "earthquakes.json");

const raw = await fs.readFile(sourcePath, "utf8");
const feed = JSON.parse(raw);
const snapshot = buildSnapshot(feed);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);

console.log(
  `Built ${path.relative(rootDir, outputPath)} with ${snapshot.earthquakes.length} earthquakes.`
);
