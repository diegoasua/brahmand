import type { IncomingMessage, Server as HttpServer } from 'node:http';
import type { Duplex } from 'node:stream';
import WebSocket, { WebSocketServer } from 'ws';
import type { RealtimeSessionConfig } from './RealtimeVoiceRelay';
import { RealtimeVoiceRelay } from './RealtimeVoiceRelay';

const VOICE_CHAT_PATH = '/ws/voice-chat';
const INWORLD_REALTIME_URL =
  'wss://api.inworld.ai/api/v1/realtime/session?key=voice-session&protocol=realtime';

export interface VoiceChatServerOptions {
  apiKey: string | undefined;
  session: RealtimeSessionConfig;
}

export function attachVoiceChatServer(
  httpServer: HttpServer,
  options: VoiceChatServerOptions,
): void {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const { pathname } = new URL(request.url ?? '', 'http://localhost');
    if (pathname !== VOICE_CHAT_PATH) {
      return;
    }

    wss.handleUpgrade(request, socket, head, (client) => {
      wss.emit('connection', client);
    });
  });

  wss.on('connection', (client: WebSocket) => {
    client.on('error', (error) => {
      console.error('Voice chat client socket error:', error);
    });

    if (!options.apiKey) {
      client.close(1011, 'Voice chat is not configured.');
      return;
    }

    const upstream = new WebSocket(INWORLD_REALTIME_URL, {
      headers: { Authorization: `Basic ${options.apiKey}` },
    });

    upstream.once('open', () => {
      new RealtimeVoiceRelay(client, upstream, options.session);
    });

    upstream.on('error', (error) => {
      console.error('Inworld realtime connection failed:', error);
      client.close(1011, 'Voice channel unavailable.');
    });
  });
}
