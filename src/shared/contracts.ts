export type DialogueIntent = 'arrival' | 'fact' | 'conversation';

export interface DialogueTurn {
  role: 'player' | 'aura';
  text: string;
}

export interface DialogueRequest {
  targetId: string;
  questId?: string;
  playerMessage?: string;
  intent?: DialogueIntent;
  excludedKnowledgeIds?: string[];
  history?: DialogueTurn[];
}

export interface GroundingReference {
  knowledgeId: string;
  title: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface DialogueResponse {
  speakerId: string;
  speakerName: string;
  text: string;
  voiceId: string;
  grounding: GroundingReference[];
}

export interface SpeechRequest {
  text: string;
  voiceId: string;
}

export interface ApiErrorResponse {
  error: string;
}
