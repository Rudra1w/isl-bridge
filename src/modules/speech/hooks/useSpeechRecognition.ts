import { useState, useEffect, useCallback } from 'react';
import {
  speechRecognitionService,
  SUPPORTED_LOCALES,
} from '../SpeechRecognitionService';
import { SpeechRecognitionState } from '../types';

export function useSpeechRecognition(
  onFinalCommit?: (finalText: string, normalizedText: string, confidence: number) => void
) {
  const [state, setState] = useState<SpeechRecognitionState>(
    speechRecognitionService.getState()
  );

  useEffect(() => {
    const unsubscribe = speechRecognitionService.subscribe(setState);

    if (onFinalCommit) {
      speechRecognitionService.setOnFinalListener(onFinalCommit);
    }

    return () => {
      unsubscribe();
    };
  }, [onFinalCommit]);

  const startListening = useCallback(async () => {
    await speechRecognitionService.start();
  }, []);

  const stopListening = useCallback(() => {
    speechRecognitionService.stop();
  }, []);

  const toggleListening = useCallback(() => {
    speechRecognitionService.toggle();
  }, []);

  const setLocale = useCallback((locale: string) => {
    speechRecognitionService.setLocale(locale);
  }, []);

  const clear = useCallback(() => {
    speechRecognitionService.clear();
  }, []);

  const requestPermission = useCallback(async () => {
    return speechRecognitionService.requestMicrophonePermission();
  }, []);

  return {
    ...state,
    state,
    startListening,
    stopListening,
    toggleListening,
    setLocale,
    clear,
    requestPermission,
    supportedLocales: SUPPORTED_LOCALES,
  };
}
