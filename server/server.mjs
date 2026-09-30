/**
 * ISL Bridge - Secure Gemini NLP Proxy Server (Optional)
 *
 * Use this lightweight proxy to keep your GEMINI_API_KEY secure on the server side
 * rather than exposing it to client-side browser network requests.
 *
 * Features:
 * - Zero new dependencies (uses native Node.js HTTP + existing @google/generative-ai)
 * - Built-in CORS support
 * - JSON schema response validation
 * - Health check endpoint
 *
 * Usage:
 *   node server/server.mjs
 *   or: GEMINI_API_KEY=your_key PORT=3001 node server/server.mjs
 */

import http from 'node:http';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PORT = parseInt(process.env.PORT || '3001', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  // Health check endpoint
  if (req.method === 'GET' && (url.pathname === '/api/health' || url.pathname === '/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'isl-bridge-gemini-proxy',
        hasApiKey: Boolean(GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 0),
        model: GEMINI_MODEL,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // NLP Gloss Translation endpoint
  if (req.method === 'POST' && url.pathname === '/api/translate-gloss') {
    if (!GEMINI_API_KEY) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'GEMINI_API_KEY is not configured on this proxy server.',
          hint: 'Set GEMINI_API_KEY in environment variables or run in client-side local fallback mode.',
        })
      );
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Guard against huge payload
      if (body.length > 50000) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large.' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body);
        const text = (parsed.text || parsed.englishText || '').trim();

        if (!text) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing "text" field in request body.' }));
          return;
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: GEMINI_MODEL,
          systemInstruction: SYSTEM_INSTRUCTION,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const prompt = `Convert this English sentence into an Indian Sign Language (ISL) gloss sequence: "${text}"`;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Validate JSON
        const validatedJson = JSON.parse(responseText);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(validatedJson));
      } catch (err) {
        console.error('[Proxy Error]', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Failed to process Gemini translation request.',
            details: err instanceof Error ? err.message : String(err),
          })
        );
      }
    });

    return;
  }

  // Not found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found', path: url.pathname }));
});

server.listen(PORT, () => {
  console.log(`[ISL Bridge Proxy] Server running on http://localhost:${PORT}`);
  console.log(`[ISL Bridge Proxy] Health check: http://localhost:${PORT}/api/health`);
  console.log(
    `[ISL Bridge Proxy] Gemini API Key configured: ${
      Boolean(GEMINI_API_KEY) ? 'YES (' + GEMINI_API_KEY.slice(0, 4) + '...)' : 'NO'
    }`
  );
});
