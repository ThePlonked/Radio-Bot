import { EmbedBuilder } from "discord.js";
import type { RecentTracksResult } from "./recent-tracks.js";
import { stations, type RadioStation } from "./stations.js";

const DEFAULT_COLOR = 0x7c3aed;

function stationBase(station: RadioStation): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(station.color)
    .setThumbnail(station.logoUrl)
    .setURL(station.homepageUrl)
    .setFooter({ text: "Live radio • Audio supplied by the broadcaster" })
    .setTimestamp();
}

export function stationPickerEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(DEFAULT_COLOR)
    .setTitle("📻 Choose a radio station")
    .setDescription(
      "Pick a station from the menu below. I'll join the voice channel you're currently in.",
    )
    .addFields({
      name: "Available now",
      value: stations.map((station) => `${station.emoji} **${station.name}**`).join("\n"),
    })
    .setFooter({ text: "You must be connected to a voice channel" });
}

export function tuningEmbed(station: RadioStation): EmbedBuilder {
  return stationBase(station)
    .setTitle(`📡 Tuning in to ${station.name}…`)
    .setDescription("Connecting to the live broadcast.");
}

export function nowPlayingEmbed(
  station: RadioStation,
  voiceChannelName: string,
): EmbedBuilder {
  return stationBase(station)
    .setTitle(`🔊 Now playing ${station.name}`)
    .setDescription(station.description)
    .addFields(
      { name: "Station", value: `${station.emoji} ${station.name}`, inline: true },
      { name: "Voice channel", value: `🔉 ${voiceChannelName}`, inline: true },
      { name: "Broadcast", value: "🟢 Live", inline: true },
    );
}

export function statusEmbed(station: RadioStation): EmbedBuilder {
  return stationBase(station)
    .setTitle(`📻 ${station.name} is live`)
    .setDescription(station.description)
    .addFields({ name: "Status", value: "🟢 Playing now", inline: true });
}

function escapeMarkdown(value: string): string {
  return value.replace(/[\\`*_~|]/gu, "\\$&");
}

export function recentTracksEmbed(
  station: RadioStation,
  result: RecentTracksResult,
): EmbedBuilder {
  const embed = stationBase(station).setTitle(`🕘 Recently played on ${station.name}`);
  if (result.tracks.length === 0) {
    return embed.setDescription(
      result.reason ?? "The station did not return any recent tracks. Try again shortly.",
    );
  }

  embed.setDescription(result.tracks.map((track, index) => {
    const time = track.playedAt ? ` • ${track.playedAt}` : "";
    return `**${index + 1}. ${escapeMarkdown(track.title)}**\n${escapeMarkdown(track.artist)}${time}`;
  }).join("\n\n"));

  if (result.sourceName && result.sourceUrl) {
    embed.addFields({
      name: "Track data",
      value: `[${result.sourceName}](${result.sourceUrl})`,
    });
  }
  return embed;
}

export function stationDirectoryEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(DEFAULT_COLOR)
    .setTitle("📻 Available radio stations")
    .setDescription(stations.map((station) =>
      `${station.emoji} **[${station.name}](${station.homepageUrl})**\n${station.description}`,
    ).join("\n\n"))
    .setFooter({ text: "Use /play to tune in" });
}

export function radioHelpEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(DEFAULT_COLOR)
    .setTitle("🎧 Radio bot commands")
    .setDescription("Join a voice channel, then use `/play` to start live radio.")
    .addFields(
      { name: "/play", value: "Choose and play a live station.", inline: true },
      { name: "/station", value: "See what station is playing.", inline: true },
      { name: "/recent", value: "Show its five latest songs.", inline: true },
      { name: "/stations", value: "Browse every available station.", inline: true },
      { name: "/stop", value: "Stop playback and disconnect.", inline: true },
      { name: "/radio-help", value: "Show this command guide.", inline: true },
    )
    .setFooter({ text: "Each Discord server has its own radio player" });
}

export function stoppedEmbed(didStop: boolean): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(didStop ? 0x22c55e : 0x64748b)
    .setTitle(didStop ? "⏹️ Radio stopped" : "💤 Nothing is playing")
    .setDescription(
      didStop
        ? "Playback has ended and I've left the voice channel."
        : "Use `/play` to choose a station.",
    );
}

export function idleStatusEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x64748b)
    .setTitle("💤 The radio is idle")
    .setDescription("Nothing is currently playing. Use `/play` to tune in.");
}

export function errorEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description);
}
