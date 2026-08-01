import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from 'express';
import { CuratedDialogueProvider } from './dialogue/CuratedDialogueProvider';
import type { DialogueProvider } from './dialogue/DialogueProvider';
import { HttpError } from './http-errors';
import { dialogueRequestSchema, speechRequestSchema } from './schemas';
import type { SpeechService } from './speech/InworldSpeechService';

export interface AppServices {
  dialogue: DialogueProvider;
  speech: SpeechService;
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

  app.post('/api/dialogue', dialogueHandler);
  app.post('/api/speech', speechHandler);

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

export function createDefaultDialogueProvider(): DialogueProvider {
  return new CuratedDialogueProvider();
}
