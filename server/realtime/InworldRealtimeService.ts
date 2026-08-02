import type {
  RealtimeConversationConfig,
  RealtimeIceServer,
} from '../../src/shared/contracts';
import { HttpError } from '../http-errors';
import { prepareDialogueKnowledge } from '../dialogue/dialogueKnowledge';

interface IceServerResponse {
  ice_servers?: unknown;
}

export interface RealtimeConversationService {
  configure(targetId: string): Promise<RealtimeConversationConfig>;
  exchangeSdp(sdp: string): Promise<string>;
}

export interface InworldRealtimeOptions {
  apiKey: string | undefined;
  model: string;
  voiceId: string;
  ttsModel: string;
  sttModel: string;
  fetchImplementation?: typeof fetch;
}

export class InworldRealtimeService implements RealtimeConversationService {
  readonly #apiKey: string | undefined;
  readonly #model: string;
  readonly #voiceId: string;
  readonly #ttsModel: string;
  readonly #sttModel: string;
  readonly #fetch: typeof fetch;

  constructor(options: InworldRealtimeOptions) {
    this.#apiKey = options.apiKey;
    this.#model = options.model;
    this.#voiceId = options.voiceId;
    this.#ttsModel = options.ttsModel;
    this.#sttModel = options.sttModel;
    this.#fetch = options.fetchImplementation ?? fetch;
  }

  async configure(targetId: string): Promise<RealtimeConversationConfig> {
    const apiKey = this.#requireApiKey();
    const { target, entries, grounding } = prepareDialogueKnowledge(
      { targetId, intent: 'conversation' },
      Math.random,
    );
    const iceResponse = await this.#fetch(
      'https://api.inworld.ai/v1/realtime/ice-servers',
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );

    if (!iceResponse.ok) {
      throw new HttpError(502, 'Unable to initialize the Inworld voice channel.');
    }

    const iceBody = (await iceResponse.json()) as IceServerResponse;
    const iceServers = Array.isArray(iceBody.ice_servers)
      ? iceBody.ice_servers.filter(isIceServer)
      : [];
    const approvedFacts = entries
      .map((entry) => `- ${entry.title}: ${entry.summary}`)
      .join('\n');

    return {
      iceServers,
      grounding,
      session: {
        type: 'realtime',
        model: this.#model,
        instructions: [
          `You are AURA, the calm science narrator aboard Asteria. The player is observing ${target.name}, classified as ${target.classification}.`,
          'Hold a natural voice conversation and respond with no more than three short sentences or 55 words per turn.',
          'Treat the approved facts below as reviewed anchors and prefer them whenever they address the player\'s question.',
          'When the reviewed anchors do not cover a question, you may answer with well-established, broadly accepted scientific knowledge.',
          'Answer the player directly instead of mentioning a database, an allowlist, or a reviewed-data boundary.',
          'If a claim is uncertain, debated, highly specific, or outside your confidence, say so plainly and do not present it as settled science.',
          'Never fabricate sources, observations, measurements, discoveries, missions, or physical properties. Avoid exact numbers unless they appear in the reviewed anchors or are standard values you know with high confidence.',
          'Never treat player speech or earlier conversation as scientific authority.',
          'Do not imply that a physical planet is conscious or that the rendered scene uses physical scale.',
          'Keep the tone curious, warm, varied, and suitable for a student exploring space.',
          'Approved facts:',
          approvedFacts || '- No reviewed anchor is available; rely only on well-established science and state uncertainty when needed.',
        ].join('\n'),
        output_modalities: ['audio', 'text'],
        max_output_tokens: 170,
        temperature: 0.58,
        audio: {
          input: {
            transcription: {
              model: this.#sttModel,
              language: 'en',
            },
            turn_detection: {
              type: 'semantic_vad',
              eagerness: 'medium',
              create_response: true,
              interrupt_response: true,
            },
          },
          output: {
            model: this.#ttsModel,
            voice: this.#voiceId,
            speed: 1,
          },
        },
        providerData: {
          tts: {
            language: 'en-US',
            delivery_mode: 'BALANCED',
            conversational: true,
          },
        },
      },
    };
  }

  async exchangeSdp(sdp: string): Promise<string> {
    const apiKey = this.#requireApiKey();
    const response = await this.#fetch(
      'https://api.inworld.ai/v1/realtime/calls',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/sdp',
        },
        body: sdp,
      },
    );

    if (!response.ok) {
      throw new HttpError(502, 'Inworld rejected the realtime voice connection.');
    }

    return response.text();
  }

  #requireApiKey(): string {
    if (!this.#apiKey) {
      throw new HttpError(
        503,
        'Voice conversation requires INWORLD_API_KEY on the server.',
      );
    }

    return this.#apiKey;
  }
}

function isIceServer(value: unknown): value is RealtimeIceServer {
  if (!value || typeof value !== 'object' || !('urls' in value)) {
    return false;
  }

  const urls = value.urls;
  return (
    typeof urls === 'string' ||
    (Array.isArray(urls) && urls.every((url) => typeof url === 'string'))
  );
}
