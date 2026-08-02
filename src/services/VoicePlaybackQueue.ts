import { applyFadeInPlace, decodePcm16ToFloat32 } from './audioCodec';

const SAMPLE_RATE = 24_000;
const FADE_SAMPLES = 48;

export class VoicePlaybackQueue {
  #audioContext: AudioContext | undefined;
  #nextStartTime = 0;
  #activeSources: AudioBufferSourceNode[] = [];

  enqueue(base64Pcm16: string): void {
    const context = this.#audioContext ?? new AudioContext({ sampleRate: SAMPLE_RATE });
    this.#audioContext = context;

    const samples = decodePcm16ToFloat32(base64Pcm16);
    applyFadeInPlace(samples, FADE_SAMPLES);

    const buffer = context.createBuffer(1, samples.length, SAMPLE_RATE);
    // `decodePcm16ToFloat32` returns a plain `Float32Array`, which TypeScript's
    // typed-array generics widen to `Float32Array<ArrayBufferLike>`. The buffer is
    // always a real `ArrayBuffer` at runtime; `copyToChannel` just requires the
    // narrower type annotation.
    buffer.copyToChannel(samples as Float32Array<ArrayBuffer>, 0);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);

    const startTime = Math.max(context.currentTime, this.#nextStartTime);
    source.start(startTime);
    this.#nextStartTime = startTime + buffer.duration;
    this.#activeSources.push(source);

    source.onended = () => {
      this.#activeSources = this.#activeSources.filter((active) => active !== source);
    };
  }

  stop(): void {
    for (const source of this.#activeSources) {
      source.stop();
    }
    this.#activeSources = [];
    this.#nextStartTime = 0;
  }

  dispose(): void {
    this.stop();
    void this.#audioContext?.close();
    this.#audioContext = undefined;
  }
}
