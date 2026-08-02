import { encodeBase64Pcm16 } from './audioCodec';

const SAMPLE_RATE = 24_000;
const WORKLET_URL = '/audio/pcm-capture-processor.js';
const WORKLET_NAME = 'pcm-capture-processor';

export interface MicCaptureCallbacks {
  onChunk(base64Pcm16: string): void;
}

export class MicCapture {
  #stream: MediaStream | undefined;
  #audioContext: AudioContext | undefined;
  #sourceNode: MediaStreamAudioSourceNode | undefined;
  #workletNode: AudioWorkletNode | undefined;

  constructor(private readonly callbacks: MicCaptureCallbacks) {}

  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
    });

    let audioContext: AudioContext | undefined;
    try {
      audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
      await audioContext.audioWorklet.addModule(WORKLET_URL);

      const sourceNode = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, WORKLET_NAME);
      workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        this.callbacks.onChunk(encodeBase64Pcm16(new Int16Array(event.data)));
      };
      sourceNode.connect(workletNode);

      this.#stream = stream;
      this.#audioContext = audioContext;
      this.#sourceNode = sourceNode;
      this.#workletNode = workletNode;
    } catch (error) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      if (audioContext) {
        void audioContext.close();
      }
      throw error;
    }
  }

  stop(): void {
    this.#sourceNode?.disconnect();
    this.#workletNode?.disconnect();
    for (const track of this.#stream?.getTracks() ?? []) {
      track.stop();
    }
    void this.#audioContext?.close();
    this.#stream = undefined;
    this.#audioContext = undefined;
    this.#sourceNode = undefined;
    this.#workletNode = undefined;
  }
}
