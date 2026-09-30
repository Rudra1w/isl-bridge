import { GoogleGenerativeAI } from '@google/generative-ai';
import { configManager } from '@/config/appConfig';

const SYSTEM_INSTRUCTION = `You are a certified linguistic expert in Indian Sign Language (ISL) grammar and syntax.
Your task is to convert English sentences into accurate ISL (Indian Sign Language) Gloss notation.

IMPORTANT ISL LINGUISTIC RULES:
1. ISL is NOT signed English. It is an independent visual language with its own grammar.
2. Word order is typically SOV (Subject - Object - Verb) or Topic - Comment.
3. Temporal markers (time words like YESTERDAY, TOMORROW, NOW, MORNING) always come at the VERY START of the sentence.
4. Drop English copula/auxiliary verbs (am, is, are, was, were) and articles (a, an, the) as they do not exist in ISL.
5. WH-question words (WHAT, WHERE, WHO, WHY, WHEN, HOW) come at the END of the sentence, accompanied by non-manual facial cues.
6. Negation (NOT, NO) typically accompanies or immediately follows the verb at the end.
7. Use UPPERCASE hyphenated tokens for glossing (e.g. THANK-YOU, GOOD-MORNING).
8. If a specific word has no direct sign and should be fingerspelled, represent it as FS(WORD).

RESPONSE FORMAT:
Respond strictly with a JSON object in this format:
{
  "gloss": ["TOKEN1", "TOKEN2", "TOKEN3"],
  "notes": ["Brief explanation of grammatical adjustments made"]
}`;

export interface GeminiGlossResponse {
  gloss: string[];
  notes: string[];
}

export class GeminiService {
  private static instance: GeminiService;

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public isAvailable(): boolean {
    const config = configManager.getConfig();
    return Boolean(config.features.enableGemini && config.gemini.apiKey.trim().length > 0);
  }

  public async translateToISLGloss(englishText: string): Promise<GeminiGlossResponse> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API is not configured or disabled in feature flags.');
    }

    const config = configManager.getConfig();
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({
      model: config.gemini.model || 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const prompt = `Convert the following English sentence to an accurate Indian Sign Language (ISL) gloss sequence: "${englishText}"`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed.gloss)) {
        return {
          gloss: parsed.gloss.map((g: unknown) => String(g).toUpperCase()),
          notes: Array.isArray(parsed.notes) ? parsed.notes.map(String) : [],
        };
      }
    } catch (e) {
      console.warn('Failed to parse Gemini JSON output, falling back to line extraction:', e);
    }

    // Fallback extraction if JSON parsing was malformed
    return {
      gloss: responseText.split(/\s+/).map((w) => w.toUpperCase().replace(/[^A-Z0-9-]/g, '')).filter(Boolean),
      notes: ['Parsed from raw response'],
    };
  }
}

export const geminiService = GeminiService.getInstance();
