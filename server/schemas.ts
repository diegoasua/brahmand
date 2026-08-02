import { z } from 'zod';

export const dialogueRequestSchema = z.object({
  targetId: z.string().min(1).max(80),
  questId: z.string().min(1).max(80).optional(),
  playerMessage: z.string().trim().min(1).max(500).optional(),
  intent: z.enum(['arrival', 'fact', 'conversation']).optional(),
  excludedKnowledgeIds: z
    .array(z.string().min(1).max(100))
    .max(64)
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['player', 'aura']),
        text: z.string().trim().min(1).max(500),
      }),
    )
    .max(8)
    .optional(),
});

export const speechRequestSchema = z.object({
  text: z.string().trim().min(1).max(2_000),
  voiceId: z.string().trim().min(1).max(100),
});
