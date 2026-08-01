import { auraNarrator } from '../src/content/narrator';

function readPort(value: string | undefined): number {
  const port = Number(value ?? 8787);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('API_PORT must be an integer between 1 and 65535.');
  }

  return port;
}

export const serverConfig = {
  port: readPort(process.env.API_PORT),
  inworldApiKey: process.env.INWORLD_API_KEY?.trim() || undefined,
  inworldVoice: process.env.INWORLD_VOICE?.trim() || auraNarrator.voiceId,
  inworldTtsModel: process.env.INWORLD_TTS_MODEL?.trim() || 'inworld-tts-2',
  inworldLlmModel:
    process.env.INWORLD_LLM_MODEL?.trim() ||
    'deepinfra/deepseek-ai/DeepSeek-V4-Flash',
} as const;
