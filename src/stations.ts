import "dotenv/config";

export const STATION_SELECT_CUSTOM_ID = "radio:select-station";

export interface RadioStation {
  color: number;
  description: string;
  emoji: string;
  homepageUrl: string;
  id: string;
  logoUrl: string;
  name: string;
  streamUrl: string;
}

export const stations = [
  {
    id: "capital",
    name: "Capital",
    description: "The UK's No.1 Hit Music Station",
    emoji: "🎵",
    color: 0xe4002b,
    homepageUrl: "https://www.capitalfm.com/",
    logoUrl: "https://www.capitalfm.com/assets_v4r/capital/img/favicon-196x196.png",
    streamUrl:
      process.env.CAPITAL_STREAM_URL?.trim() ||
      "https://media-sov.musicradio.com/CapitalUKMP3",
  },
  {
    id: "kiss",
    name: "KISS",
    description: "The best vibes and energy",
    emoji: "💋",
    color: 0x9945ff,
    homepageUrl: "https://www.hellorayo.co.uk/kiss",
    logoUrl:
      "https://media.bauerradio.com/image/upload/c_crop,g_custom/v1776026845/brand_manager/stations/rzvgwnliqry5gam7a6ts.jpg",
    streamUrl: process.env.KISS_STREAM_URL?.trim() || "",
  },
  {
    id: "bbc-1xtra",
    name: "BBC Radio 1Xtra",
    description: "Hip-hop, R&B, Afrobeats, dancehall and UK sounds",
    emoji: "1️⃣",
    color: 0x00c8ff,
    homepageUrl: "https://www.bbc.co.uk/sounds/play/live:bbc_1xtra",
    logoUrl:
      "https://sounds.files.bbci.co.uk/3.12.0/networks/bbc_1xtra/blocks-colour_600x600.png",
    streamUrl:
      process.env.BBC_1XTRA_STREAM_URL?.trim() ||
      "https://as-hls-ww-live.akamaized.net/pool_92079267/live/ww/bbc_1xtra/bbc_1xtra.isml/bbc_1xtra-audio%3d96000.norewind.m3u8",
  },
  {
    id: "truckersfm",
    name: "TruckersFM",
    description: "Your drive, your music",
    emoji: "🚛",
    color: 0xf97316,
    homepageUrl: "https://www.truckers.fm/",
    logoUrl: "https://www.truckers.fm/preview.png",
    streamUrl:
      process.env.TRUCKERSFM_STREAM_URL?.trim() || "http://radio.truckers.fm",
  },
  {
    id: "lbc",
    name: "LBC",
    description: "Leading Britain's Conversation",
    emoji: "🗣️",
    color: 0x003b71,
    homepageUrl: "https://www.lbc.co.uk/radio/",
    logoUrl: "https://www.lbc.co.uk/favicon-96x96.png",
    streamUrl:
      process.env.LBC_STREAM_URL?.trim() ||
      "https://media-sov.musicradio.com/LBCUKMP3",
  },
] as const satisfies readonly RadioStation[];

export function findStation(id: string): RadioStation | undefined {
  return stations.find((station) => station.id === id);
}
