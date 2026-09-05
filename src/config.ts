import "dotenv/config";

export interface BotConfig {
  clientId: string;
  guildId?: string;
  token: string;
}

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function loadConfig(): BotConfig {
  const guildId = process.env.DISCORD_GUILD_ID?.trim();
  return {
    clientId: requireEnvironmentVariable("DISCORD_CLIENT_ID"),
    token: requireEnvironmentVariable("DISCORD_TOKEN"),
    ...(guildId ? { guildId } : {}),
  };
}
