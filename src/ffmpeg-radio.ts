import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import ffmpegModule from "ffmpeg-static";

const bundledFfmpegPath = ffmpegModule as unknown as string | null;
if (!bundledFfmpegPath) throw new Error("ffmpeg-static did not provide an executable.");
const ffmpegPath: string = bundledFfmpegPath;

const USER_AGENT =
  "Mozilla/5.0 (compatible; DiscordRadioBot/1.0; +https://github.com/your-username/discord-radio-bot)";

export interface RadioTranscoder {
  getDiagnostics: () => string;
  process: ChildProcessWithoutNullStreams;
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
