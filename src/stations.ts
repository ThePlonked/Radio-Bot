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
] as const satisfies readonly RadioStation[];

export function findStation(id: string): RadioStation | undefined {
  return stations.find((station) => station.id === id);
}
