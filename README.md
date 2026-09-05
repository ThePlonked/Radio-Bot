# Discord Radio Bot

![Discord Radio Bot icon](assets/bot-icon.png)

An open-source Discord bot that plays live internet radio in voice channels.
It includes Capital, KISS, BBC Radio 1Xtra, TruckersFM, and LBC, and is designed
to be easy to extend.

## Requirements

- [Node.js](https://nodejs.org/) 22.12 or newer
- [pnpm](https://pnpm.io/) 11 or newer
- A Discord application and bot account
- A host with outbound HTTP(S) and UDP access

FFmpeg is installed through `ffmpeg-static`, so a system installation is not
normally required.

## Discord application setup

1. Create an application in the [Discord Developer Portal](https://discord.com/developers/applications).
2. Open **Bot**, create the bot user, and copy its token.
3. Upload [`assets/bot-icon.png`](assets/bot-icon.png) as the bot avatar.
4. Open **Installation** and enable the `bot` and `applications.commands` scopes.
5. Grant **View Channels**, **Send Messages**, **Connect**, and **Speak**.
6. Install the application in your test server.

Only the `Guilds` and `Guild Voice States` gateway intents are requested. No
privileged intents are required.

## Installation

```bash
git clone https://github.com/ThePlonked/radio-bot.git
cd discord-radio-bot
pnpm install
```

Copy the environment template:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Add your credentials to `.env`:

```dotenv
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_id
DISCORD_GUILD_ID=your_test_server_id
```

`DISCORD_GUILD_ID` is optional but recommended during development because guild
commands update immediately. Without it, command registration is global and
Discord may take time to propagate changes.

Register commands and start the bot:

```bash
pnpm deploy-commands
pnpm dev
```

Only rerun `deploy-commands` when command definitions or their registration
scope change.

## Commands

| Command | Description |
| --- | --- |
| `/play` | Shows an embed and menu for choosing an available station. |
| `/station` | Shows an embed for the station currently playing. |
| `/stop` | Stops playback, disconnects, and confirms with an embed. |

Join the desired voice channel before using `/play`. Every Discord server has
an independent player and can listen to a different station.

## Embeds and station artwork

Playback, status, errors, and stop confirmations use colour-coded Discord
embeds. Station embeds pull their thumbnail from the broadcaster's public media
CDN and link back to the official station page. The project does not redistribute
or claim ownership of station artwork.

If a broadcaster replaces a logo URL, update `logoUrl` in `src/stations.ts`.
An unavailable thumbnail does not affect audio playback.

## Production deployment

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

For a public release, remove `DISCORD_GUILD_ID` and run `pnpm deploy-commands`
once to create global commands. Run the bot with a service manager or container
host that can restart it after failures.

Long-lived Discord voice connections require outbound UDP. Radio sources need
outbound HTTPS. Short-lived serverless functions are generally unsuitable.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `DISCORD_TOKEN` | Yes | Secret bot token from the Developer Portal. |
| `DISCORD_CLIENT_ID` | Yes | Application ID used to register commands. |
| `DISCORD_GUILD_ID` | No | Development server for immediate command updates. |
| `CAPITAL_STREAM_URL` | No | Overrides the built-in Capital stream. |
| `KISS_STREAM_URL` | No | Bypasses discovery and uses this authorised endpoint. |
| `BBC_1XTRA_STREAM_URL` | No | Overrides the built-in BBC Radio 1Xtra HLS feed. |
| `TRUCKERSFM_STREAM_URL` | No | Overrides TruckersFM's published radio endpoint. |
| `LBC_STREAM_URL` | No | Overrides the built-in LBC MP3 feed. |

Never commit `.env`. Reset an exposed token immediately.

## How playback works

The bot maintains one voice connection and audio player per Discord server.
Capital and LBC expose stable MP3 feeds. BBC Radio 1Xtra uses the BBC's HLS
feed, and TruckersFM uses the endpoint published in its official playlist.
KISS requires listener-session and advertising parameters, so a fresh public
player URL is resolved when playback begins. An explicit `KISS_STREAM_URL`
bypasses discovery.

FFmpeg reads the selected MP3 stream and the Discord voice library handles Opus
audio, encryption, and the DAVE protocol. Unexpected stream failures retry five
times with increasing delays before the bot disconnects.

## Adding a station

Add an entry to `src/stations.ts` containing a unique ID, name, description,
emoji, embed colour, official homepage, HTTPS logo, and legitimate HTTP(S) audio
URL. Then run:

```bash
pnpm check
pnpm check:streams
pnpm build
```

Do not add temporary, authenticated, premium, or ad-free endpoints.

## Development scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Run with source-file watching. |
| `pnpm deploy-commands` | Register slash commands. |
| `pnpm lint` | Check source style and common mistakes. |
| `pnpm typecheck` | Run strict TypeScript checking. |
| `pnpm test` | Run automated tests. |
| `pnpm check` | Run linting, compilation, and tests. |
| `pnpm check:streams` | Decode five seconds from each live station. |
| `pnpm build` | Compile TypeScript into `dist/`. |
| `pnpm start` | Run the compiled production bot. |

## Troubleshooting

### Commands do not appear

Check `DISCORD_CLIENT_ID`, ensure the application was installed with the
`applications.commands` scope, and rerun `pnpm deploy-commands`. Use
`DISCORD_GUILD_ID` while developing.

### The bot joins but no audio plays

Check Speak permission, outbound UDP, and HTTP(S) access. Run
`pnpm check:streams` and review the console for FFmpeg or voice errors.

### A logo does not appear

Discord must be able to fetch the station's `logoUrl`. Update the URL in
`src/stations.ts`; the missing image will not stop playback.

## Legal notice

This repository contains software only. It does not distribute recordings,
subscriptions, broadcasting rights, music licences, or station logos. Capital,
KISS, BBC Radio 1Xtra, TruckersFM, LBC, and related names and artwork belong to
their respective owners and do not imply endorsement.

Operators are responsible for broadcaster terms, Discord's terms, copyright
law, and any music, public-performance, or webcasting licences that apply where
the bot is hosted and heard. Obtain permission or professional advice before
offering a public or commercial service.

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes. Report
vulnerabilities according to [SECURITY.md](SECURITY.md).

## License

The bot's source code is available under the [MIT License](LICENSE).
