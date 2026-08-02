import { createApp, createDefaultDialogueProvider } from './app';
import { serverConfig } from './config';
import { attachVoiceChatServer } from './realtime/attachVoiceChatServer';
import { AURA_REALTIME_INSTRUCTIONS } from './realtime/auraRealtimeInstructions';
import { InworldSpeechService } from './speech/InworldSpeechService';

const app = createApp({
  dialogue: createDefaultDialogueProvider({
    apiKey: serverConfig.inworldApiKey,
    model: serverConfig.inworldLlmModel,
    voiceId: serverConfig.inworldVoice,
  }),
  speech: new InworldSpeechService({
    apiKey: serverConfig.inworldApiKey,
    defaultVoice: serverConfig.inworldVoice,
    model: serverConfig.inworldTtsModel,
  }),
});

const server = app.listen(serverConfig.port);

attachVoiceChatServer(server, {
  apiKey: serverConfig.inworldApiKey,
  session: {
    model: serverConfig.inworldRealtimeModel,
    voice: serverConfig.inworldVoice,
    instructions: AURA_REALTIME_INSTRUCTIONS,
  },
});

server.on('listening', () => {
  const speechStatus = serverConfig.inworldApiKey ? 'enabled' : 'not configured';
  console.log(
    `Brahmand API listening on http://localhost:${serverConfig.port} (Inworld speech: ${speechStatus})`,
  );
});

server.on('error', (error) => {
  console.error('Unable to start Brahmand API:', error);
  process.exitCode = 1;
});
