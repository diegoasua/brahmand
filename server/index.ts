import { createApp, createDefaultDialogueProvider } from './app';
import { serverConfig } from './config';
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
