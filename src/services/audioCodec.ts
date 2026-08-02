export function encodeBase64Pcm16(samples: Int16Array): string {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < samples.length; i += 1) {
    view.setInt16(i * 2, samples[i], true);
  }

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function decodePcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const view = new DataView(bytes.buffer);
  const sampleCount = bytes.length / 2;
  const samples = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i += 1) {
    const int16 = view.getInt16(i * 2, true);
    samples[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
  }
  return samples;
}

export function applyFadeInPlace(samples: Float32Array, fadeSamples: number): void {
  const length = Math.min(fadeSamples, Math.floor(samples.length / 2));
  for (let i = 0; i < length; i += 1) {
    const gain = i / length;
    samples[i] *= gain;
    samples[samples.length - 1 - i] *= gain;
  }
}
