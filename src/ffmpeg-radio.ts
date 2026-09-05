import "dotenv/config";
import {
  spawn,
  spawnSync,
  type ChildProcessWithoutNullStreams,
} from "node:child_process";
import ffmpegModule from "ffmpeg-static";

const bundledFfmpegPath = ffmpegModule as unknown as string | null;
const configuredFfmpegPath = process.env.FFMPEG_PATH?.trim();
if (!configuredFfmpegPath && !bundledFfmpegPath) {
  throw new Error("Set FFMPEG_PATH or install ffmpeg-static.");
}
const ffmpegPath: string = configuredFfmpegPath || bundledFfmpegPath || "ffmpeg";

const USER_AGENT =
  "Mozilla/5.0 (compatible; DiscordRadioBot/1.0; +https://github.com/your-username/discord-radio-bot)";

export interface RadioTranscoder {
  getDiagnostics: () => string;
  process: ChildProcessWithoutNullStreams;
}

export function getFfmpegDescription(): string {
  const result = spawnSync(ffmpegPath, ["-version"], {
    encoding: "utf8",
    timeout: 5_000,
    windowsHide: true,
  });
  if (result.error) {
    throw new Error(`FFmpeg could not be started from ${ffmpegPath}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `FFmpeg version check failed from ${ffmpegPath}: ${result.stderr.trim() || "unknown error"}`,
    );
  }
  const version = result.stdout.split(/\r?\n/u)[0]?.trim() || "FFmpeg version unknown";
  return `${version} [${ffmpegPath}]`;
}

export function spawnRadioTranscoder(
  streamUrl: string,
  durationSeconds?: number,
): RadioTranscoder {
  const args = [
    "-nostdin",
    "-hide_banner",
    "-loglevel", "warning",
    "-rw_timeout", "15000000",
    "-reconnect", "1",
    "-reconnect_at_eof", "1",
    "-reconnect_streamed", "1",
    "-reconnect_on_network_error", "1",
    "-reconnect_on_http_error", "5xx",
    "-reconnect_delay_max", "5",
    "-user_agent", USER_AGENT,
    "-i", streamUrl,
    "-vn",
    ...(durationSeconds ? ["-t", String(durationSeconds)] : []),
    "-map", "0:a:0",
    "-ac", "2",
    "-ar", "48000",
    "-c:a", "libopus",
    "-b:a", "128k",
    "-f", "ogg",
    "pipe:1",
  ];
  const process = spawn(ffmpegPath, args);
  process.stdin.end();

  let diagnostics = "";
  process.stderr.setEncoding("utf8");
  process.stderr.on("data", (chunk: string) => {
    diagnostics = `${diagnostics}${chunk}`.slice(-8_000);
  });

  return { process, getDiagnostics: () => diagnostics.trim() };
}
