import { useState, useEffect, useCallback } from 'react';
import { speechEngine, SUPPORTED_LOCALES } from './SpeechRecognitionEngine';
import { SpeechEngineState } from '@/types/speech';

export function useSpeechRecognition(onFinalCommit?: (text: string) => void) {
  const [state, setState] = useState<SpeechEngineState>(speechEngine.getState());

  useEffect(() => {
    const unsubscribe = speechEngine.subscribe(setState);
    if (onFinalCommit) {
      speechEngine.setOnFinalListener(onFinalCommit);
    }
    return () => {
      unsubscribe();
    };
  }, [onFinalCommit]);

  const startListening = useCallback(() => {
    speechEngine.start();
  }, []);

  const stopListening = useCallback(() => {
    speechEngine.stop();
  }, []);

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      speechEngine.stop();
    } else {
      speechEngine.start();
    }
  }, [state.isListening]);

  const setLocale = useCallback((locale: string) => {
    speechEngine.setLocale(locale);
  }, []);

  const clear = useCallback(() => {
    speechEngine.clear();
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    setLocale,
    clear,
    supportedLocales: SUPPORTED_LOCALES,
  };
}
