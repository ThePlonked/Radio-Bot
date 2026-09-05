import { spawn } from "node:child_process";
import { once } from "node:events";
import ffmpegModule from "ffmpeg-static";
import { stations } from "./stations.js";
import { resolveStationStreamUrl } from "./stream-resolver.js";

const ffmpegPath = ffmpegModule as unknown as string | null;
if (!ffmpegPath) throw new Error("ffmpeg-static did not provide an executable.");
const ffmpegExecutable: string = ffmpegPath;

async function checkStream(name: string, url: string): Promise<void> {
  const child = spawn(ffmpegExecutable, [
    "-nostdin", "-hide_banner", "-loglevel", "error", "-rw_timeout", "15000000",
    "-t", "5", "-i", url, "-f", "null", "-",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  let diagnostics = "";
  const stderr = child.stderr;
  if (!stderr) throw new Error("FFmpeg did not expose its diagnostic stream.");
  stderr.setEncoding("utf8");
  stderr.on("data", (chunk: string) => { diagnostics += chunk; });
  const [code] = (await once(child, "exit")) as [number | null];
  if (code !== 0) {
    throw new Error(`${name} failed FFmpeg validation: ${diagnostics.trim()}`);
  }
  console.log(`✓ ${name}: decoded five seconds successfully`);
}

for (const station of stations) {
  await checkStream(station.name, await resolveStationStreamUrl(station));
}
