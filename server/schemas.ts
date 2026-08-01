import { z } from 'zod';

export const dialogueRequestSchema = z.object({
  targetId: z.string().min(1).max(80),
  questId: z.string().min(1).max(80).optional(),
  playerMessage: z.string().trim().min(1).max(500).optional(),
});

export const speechRequestSchema = z.object({
  text: z.string().trim().min(1).max(2_000),
  voiceId: z.string().trim().min(1).max(100),
});
