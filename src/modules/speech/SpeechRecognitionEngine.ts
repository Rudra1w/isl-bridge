import {
  SpeechRecognitionService,
  speechRecognitionService,
  SUPPORTED_LOCALES,
} from './SpeechRecognitionService';

// Backward compatibility exports
export { SpeechRecognitionService as SpeechRecognitionEngine };
export { speechRecognitionService as speechEngine };
export { SUPPORTED_LOCALES };
export * from './types';
