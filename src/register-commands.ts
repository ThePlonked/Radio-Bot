import { REST, Routes } from "discord.js";
import { commandDefinitions } from "./commands.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const rest = new REST({ version: "10" }).setToken(config.token);
const route = config.guildId
  ? Routes.applicationGuildCommands(config.clientId, config.guildId)
  : Routes.applicationCommands(config.clientId);

console.log(config.guildId
  ? `Registering commands in development server ${config.guildId}…`
  : "Registering global commands…");
await rest.put(route, { body: commandDefinitions });
console.log("Commands registered successfully.");
