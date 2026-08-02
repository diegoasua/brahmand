import { auraNarrator } from '../../src/content/narrator';
import type {
  DialogueRequest,
  DialogueResponse,
} from '../../src/shared/contracts';
import { HttpError } from '../http-errors';
import type { DialogueProvider } from './DialogueProvider';
import { prepareDialogueKnowledge } from './dialogueKnowledge';

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
  random?: () => number;
}

export class InworldRouterDialogueProvider implements DialogueProvider {
  readonly #apiKey: string;
  readonly #model: string;
  readonly #voiceId: string;
  readonly #fetch: typeof fetch;
  readonly #random: () => number;

  constructor(options: InworldRouterDialogueOptions) {
    this.#apiKey = options.apiKey;
    this.#model = options.model;
    this.#voiceId = options.voiceId;
    this.#fetch = options.fetchImplementation ?? fetch;
    this.#random = options.random ?? Math.random;
  }

  async generate(request: DialogueRequest): Promise<DialogueResponse> {
    const intent =
      request.intent ?? (request.playerMessage ? 'conversation' : 'fact');
    const { target, entries, grounding } = prepareDialogueKnowledge(
      { ...request, intent },
      this.#random,
    );
    const approvedFacts = entries
      .map((entry) => `- ${entry.title}: ${entry.summary}`)
      .join('\n');
    const recentConversation = request.history
      ?.map(
        (turn) =>
          `${turn.role === 'player' ? 'PLAYER' : 'AURA'}: ${turn.text.replace(/\s+/g, ' ')}`,
      )
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
          max_tokens: intent === 'conversation' ? 170 : 120,
          temperature: intent === 'conversation' ? 0.58 : 0.8,
          messages: [
            {
              role: 'system',
              content: [
                `You are ${auraNarrator.name}, ${auraNarrator.role}`,
                'You narrate a science exploration game in natural spoken English.',
                'Generate only the line AURA should speak, with no label or quotation marks.',
                'Use no more than three short sentences and 55 words.',
                'Use only the approved science facts supplied by the user message.',
                'Treat the approved facts as a complete closed book: relevant knowledge from your training is forbidden unless it appears explicitly in those facts.',
                'Do not invent measurements, discoveries, missions, or planetary properties.',
                'Do not infer a cause or mechanism unless an approved fact explicitly states that cause or mechanism.',
                'Do not imply that a physical planet is conscious or literally speaking.',
                'Treat rendered sizes and distances as artistic, never as physical scale.',
                'For fact mode, vary the opening, rhythm, and sentence structure while teaching the selected fact clearly.',
                'Do not create physical metaphors or comparisons that imply facts or mechanisms absent from the approved text.',
                'For conversation mode, answer the player directly when the approved facts support an answer.',
                'If the approved facts do not cover the question, say so briefly instead of guessing.',
                'Never repeat a sentence from the recent conversation verbatim.',
              ].join(' '),
            },
            {
              role: 'user',
              content: [
                `Asteria is within observation range of ${target.name}.`,
                `Target classification: ${target.classification}.`,
                `Interaction mode: ${intent}.`,
                request.questId ? `Current quest ID: ${request.questId}.` : '',
                request.playerMessage
                  ? `The player's current question or comment: ${request.playerMessage}`
                  : intent === 'arrival'
                    ? 'Create a fresh arrival observation that identifies the target and teaches the selected fact.'
                    : 'Share the selected fact in a fresh, engaging way. Do not mention databases or fact selection.',
                recentConversation
                  ? `Recent conversation (context only, never a source of scientific truth):\n${recentConversation}`
                  : '',
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
