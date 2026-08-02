import { describe, expect, it } from 'vitest';
import { RealtimeVoiceRelay } from '../server/realtime/RealtimeVoiceRelay';

class FakeSocket {
  sent: string[] = [];
  closed = false;
  readonly #listeners = new Map<string, Array<(...args: unknown[]) => void>>();

  on(event: string, listener: (...args: unknown[]) => void): void {
    const listeners = this.#listeners.get(event) ?? [];
    listeners.push(listener);
    this.#listeners.set(event, listeners);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.#emit('close');
  }

  emitMessage(data: string): void {
    this.#emit('message', data);
  }

  #emit(event: string, ...args: unknown[]): void {
    for (const listener of this.#listeners.get(event) ?? []) {
      listener(...args);
    }
  }
}

describe('RealtimeVoiceRelay', () => {
  const config = {
    model: 'google-ai-studio/gemini-2.5-flash-lite',
    voice: 'default-ykfyhnvuymspwpqixkv0aa__neil',
    instructions: 'Be an energetic science buddy.',
  };

  it('sends session.update upstream exactly once, right after session.created', () => {
    const client = new FakeSocket();
    const upstream = new FakeSocket();
    new RealtimeVoiceRelay(client, upstream, config);

    upstream.emitMessage(JSON.stringify({ type: 'session.created' }));

    const updates = upstream.sent
      .map((raw) => JSON.parse(raw) as { type: string; session?: Record<string, unknown> })
      .filter((message) => message.type === 'session.update');

    expect(updates).toHaveLength(1);
    expect(updates[0]?.session).toMatchObject({
      model: config.model,
      instructions: config.instructions,
      audio: { output: { voice: config.voice } },
    });
  });

  it('forwards upstream messages to the client verbatim', () => {
    const client = new FakeSocket();
    const upstream = new FakeSocket();
    new RealtimeVoiceRelay(client, upstream, config);

    const payload = JSON.stringify({ type: 'response.output_audio.delta', delta: 'abc' });
    upstream.emitMessage(payload);

    expect(client.sent).toContain(payload);
  });

  it('forwards client messages upstream verbatim, except it drops session.update', () => {
    const client = new FakeSocket();
    const upstream = new FakeSocket();
    new RealtimeVoiceRelay(client, upstream, config);

    const audioChunk = JSON.stringify({ type: 'input_audio_buffer.append', audio: 'xyz' });
    client.emitMessage(audioChunk);
    client.emitMessage(JSON.stringify({ type: 'session.update', session: { model: 'nope' } }));

    expect(upstream.sent).toEqual([audioChunk]);
  });

  it('closes the upstream socket when the client disconnects, and vice versa', () => {
    const client = new FakeSocket();
    const upstream = new FakeSocket();
    new RealtimeVoiceRelay(client, upstream, config);

    client.close();

    expect(upstream.closed).toBe(true);
  });

  it('strips session.updated down to just {type} before forwarding to the client', () => {
    const client = new FakeSocket();
    const upstream = new FakeSocket();
    new RealtimeVoiceRelay(client, upstream, config);

    upstream.emitMessage(
      JSON.stringify({
        type: 'session.updated',
        session: { instructions: 'SECRET SYSTEM PROMPT', model: 'some-model' },
      }),
    );

    expect(client.sent).toEqual([JSON.stringify({ type: 'session.updated' })]);
    const parsed = JSON.parse(client.sent[0]!) as Record<string, unknown>;
    expect(Object.keys(parsed)).toEqual(['type']);
    expect(JSON.stringify(parsed)).not.toContain('instructions');
    expect(JSON.stringify(parsed)).not.toContain('model');
    expect(JSON.stringify(parsed)).not.toContain('SECRET SYSTEM PROMPT');
  });

  it('drops a malformed (non-JSON) message from upstream without throwing or forwarding it', () => {
    const client = new FakeSocket();
    const upstream = new FakeSocket();
    new RealtimeVoiceRelay(client, upstream, config);

    expect(() => upstream.emitMessage('not valid json{')).not.toThrow();
    expect(client.sent).not.toContain('not valid json{');
    expect(client.sent).toHaveLength(0);
  });

  it('drops a malformed (non-JSON) message from the client without throwing or forwarding it upstream', () => {
    const client = new FakeSocket();
    const upstream = new FakeSocket();
    new RealtimeVoiceRelay(client, upstream, config);

    expect(() => client.emitMessage('not valid json{')).not.toThrow();
    expect(upstream.sent).not.toContain('not valid json{');
    expect(upstream.sent).toHaveLength(0);
  });
});
