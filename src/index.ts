import {
  ActionRowBuilder,
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  PermissionsBitField,
  StringSelectMenuBuilder,
} from "discord.js";
import { loadConfig } from "./config.js";
import {
  errorEmbed,
  idleStatusEmbed,
  nowPlayingEmbed,
  stationPickerEmbed,
  statusEmbed,
  stoppedEmbed,
  tuningEmbed,
} from "./embeds.js";
import { RadioManager } from "./radio-manager.js";
import { STATION_SELECT_CUSTOM_ID, findStation, stations } from "./stations.js";

const config = loadConfig();
const radio = new RadioManager();
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready as ${readyClient.user.tag}.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (!interaction.guildId || !interaction.inCachedGuild()) {
        await interaction.reply({
          embeds: [errorEmbed("Server only", "Radio commands can only be used inside a server.")],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (interaction.commandName === "play") {
        const select = new StringSelectMenuBuilder()
          .setCustomId(STATION_SELECT_CUSTOM_ID)
          .setPlaceholder("Choose a radio station")
          .addOptions(stations.map((station) => ({
            description: station.description,
            emoji: station.emoji,
            label: station.name,
            value: station.id,
          })));
        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        await interaction.reply({
          embeds: [stationPickerEmbed()],
          components: [row],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (interaction.commandName === "station") {
        const station = radio.getStation(interaction.guildId);
        await interaction.reply({
          embeds: [station ? statusEmbed(station) : idleStatusEmbed()],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (interaction.commandName === "stop") {
        await interaction.reply({
          embeds: [stoppedEmbed(radio.stop(interaction.guildId))],
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }

    if (!interaction.isStringSelectMenu() || interaction.customId !== STATION_SELECT_CUSTOM_ID) return;
    await interaction.deferUpdate();
    if (!interaction.guildId || !interaction.inCachedGuild()) {
      await interaction.editReply({
        embeds: [errorEmbed("Server only", "Radio stations can only be played inside a server.")],
        components: [],
      });
      return;
    }

    const station = findStation(interaction.values[0] ?? "");
    if (!station) {
      await interaction.editReply({
        embeds: [errorEmbed("Station unavailable", "That station is no longer available.")],
        components: [],
      });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      await interaction.editReply({
        embeds: [errorEmbed("Join a voice channel", "Connect to a voice channel, then use `/play` again.")],
        components: [],
      });
      return;
    }

    const botMember = interaction.guild.members.me;
    const permissions = botMember ? voiceChannel.permissionsFor(botMember) : undefined;
    if (!permissions?.has([
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.Speak,
    ])) {
      await interaction.editReply({
        embeds: [errorEmbed(
          "Missing permissions",
          "I need **View Channel**, **Connect**, and **Speak** in your voice channel.",
        )],
        components: [],
      });
      return;
    }

    await interaction.editReply({ embeds: [tuningEmbed(station)], components: [] });
    await radio.play({
      adapterCreator: interaction.guild.voiceAdapterCreator,
      channelId: voiceChannel.id,
      guildId: interaction.guildId,
      station,
    });
    await interaction.editReply({
      embeds: [nowPlayingEmbed(station, voiceChannel.name)],
      components: [],
    });
  } catch (error) {
    console.error("Interaction failed:", error);
    if (!interaction.isRepliable()) return;
    const payload = {
      embeds: [errorEmbed(
        "Couldn't start the radio",
        "Check my voice permissions and the bot logs, then try again.",
      )],
      components: [],
    };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload).catch(() => undefined);
    } else {
      await interaction.reply({ ...payload, flags: MessageFlags.Ephemeral }).catch(() => undefined);
    }
  }
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}; shutting down.`);
  radio.shutdown();
  await client.destroy();
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
await client.login(config.token);
