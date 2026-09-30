import { SpeechLocaleOption, SpeechRecognitionResult } from '@/types/speech';

export type SpeechRecognitionStatus =
  | 'ready'
  | 'listening'
  | 'processing'
  | 'recognized'
  | 'blocked'
  | 'service-unavailable'
  | 'unsupported'
  | 'error';

export interface SpeechRecognitionState {
  status: SpeechRecognitionStatus;
  isListening: boolean;
  isSupported: boolean;
  hasPermission: boolean | null;
  locale: string;
  interimTranscript: string;
  finalTranscript: string;
  normalizedTranscript: string;
  confidence: number;
  errorMessage: string | null;
  lastActiveTimestamp: number;
}

export interface SpeechRecognitionConfig {
  locale: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export type SpeechSynthesisStatus =
  | 'idle'
  | 'speaking'
  | 'paused'
  | 'error'
  | 'unsupported';

export interface SpeechSynthesisVoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
  isDefault: boolean;
  isIndianEnglish: boolean;
}

export interface SpeechSynthesisState {
  status: SpeechSynthesisStatus;
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string | null;
  selectedVoiceURI: string | null;
  availableVoices: SpeechSynthesisVoiceOption[];
  rate: number;   // 0.5 to 2.0 (default: 1.0)
  pitch: number;  // 0.5 to 1.5 (default: 1.0)
  volume: number; // 0.0 to 1.0 (default: 1.0)
  errorMessage: string | null;
}

export interface SpeechSynthesisConfig {
  voiceURI?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

export type { SpeechLocaleOption, SpeechRecognitionResult };
