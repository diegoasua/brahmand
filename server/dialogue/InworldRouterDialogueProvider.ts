import { celestialBodies } from '../../src/content/celestial-bodies';
import { knowledgeById } from '../../src/content/knowledge';
import { auraNarrator } from '../../src/content/narrator';
import type {
  DialogueRequest,
  DialogueResponse,
  GroundingReference,
} from '../../src/shared/contracts';
import { HttpError } from '../http-errors';
import type { DialogueProvider } from './DialogueProvider';

interface RouterChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export interface InworldRouterDialogueOptions {
  apiKey: string;
  model: string;
  voiceId: string;
  fetchImplementation?: typeof fetch;
}

export class InworldRouterDialogueProvider implements DialogueProvider {
  readonly #apiKey: string;
  readonly #model: string;
  readonly #voiceId: string;
  readonly #fetch: typeof fetch;

  constructor(options: InworldRouterDialogueOptions) {
    this.#apiKey = options.apiKey;
    this.#model = options.model;
    this.#voiceId = options.voiceId;
    this.#fetch = options.fetchImplementation ?? fetch;
  }

  async generate(request: DialogueRequest): Promise<DialogueResponse> {
    const target = celestialBodies.find((body) => body.id === request.targetId);
    if (!target) {
      throw new HttpError(404, `Unknown dialogue target: ${request.targetId}.`);
    }

    const entries = target.npc.knowledgeIds
      .map((id) => knowledgeById.get(id))
      .filter((entry) => entry !== undefined);
    const grounding: GroundingReference[] = entries.map((entry) => ({
      knowledgeId: entry.id,
      title: entry.title,
      sourceLabel: entry.source.label,
      sourceUrl: entry.source.url,
    }));
    const approvedFacts = entries
      .map((entry) => `- ${entry.title}: ${entry.summary}`)
      .join('\n');

    const response = await this.#fetch(
      'https://api.inworld.ai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${this.#apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.#model,
          max_tokens: 110,
          temperature: 0.72,
          messages: [
            {
              role: 'system',
              content: [
                `You are ${auraNarrator.name}, ${auraNarrator.role}`,
                'You narrate a science exploration game in natural spoken English.',
                'Generate only the line AURA should speak, with no label or quotation marks.',
                'Use no more than three short sentences and 55 words.',
                'Use only the approved science facts supplied by the user message.',
                'Do not invent measurements, discoveries, missions, or planetary properties.',
                'Do not imply that a physical planet is conscious or literally speaking.',
                'Treat rendered sizes and distances as artistic, never as physical scale.',
              ].join(' '),
            },
            {
              role: 'user',
              content: [
                `Asteria has just arrived within observation range of ${target.name}.`,
                `Target classification: ${target.kind}.`,
                request.questId ? `Current quest ID: ${request.questId}.` : '',
                request.playerMessage
                  ? `The player said: ${request.playerMessage}`
                  : 'Create a fresh arrival observation that identifies the target and teaches one approved fact.',
                'Approved facts:',
                approvedFacts || '- No reviewed scientific fact is available. Say only that more data is needed.',
              ]
                .filter(Boolean)
                .join('\n'),
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new HttpError(
        502,
        `AURA's generative channel is unavailable (Inworld ${response.status}).`,
      );
    }

    const body = (await response.json()) as RouterChatResponse;
    const text = body.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new HttpError(502, 'AURA returned an empty response.');
    }

    return {
      speakerId: auraNarrator.id,
      speakerName: auraNarrator.name,
      text,
      voiceId: this.#voiceId,
      grounding,
    };
  }
}
