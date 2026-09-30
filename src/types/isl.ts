export type SignAssetType = 'image' | 'gif' | 'video' | 'svg' | 'fingerspell';

export interface SignAsset {
  token: string;
  type: SignAssetType;
  url: string;
  durationMs?: number;
  label: string;
  description?: string;
  category?: 'alphabet' | 'number' | 'common' | 'greeting' | 'pronoun' | 'question' | 'emergency';
}

export interface GlossToken {
  id: string;
  originalWord: string;
  gloss: string;
  matchedAsset?: SignAsset;
  isFingerspelled: boolean;
  note?: string;
}

export type GlossTranslationSource = 'gemini' | 'rule-based-fallback' | 'phrase-dictionary';

export interface GlossTranslationResult {
  sourceText: string;
  tokens: GlossToken[];
  source: GlossTranslationSource;
  confidence: number;
  linguisticNotes: string[];
  isFallback: boolean;
  fallbackReason?: string;
}
