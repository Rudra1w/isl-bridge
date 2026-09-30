export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
}

export type SpeechRecognitionStatus =
  | 'ready'
  | 'listening'
  | 'processing'
  | 'recognized'
  | 'blocked'
  | 'service-unavailable'
  | 'unsupported'
  | 'error';

export interface SpeechEngineState {
  isListening: boolean;
  isSupported: boolean;
  locale: string;
  error: string | null;
  interimTranscript: string;
  finalTranscript: string;
}

export type SpeechLocaleOption = {
  code: string;
  label: string;
  regionalVariant?: string;
};

export type SpeechSynthesisStatus =
  | 'idle'
  | 'speaking'
  | 'paused'
  | 'error'
  | 'unsupported';
