import { geminiService } from '@/services/geminiService';
import { approximateISLGloss } from './islGrammarRules';
import { SignAssetRegistryService } from '@/modules/sign-output/SignAssetRegistry';
import { GlossToken, GlossTranslationResult } from '@/types/isl';
import { isFeatureEnabled } from '@/config/featureFlags';

export class ISLGlossEngine {
  private static instance: ISLGlossEngine;

  public static getInstance(): ISLGlossEngine {
    if (!ISLGlossEngine.instance) {
      ISLGlossEngine.instance = new ISLGlossEngine();
    }
    return ISLGlossEngine.instance;
  }

  public async translateTextToGloss(inputText: string): Promise<GlossTranslationResult> {
    const trimmed = inputText.trim();
    if (!trimmed) {
      return {
        sourceText: '',
        tokens: [],
        source: 'rule-based-fallback',
        linguisticNotes: [],
      };
    }

    let rawTokens: string[] = [];
    let notes: string[] = [];
    let source: 'gemini' | 'rule-based-fallback' = 'rule-based-fallback';

    // 1. Try Gemini if enabled and configured
    if (isFeatureEnabled('enableGemini') && geminiService.isAvailable()) {
      try {
        const geminiResult = await geminiService.translateToISLGloss(trimmed);
        rawTokens = geminiResult.gloss;
        notes = [
          'Generated via Google Gemini with ISL grammatical prompting (SOV, temporal fronting, WH-movement).',
          ...geminiResult.notes,
        ];
        source = 'gemini';
      } catch (err) {
        console.warn('Gemini translation failed or timed out, activating local rule-based fallback:', err);
        const fallback = approximateISLGloss(trimmed);
        rawTokens = fallback.tokens;
        notes = [
          'Gemini service unavailable. Fallback to local rule-based heuristic.',
          ...fallback.notes,
        ];
        source = 'rule-based-fallback';
      }
    } else {
      // 2. Local rule-based fallback
      const fallback = approximateISLGloss(trimmed);
      rawTokens = fallback.tokens;
      notes = [
        'Local rule-based ISL heuristic active (Gemini API disabled or unconfigured).',
        ...fallback.notes,
      ];
      source = 'rule-based-fallback';
    }

    // 3. Resolve tokens against Sign Asset Registry and handle fingerspelling
    const finalTokens: GlossToken[] = [];

    for (let i = 0; i < rawTokens.length; i++) {
      const raw = rawTokens[i].toUpperCase().trim();
      if (!raw) continue;

      // Handle FS(...) pattern if produced by LLM
      const isExplicitFs = raw.startsWith('FS(') && raw.endsWith(')');
      const tokenName = isExplicitFs ? raw.slice(3, -1) : raw;

      const matchedAsset = SignAssetRegistryService.getAsset(tokenName);

      if (matchedAsset && !isExplicitFs) {
        finalTokens.push({
          id: `token-${i}-${tokenName}`,
          originalWord: tokenName,
          gloss: tokenName,
          matchedAsset,
          isFingerspelled: false,
        });
      } else {
        // Break into fingerspelled letter tokens
        const letters = tokenName.replace(/[^A-Z0-9]/g, '').split('');
        if (letters.length > 0) {
          for (let j = 0; j < letters.length; j++) {
            const letter = letters[j];
            const letterAsset = SignAssetRegistryService.getAsset(letter);
            finalTokens.push({
              id: `token-${i}-fs-${j}-${letter}`,
              originalWord: tokenName,
              gloss: letter,
              matchedAsset: letterAsset,
              isFingerspelled: true,
              note: j === 0 ? `Fingerspelled: ${tokenName}` : undefined,
            });
          }
        }
      }
    }

    return {
      sourceText: trimmed,
      tokens: finalTokens,
      source,
      linguisticNotes: notes,
    };
  }
}

export const islGlossEngine = ISLGlossEngine.getInstance();
