import { describe, expect, it, vi } from 'vitest';
import { InworldRouterDialogueProvider } from '../server/dialogue/InworldRouterDialogueProvider';

describe('InworldRouterDialogueProvider', () => {
  it('grounds a Router request and returns the configured narrator voice', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: 'Earth is in view, wrapped in a nitrogen-rich atmosphere.',
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const provider = new InworldRouterDialogueProvider({
      apiKey: 'test-key',
      model: 'deepinfra/deepseek-ai/DeepSeek-V4-Flash',
      voiceId: 'cloned-narrator',
      fetchImplementation,
      random: () => 0,
    });

    const response = await provider.generate({ targetId: 'earth' });

    expect(response).toMatchObject({
      speakerId: 'aura',
      speakerName: 'AURA',
      voiceId: 'cloned-narrator',
    });
    expect(response.grounding).toEqual([
      expect.objectContaining({ knowledgeId: 'earth-atmosphere-composition' }),
    ]);

    const [, request] = fetchImplementation.mock.calls[0] as [string, RequestInit];
    expect(request.headers).toMatchObject({ Authorization: 'Basic test-key' });
    const body = JSON.parse(String(request.body)) as {
      model: string;
      messages: Array<{ content: string }>;
    };
    expect(body.model).toBe('deepinfra/deepseek-ai/DeepSeek-V4-Flash');
    expect(body.messages[0]?.content).toContain('complete closed book');
    expect(body.messages[1]?.content).toContain("Earth's dry atmosphere");
  });

  it('rejects unknown targets without calling the Router', async () => {
    const fetchImplementation = vi.fn();
    const provider = new InworldRouterDialogueProvider({
      apiKey: 'test-key',
      model: 'deepinfra/deepseek-ai/DeepSeek-V4-Flash',
      voiceId: 'cloned-narrator',
      fetchImplementation,
      random: () => 0,
    });

    await expect(provider.generate({ targetId: 'unknown' })).rejects.toMatchObject({
      status: 404,
    });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it('passes bounded history and all approved target facts for conversation', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Its tilt carries it across many latitudes.' } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const provider = new InworldRouterDialogueProvider({
      apiKey: 'test-key',
      model: 'deepinfra/deepseek-ai/DeepSeek-V4-Flash',
      voiceId: 'cloned-narrator',
      fetchImplementation,
      random: () => 0,
    });

    const response = await provider.generate({
      targetId: 'earth-orbit-iss',
      intent: 'conversation',
      playerMessage: 'Why is the orbit tilted?',
      history: [
        { role: 'player', text: 'What is this station?' },
        { role: 'aura', text: 'It is the International Space Station.' },
      ],
    });

    expect(response.grounding).toHaveLength(4);
    const [, request] = fetchImplementation.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body)) as {
      messages: Array<{ content: string }>;
    };
    expect(body.messages[1]?.content).toContain('Interaction mode: conversation');
    expect(body.messages[1]?.content).toContain('PLAYER: What is this station?');
    expect(body.messages[1]?.content).toContain('51.6 degrees');
    expect(body.messages[0]?.content).toContain(
      'well-established, broadly accepted scientific knowledge',
    );
    expect(body.messages[0]?.content).not.toContain('complete closed book');
  });
});
