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

export interface RealtimeIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface RealtimeSessionConfiguration {
  type: 'realtime';
  model: string;
  instructions: string;
  output_modalities: ['audio', 'text'];
  max_output_tokens: number;
  temperature: number;
  audio: {
    input: {
      transcription: {
        model: string;
        language: string;
      };
      turn_detection: {
        type: 'semantic_vad';
        eagerness: 'medium';
        create_response: true;
        interrupt_response: true;
      };
    };
    output: {
      model: string;
      voice: string;
      speed: number;
    };
  };
  providerData: {
    tts: {
      language: string;
      delivery_mode: 'BALANCED';
      conversational: true;
    };
  };
}

export interface RealtimeConversationConfig {
  iceServers: RealtimeIceServer[];
  session: RealtimeSessionConfiguration;
  grounding: GroundingReference[];
}

export interface ApiErrorResponse {
  error: string;
}
