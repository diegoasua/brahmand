import { describe, expect, it } from 'vitest';
import { voiceTurnTransitionForEvent } from '../src/services/VoiceConversationController';

describe('voice conversation turn lifecycle', () => {
  it('keeps the microphone active between the player turn and AURA response', () => {
    expect(
      voiceTurnTransitionForEvent('input_audio_buffer.speech_stopped'),
    ).toEqual({ state: 'thinking' });
    expect(voiceTurnTransitionForEvent('response.created')).toEqual({
      state: 'thinking',
    });
  });

  it('returns to listening on either realtime completion event', () => {
    expect(voiceTurnTransitionForEvent('output_audio_buffer.stopped')).toEqual({
      state: 'listening',
      microphoneEnabled: true,
    });
    expect(voiceTurnTransitionForEvent('response.done')).toEqual({
      state: 'listening',
      microphoneEnabled: true,
    });
  });
});
