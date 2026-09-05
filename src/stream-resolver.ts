import type { RadioStation } from "./stations.js";

const KISS_PLAYER_PAGE = "https://radiomap.eu/uk/play/kiss";
const KISS_STREAM_PATTERN =
  /https:\/\/stream-kiss\.hellorayo\.co\.uk\/kissnational\.mp3\?[^"'<>\s]+/u;
const ALLOWED_KISS_STREAM_HOSTS = new Set([
  "stream-kiss.hellorayo.co.uk",
  "live-bauerkiss.sharp-stream.com",
]);

export function parseKissPlayerStream(html: string): string {
  const match = html.match(KISS_STREAM_PATTERN)?.[0];
  if (!match) {
    throw new Error("The KISS web player did not publish a usable stream URL.");
  }

  const url = new URL(match.replaceAll("&amp;", "&"));
  if (
    url.protocol !== "https:" ||
    !ALLOWED_KISS_STREAM_HOSTS.has(url.hostname) ||
    !url.pathname.endsWith("/kissnational.mp3")
  ) {
    throw new Error("The KISS web player returned an unexpected stream URL.");
  }
  return url.toString();
}

export async function resolveStationStreamUrl(station: RadioStation): Promise<string> {
  if (station.streamUrl) return station.streamUrl;
  if (station.id !== "kiss") throw new Error(`${station.name} has no stream URL.`);

  const response = await fetch(KISS_PLAYER_PAGE, {
    headers: {
      "User-Agent": "DiscordRadioBot/1.0 (+https://github.com/your-username/discord-radio-bot)",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`KISS player request failed with HTTP ${response.status}.`);
  }
  return parseKissPlayerStream(await response.text());
}
