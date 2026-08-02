import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from 'express';
import { CuratedDialogueProvider } from './dialogue/CuratedDialogueProvider';
import type { DialogueProvider } from './dialogue/DialogueProvider';
import { InworldRouterDialogueProvider } from './dialogue/InworldRouterDialogueProvider';
import { HttpError } from './http-errors';
import type { RealtimeConversationService } from './realtime/InworldRealtimeService';
import {
  dialogueRequestSchema,
  realtimeConfigQuerySchema,
  speechRequestSchema,
} from './schemas';
import type { SpeechService } from './speech/InworldSpeechService';

export interface AppServices {
  dialogue: DialogueProvider;
  speech: SpeechService;
  realtime: RealtimeConversationService;
}

export function createApp(services: AppServices) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
  });

  const dialogueHandler: RequestHandler = async (request, response) => {
    const parsed = dialogueRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid dialogue request.');
    }

    response.json(await services.dialogue.generate(parsed.data));
  };

  const speechHandler: RequestHandler = async (request, response) => {
    const parsed = speechRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid speech request.');
    }

    const audio = await services.speech.synthesize(parsed.data);
    response
      .status(200)
      .type('audio/mpeg')
      .set('Cache-Control', 'private, no-store')
      .send(Buffer.from(audio));
  };

  const realtimeConfigHandler: RequestHandler = async (request, response) => {
    const parsed = realtimeConfigQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid realtime voice target.');
    }

    response
      .set('Cache-Control', 'private, no-store')
      .json(await services.realtime.configure(parsed.data.targetId));
  };

  const realtimeCallHandler: RequestHandler = async (request, response) => {
    if (typeof request.body !== 'string' || request.body.trim().length === 0) {
      throw new HttpError(400, 'A WebRTC session description is required.');
    }

    response
      .status(200)
      .type('application/sdp')
      .set('Cache-Control', 'private, no-store')
      .send(await services.realtime.exchangeSdp(request.body));
  };

  app.post('/api/dialogue', dialogueHandler);
  app.post('/api/speech', speechHandler);
  app.get('/api/realtime/config', realtimeConfigHandler);
  app.post(
    '/api/realtime/calls',
    express.text({ type: 'application/sdp', limit: '128kb' }),
    realtimeCallHandler,
  );

  app.use((_request, _response, next) => {
    next(new HttpError(404, 'Route not found.'));
  });

  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    const status = error instanceof HttpError ? error.status : 500;
    const message =
      error instanceof HttpError ? error.message : 'Internal server error.';

    if (status >= 500 && !(error instanceof HttpError)) {
      console.error(error);
    }

    response.status(status).json({ error: message });
  };
  app.use(errorHandler);

  return app;
}

export function createDefaultDialogueProvider(options: {
  apiKey: string | undefined;
  model: string;
  voiceId: string;
}): DialogueProvider {
  return options.apiKey
    ? new InworldRouterDialogueProvider({
        apiKey: options.apiKey,
        model: options.model,
        voiceId: options.voiceId,
      })
    : new CuratedDialogueProvider();
}
