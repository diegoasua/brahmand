import { describe, expect, it } from 'vitest';
import {
  applyFadeInPlace,
  decodePcm16ToFloat32,
  encodeBase64Pcm16,
} from '../src/services/audioCodec';

describe('audioCodec', () => {
  it('round-trips PCM16 samples through base64 encode/decode', () => {
    const original = new Int16Array([0, 16384, -16384, 32767, -32768]);
    const encoded = encodeBase64Pcm16(original);
    const decoded = decodePcm16ToFloat32(encoded);

    expect(decoded.length).toBe(original.length);
    expect(decoded[0]).toBeCloseTo(0, 5);
    expect(decoded[1]).toBeCloseTo(0.5, 3);
    expect(decoded[2]).toBeCloseTo(-0.5, 3);
    expect(decoded[3]).toBeCloseTo(1, 3);
    expect(decoded[4]).toBeCloseTo(-1, 3);
  });

  it('ramps the first and last samples to silence and leaves the middle untouched', () => {
    const samples = new Float32Array(10).fill(1);

    applyFadeInPlace(samples, 4);

    expect(samples[0]).toBeCloseTo(0, 5);
    expect(samples[3]).toBeCloseTo(0.75, 5);
    expect(samples[4]).toBeCloseTo(1, 5);
    expect(samples[5]).toBeCloseTo(1, 5);
    expect(samples[6]).toBeCloseTo(0.75, 5);
    expect(samples[9]).toBeCloseTo(0, 5);
  });

  it('never fades more than half the buffer for short buffers', () => {
    const samples = new Float32Array(3).fill(1);

    applyFadeInPlace(samples, 48);

    expect(samples[0]).toBeCloseTo(0, 5);
    expect(samples[1]).toBeCloseTo(1, 5);
    expect(samples[2]).toBeCloseTo(0, 5);
  });
});
