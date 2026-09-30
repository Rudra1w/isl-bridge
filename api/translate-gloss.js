import { GoogleGenerativeAI } from '@google/generative-ai';

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

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server.',
      hint: 'Configure GEMINI_API_KEY in your hosting environment variables.',
    });
  }

  const text = (req.body?.text || req.body?.englishText || '').trim();
  if (!text) {
    return res.status(400).json({ error: 'Missing "text" field in request body.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const prompt = `Convert this English sentence into an Indian Sign Language (ISL) gloss sequence: "${text}"`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const validatedJson = JSON.parse(responseText);

    return res.status(200).json(validatedJson);
  } catch (err) {
    console.error('[Serverless Gemini Error]', err);
    return res.status(500).json({
      error: 'Failed to process Gemini translation.',
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
