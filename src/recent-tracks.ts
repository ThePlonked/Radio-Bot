import type { RadioStation } from "./stations.js";

const USER_AGENT =
  "DiscordRadioBot/1.0 (+https://github.com/your-username/discord-radio-bot)";

const HISTORY_SOURCES = {
  capital: {
    name: "Capital",
    url: "https://www.capitalfm.com/radio/last-played-songs/",
  },
  kiss: {
    name: "Rayo",
    url: "https://www.hellorayo.co.uk/kiss/playlist",
  },
  "bbc-1xtra": {
    name: "BBC",
    url: "https://rms.api.bbc.co.uk/v2/services/bbc_1xtra/segments/latest?experience=domestic&offset=0&limit=5",
  },
  truckersfm: {
    name: "TruckersFM RadioCloud",
    url: "https://radiocloud.pro/api/public/v1/song/recent",
  },
} as const;

export interface RecentTrack {
  artist: string;
  playedAt?: string;
  title: string;
}

export interface RecentTracksResult {
  reason?: string;
  sourceName?: string;
  sourceUrl?: string;
  tracks: RecentTrack[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function decodeHtml(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/<[^>]*>/gu, " ")
    .replace(/&#x([0-9a-f]+);/giu, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/gu, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/giu, (entity, name: string) => namedEntities[name.toLowerCase()] ?? entity)
    .replace(/\s+/gu, " ")
    .trim();
}

export function parseCapitalHistory(html: string): RecentTrack[] {
  const cards = html.match(/<div id="song_promo_[\s\S]*?(?=<div id="song_promo_|$)/gu) ?? [];
  return cards.flatMap((card) => {
    const title = card.match(/<span itemprop="name" class="track">([\s\S]*?)<\/span>/u)?.[1];
    const artist = card.match(/<span itemprop="byArtist" class="artist">([\s\S]*?)<\/span>/u)?.[1];
    const playedAt = card.match(/<p class="publish_date">([\s\S]*?)<\/p>/u)?.[1];
    if (!title || !artist) return [];
    return [{
      title: decodeHtml(title),
      artist: decodeHtml(artist),
      ...(playedAt ? { playedAt: decodeHtml(playedAt) } : {}),
    }];
  }).slice(0, 5);
}

export function parseKissHistory(html: string): RecentTrack[] {
  const encoded = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/u,
  )?.[1];
  if (!encoded) return [];

  const root: unknown = JSON.parse(encoded);
  if (!isRecord(root) || !isRecord(root.props) || !isRecord(root.props.initialState) ||
      !isRecord(root.props.initialState.station) ||
      !isRecord(root.props.initialState.station.data)) return [];

  const history = root.props.initialState.station.data.stationPlayHistory;
  if (!Array.isArray(history)) return [];

  return history.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const title = stringValue(entry.nowPlayingTrack);
    const artist = stringValue(entry.nowPlayingArtist);
    if (!title || !artist) return [];
    const timestamp = stringValue(entry.nowPlayingTime);
    return [{
      title,
      artist,
      ...(timestamp ? { playedAt: timestamp.slice(11, 16) } : {}),
    }];
  }).slice(0, 5);
}

export function parseBbcHistory(payload: unknown): RecentTrack[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) return [];
  return payload.data.flatMap((entry) => {
    if (!isRecord(entry) || !isRecord(entry.titles)) return [];
    const artist = stringValue(entry.titles.primary);
    const title = stringValue(entry.titles.secondary);
    if (!artist || !title) return [];
    const playedAt = isRecord(entry.offset) ? stringValue(entry.offset.label) : undefined;
    return [{ title, artist, ...(playedAt ? { playedAt } : {}) }];
  }).slice(0, 5);
}

export function parseTruckersFmHistory(payload: unknown): RecentTrack[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) return [];
  return payload.data.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const artist = stringValue(entry.artist);
    const title = stringValue(entry.title);
    if (!artist || !title) return [];
    const timestamp = typeof entry.played_at === "number" ? Math.floor(entry.played_at) : undefined;
    return [{
      title,
      artist,
      ...(timestamp ? { playedAt: `<t:${timestamp}:t>` } : {}),
    }];
  }).slice(0, 5);
}

async function fetchResponse(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Track source returned HTTP ${response.status}.`);
  return response;
}

export async function getRecentTracks(station: RadioStation): Promise<RecentTracksResult> {
  if (station.id === "lbc") {
    return {
      tracks: [],
      reason: "LBC is a speech station and does not publish a recent-song history.",
    };
  }

  if (station.id === "capital") {
    const source = HISTORY_SOURCES.capital;
    return {
      tracks: parseCapitalHistory(await (await fetchResponse(source.url)).text()),
      sourceName: source.name,
      sourceUrl: source.url,
    };
  }

  if (station.id === "kiss") {
    const source = HISTORY_SOURCES.kiss;
    return {
      tracks: parseKissHistory(await (await fetchResponse(source.url)).text()),
      sourceName: source.name,
      sourceUrl: source.url,
    };
  }

  if (station.id === "bbc-1xtra") {
    const source = HISTORY_SOURCES["bbc-1xtra"];
    return {
      tracks: parseBbcHistory(await (await fetchResponse(source.url)).json()),
      sourceName: source.name,
      sourceUrl: station.homepageUrl,
    };
  }

  if (station.id === "truckersfm") {
    const source = HISTORY_SOURCES.truckersfm;
    return {
      tracks: parseTruckersFmHistory(await (await fetchResponse(source.url)).json()),
      sourceName: source.name,
      sourceUrl: station.homepageUrl,
    };
  }

  return { tracks: [], reason: "This station does not provide public track history." };
}
