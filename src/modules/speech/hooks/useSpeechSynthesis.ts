import { useState, useEffect, useCallback } from 'react';
import { speechSynthesisService } from '../SpeechSynthesisService';
import { SpeechSynthesisState, SpeechSynthesisConfig } from '../types';

export function useSpeechSynthesis() {
  const [state, setState] = useState<SpeechSynthesisState>(
    speechSynthesisService.getState()
  );

  useEffect(() => {
    const unsubscribe = speechSynthesisService.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  const speak = useCallback(
    async (text: string, options?: Partial<SpeechSynthesisConfig>) => {
      await speechSynthesisService.speak(text, options);
    },
    []
  );

  const pause = useCallback(() => {
    speechSynthesisService.pause();
  }, []);

  const resume = useCallback(() => {
    speechSynthesisService.resume();
  }, []);

  const cancel = useCallback(() => {
    speechSynthesisService.cancel();
  }, []);

  const setVoice = useCallback((voiceURI: string) => {
    speechSynthesisService.setVoice(voiceURI);
  }, []);

  const setRate = useCallback((rate: number) => {
    speechSynthesisService.setRate(rate);
  }, []);

  const setPitch = useCallback((pitch: number) => {
    speechSynthesisService.setPitch(pitch);
  }, []);

  const setVolume = useCallback((volume: number) => {
    speechSynthesisService.setVolume(volume);
  }, []);

  return {
    ...state,
    state,
    speak,
    pause,
    resume,
    cancel,
    setVoice,
    setRate,
    setPitch,
    setVolume,
  };
}
