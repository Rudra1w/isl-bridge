import { GoogleGenerativeAI } from '@google/generative-ai';
import { configManager } from '@/config/appConfig';

const SYSTEM_INSTRUCTION = `You are a certified linguistic expert in Indian Sign Language (ISL) grammar and syntax.
Your task is to convert spoken or typed English sentences into accurate ISL (Indian Sign Language) Gloss notation.

IMPORTANT ISL LINGUISTIC RULES:
1. ISL is NOT signed English. It is an independent visual language with its own grammar.
2. Word order is typically SOV (Subject - Object - Verb) or Topic - Comment.
3. Temporal markers (time words like YESTERDAY, TOMORROW, NOW, MORNING) ALWAYS come at the VERY START of the sentence.
4. Drop English copula/auxiliary verbs (am, is, are, was, were) and articles (a, an, the, of, to) as they do not exist in ISL.
5. WH-question words (WHAT, WHERE, WHO, WHY, WHEN, HOW) come at the END of the sentence clause.
6. Negation (NOT, NO, NEVER) typically accompanies or immediately follows the verb at the end.
7. Preserve numbers where necessary (e.g., "1", "2", "10", "FIVE").
8. Identify named entities or proper nouns that must be fingerspelled, formatted strictly as FS(ENTITY_NAME).
9. Avoid hallucinating unsupported or conversational English filler words.
10. Use UPPERCASE hyphenated tokens for glossing (e.g., THANK-YOU, GOOD-MORNING).

RESPONSE FORMAT:
You MUST respond strictly with a valid JSON object matching this schema:
{
  "originalText": "the input English sentence",
  "gloss": ["TOKEN1", "TOKEN2", "TOKEN3"],
  "confidence": 0.95,
  "notes": "brief linguistic explanation of grammatical ordering"
}`;

export interface GeminiGlossResponse {
  originalText: string;
  gloss: string[];
  confidence: number;
  notes: string;
}

export class GeminiService {
  private static instance: GeminiService;
  private readonly defaultTimeoutMs = 8000;
  private translationCache = new Map<string, GeminiGlossResponse>();
  private inFlightRequests = new Map<string, Promise<GeminiGlossResponse>>();

  private constructor() {}

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

  public getApiKey(): string {
    const config = configManager.getConfig();
    return config.gemini.apiKey.trim();
  }

  /**
   * Calls Google Gemini with request deduplication and in-memory caching.
   */
  public async translateToISLGloss(
    englishText: string,
    maxRetries = 1
  ): Promise<GeminiGlossResponse> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API is not configured or disabled in feature flags.');
    }

    const key = englishText.trim().toLowerCase();
    if (this.translationCache.has(key)) {
      return this.translationCache.get(key)!;
    }

    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key)!;
    }

    const executionPromise = (async () => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const res = await this.executeGeminiRequest(englishText);
          this.translationCache.set(key, res);
          return res;
        } catch (err: unknown) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(`[Gemini NLP] Attempt ${attempt + 1} failed:`, lastError.message);
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
          }
        }
      }

      throw lastError || new Error('Gemini translation failed after retries.');
    })();

    this.inFlightRequests.set(key, executionPromise);

    try {
      return await executionPromise;
    } finally {
      this.inFlightRequests.delete(key);
    }
  }

  private async executeGeminiRequest(englishText: string): Promise<GeminiGlossResponse> {
    const config = configManager.getConfig();
    const apiKey = config.gemini.apiKey.trim();

    if (!apiKey) {
      throw new Error('Missing Gemini API key.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: config.gemini.model || 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const prompt = `Convert this English sentence into an Indian Sign Language (ISL) gloss sequence: "${englishText}"`;

    // Timeout Race
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API request timed out after 8s.')), this.defaultTimeoutMs);
    });

    const apiPromise = model.generateContent(prompt).then((res) => res.response.text());

    const responseText = await Promise.race([apiPromise, timeoutPromise]);

    return this.validateAndSanitizeResponse(responseText, englishText);
  }

  /**
   * Validates the client JSON structure and sanitizes tokens.
   */
  private validateAndSanitizeResponse(
    rawJson: string,
    fallbackOriginalText: string
  ): GeminiGlossResponse {
    let parsed: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      // Try extracting JSON if surrounded by markdown code blocks
      const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Malformed JSON received from Gemini.');
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON structure: Expected an object.');
    }

    if (!Array.isArray(parsed.gloss)) {
      throw new Error('Invalid JSON structure: "gloss" property must be an array of tokens.');
    }

    // Clean tokens: uppercase, allow alphanumeric, hyphens, and FS(...)
    const cleanedGloss: string[] = [];
    for (const token of parsed.gloss) {
      if (typeof token !== 'string') continue;
      const t = token.trim().toUpperCase();
      if (!t) continue;

      if (t.startsWith('FS(') && t.endsWith(')')) {
        const entity = t.slice(3, -1).replace(/[^A-Z0-9-]/g, '');
        if (entity) cleanedGloss.push(`FS(${entity})`);
      } else {
        const cleaned = t.replace(/[^A-Z0-9-]/g, '');
        if (cleaned) cleanedGloss.push(cleaned);
      }
    }

    if (cleanedGloss.length === 0) {
      throw new Error('Gemini returned an empty gloss array.');
    }

    const confidence =
      typeof parsed.confidence === 'number' && parsed.confidence >= 0 && parsed.confidence <= 1
        ? parsed.confidence
        : 0.95;

    const notes = typeof parsed.notes === 'string' ? parsed.notes : 'Generated by Google Gemini ISL NLP model.';

    return {
      originalText: parsed.originalText || fallbackOriginalText,
      gloss: cleanedGloss,
      confidence,
      notes,
    };
  }
}

export const geminiService = GeminiService.getInstance();
