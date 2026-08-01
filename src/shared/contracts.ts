export interface DialogueRequest {
  targetId: string;
  questId?: string;
  playerMessage?: string;
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
