import { getRecentTracks } from "./recent-tracks.js";
import { stations } from "./stations.js";

for (const station of stations) {
  const result = await getRecentTracks(station);
  if (result.reason) {
    console.log(`– ${station.name}: ${result.reason}`);
    continue;
  }
  if (result.tracks.length === 0) {
    throw new Error(`${station.name} returned no recent tracks.`);
  }
  console.log(`✓ ${station.name}: received ${result.tracks.length} recent tracks`);
}
