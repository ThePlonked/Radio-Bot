import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  type AudioPlayer,
  type DiscordGatewayAdapterCreator,
  type VoiceConnection,
} from "@discordjs/voice";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { spawnRadioTranscoder } from "./ffmpeg-radio.js";
import type { RadioStation } from "./stations.js";
import { resolveStationStreamUrl } from "./stream-resolver.js";

const RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 20_000, 30_000] as const;

interface RadioSession {
  connection: VoiceConnection;
  ffmpeg?: ChildProcessWithoutNullStreams;
  guildId: string;
  player: AudioPlayer;
  restartTimer?: NodeJS.Timeout;
  retryCount: number;
  stableTimer?: NodeJS.Timeout;
  station: RadioStation;
  stopped: boolean;
}

export interface PlayRequest {
  adapterCreator: DiscordGatewayAdapterCreator;
  channelId: string;
  guildId: string;
  station: RadioStation;
}

export class RadioManager {
  private readonly sessions = new Map<string, RadioSession>();

  public getStation(guildId: string): RadioStation | undefined {
    return this.sessions.get(guildId)?.station;
  }

  public async play(request: PlayRequest): Promise<void> {
    this.stop(request.guildId);
    const connection = joinVoiceChannel({
      adapterCreator: request.adapterCreator,
      channelId: request.channelId,
      guildId: request.guildId,
      selfDeaf: true,
      selfMute: false,
    });
    const player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });
    const session: RadioSession = {
      connection,
      guildId: request.guildId,
      player,
      retryCount: 0,
      station: request.station,
      stopped: false,
    };

    this.sessions.set(request.guildId, session);
    connection.subscribe(player);
    this.attachEventHandlers(session);

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
      await this.startStream(session);
    } catch (error) {
      this.stop(request.guildId);
      throw error;
    }
  }

  public stop(guildId: string): boolean {
    const session = this.sessions.get(guildId);
    if (!session) return false;

    session.stopped = true;
    if (session.restartTimer) clearTimeout(session.restartTimer);
    if (session.stableTimer) clearTimeout(session.stableTimer);
    this.stopFfmpeg(session);
    session.player.stop(true);
    session.connection.destroy();
    this.sessions.delete(guildId);
    return true;
  }

  public shutdown(): void {
    for (const guildId of [...this.sessions.keys()]) this.stop(guildId);
  }

  private attachEventHandlers(session: RadioSession): void {
    session.player.on(AudioPlayerStatus.Playing, () => {
      if (session.stableTimer) clearTimeout(session.stableTimer);
      session.stableTimer = setTimeout(() => { session.retryCount = 0; }, 30_000);
    });
    session.player.on(AudioPlayerStatus.Idle, () => {
      this.scheduleRestart(session, "the stream ended");
    });
    session.player.on("error", (error) => {
      console.error(`[radio:${session.guildId}] ${session.station.name}:`, error.message);
      this.scheduleRestart(session, "the audio player failed");
    });
    session.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      if (session.stopped) return;
      try {
        await Promise.race([
          entersState(session.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(session.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.stop(session.guildId);
      }
    });
    session.connection.on("error", (error) => {
      console.error(`[radio:${session.guildId}] Voice connection:`, error.message);
    });
  }

  private scheduleRestart(session: RadioSession, reason: string): void {
    if (session.stopped || session.restartTimer || this.sessions.get(session.guildId) !== session) return;
    this.stopFfmpeg(session);
    if (session.retryCount >= RETRY_DELAYS_MS.length) {
      console.error(`[radio:${session.guildId}] Stopped after repeated stream failures.`);
      this.stop(session.guildId);
      return;
    }

    const delay = RETRY_DELAYS_MS[session.retryCount] ?? 30_000;
    session.retryCount += 1;
    console.warn(`[radio:${session.guildId}] Restarting in ${delay}ms because ${reason}.`);
    session.restartTimer = setTimeout(() => {
      delete session.restartTimer;
      void this.startStream(session).catch((error: unknown) => {
        console.error(`[radio:${session.guildId}] Reopen failed:`, error);
        this.scheduleRestart(session, "the stream could not be opened");
      });
    }, delay);
  }

  private async startStream(session: RadioSession): Promise<void> {
    if (session.stopped || this.sessions.get(session.guildId) !== session) return;
    const streamUrl = await resolveStationStreamUrl(session.station);
    if (session.stopped || this.sessions.get(session.guildId) !== session) return;
    this.stopFfmpeg(session);

    const transcoder = spawnRadioTranscoder(streamUrl);
    const child = transcoder.process;
    session.ffmpeg = child;
    child.once("error", (error) => {
      console.error(`[radio:${session.guildId}] FFmpeg could not start:`, error.message);
      this.scheduleRestart(session, "FFmpeg could not start");
    });
    child.once("close", (code, signal) => {
      if (session.ffmpeg !== child) return;
      delete session.ffmpeg;
      if (session.stopped || this.sessions.get(session.guildId) !== session) return;
      const diagnostics = transcoder.getDiagnostics();
      console.error(
        `[radio:${session.guildId}] ${session.station.name} FFmpeg exited ` +
        `(code=${String(code)}, signal=${signal ?? "none"}).` +
        (diagnostics ? `\n${diagnostics}` : " No FFmpeg diagnostics were produced."),
      );
    });

    session.player.play(createAudioResource(child.stdout, {
      inputType: StreamType.OggOpus,
      metadata: { stationId: session.station.id },
    }));
  }

  private stopFfmpeg(session: RadioSession): void {
    const child = session.ffmpeg;
    delete session.ffmpeg;
    if (child && !child.killed) child.kill("SIGKILL");
  }
}
