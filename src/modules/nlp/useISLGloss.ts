import { useState, useCallback } from 'react';
import { islGlossEngine } from './islGlossEngine';
import { GlossTranslationResult } from '@/types/isl';

export function useISLGloss() {
  const [result, setResult] = useState<GlossTranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const translation = await islGlossEngine.translateTextToGloss(text);
      setResult(translation);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to translate to ISL gloss';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    isLoading,
    error,
    translate,
    clear,
  };
}
