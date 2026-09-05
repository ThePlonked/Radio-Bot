import { once } from "node:events";
import { spawnRadioTranscoder } from "./ffmpeg-radio.js";
import { stations } from "./stations.js";
import { resolveStationStreamUrl } from "./stream-resolver.js";

async function checkStream(name: string, url: string): Promise<void> {
  const transcoder = spawnRadioTranscoder(url, 5);
  const child = transcoder.process;
  child.stdout.resume();
  const [code] = (await once(child, "exit")) as [number | null];
  if (code !== 0) {
    throw new Error(`${name} failed FFmpeg validation: ${transcoder.getDiagnostics()}`);
  }
  console.log(`✓ ${name}: decoded five seconds successfully`);
}

for (const station of stations) {
  await checkStream(station.name, await resolveStationStreamUrl(station));
}
