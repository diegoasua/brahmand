import { describe, expect, it, vi } from 'vitest';
import { InworldRealtimeService } from '../server/realtime/InworldRealtimeService';

const serviceOptions = {
  apiKey: 'secret-test-key',
  model: 'deepinfra/deepseek-ai/DeepSeek-V4-Flash',
  voiceId: 'cloned-narrator',
  ttsModel: 'inworld-tts-2',
  sttModel: 'inworld/inworld-stt-1',
} as const;

describe('InworldRealtimeService', () => {
  it('creates a grounded voice session without exposing the API key', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ice_servers: [
            {
              urls: ['stun:stun.example.test', 'turn:turn.example.test'],
              username: 'pilot',
              credential: 'temporary-credential',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const service = new InworldRealtimeService({
      ...serviceOptions,
      fetchImplementation,
    });

    const config = await service.configure('earth');

    expect(config.iceServers).toHaveLength(1);
    expect(config.grounding).toHaveLength(3);
    expect(config.session).toMatchObject({
      model: serviceOptions.model,
      output_modalities: ['audio', 'text'],
      audio: {
        input: {
          transcription: { model: serviceOptions.sttModel },
        },
        output: {
          model: serviceOptions.ttsModel,
          voice: serviceOptions.voiceId,
        },
      },
    });
    expect(config.session.instructions).toContain('78% nitrogen');
    expect(JSON.stringify(config)).not.toContain(serviceOptions.apiKey);
    expect(fetchImplementation).toHaveBeenCalledWith(
      'https://api.inworld.ai/v1/realtime/ice-servers',
      { headers: { Authorization: `Bearer ${serviceOptions.apiKey}` } },
    );
  });

  it('proxies SDP with server-side authentication', async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(new Response('answer-sdp', { status: 200 }));
    const service = new InworldRealtimeService({
      ...serviceOptions,
      fetchImplementation,
    });

    await expect(service.exchangeSdp('offer-sdp')).resolves.toBe('answer-sdp');
    expect(fetchImplementation).toHaveBeenCalledWith(
      'https://api.inworld.ai/v1/realtime/calls',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceOptions.apiKey}`,
          'Content-Type': 'application/sdp',
        },
        body: 'offer-sdp',
      },
    );
  });

  it('rejects unknown targets before requesting ICE servers', async () => {
    const fetchImplementation = vi.fn();
    const service = new InworldRealtimeService({
      ...serviceOptions,
      fetchImplementation,
    });

    await expect(service.configure('unknown')).rejects.toMatchObject({
      status: 404,
    });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it('reports when realtime voice is not configured', async () => {
    const service = new InworldRealtimeService({
      ...serviceOptions,
      apiKey: undefined,
    });

    await expect(service.configure('earth')).rejects.toMatchObject({
      status: 503,
    });
  });
});
