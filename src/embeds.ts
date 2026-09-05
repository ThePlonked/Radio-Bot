import { EmbedBuilder } from "discord.js";
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
