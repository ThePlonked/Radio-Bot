import { SlashCommandBuilder, type RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

export const commandDefinitions: RESTPostAPIApplicationCommandsJSONBody[] = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Choose a live radio station to play")
    .setDMPermission(false)
    .toJSON(),
  new SlashCommandBuilder()
    .setName("station")
    .setDescription("Show the radio station currently playing")
    .setDMPermission(false)
    .toJSON(),
  new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop the radio and disconnect the bot")
    .setDMPermission(false)
    .toJSON(),
];
