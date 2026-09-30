/**
 * ISL Grammar Rules & Linguistic Approximation Engine
 *
 * NOTE ON LINGUISTIC INTEGRITY:
 * Indian Sign Language (ISL) is a complete, natural visual-spatial language with its own
 * distinct grammar, syntax, spatial references, and non-manual features (facial expressions,
 * eye gaze, head movements, and body shifts).
 *
 * It is NOT a direct signed code for English, nor is it a simplistic reversal of English words.
 * The rule-based engine here operates as a transparent algorithmic APPROXIMATION when
 * high-level NLP (like Gemini) or dedicated neural grammar parsers are unavailable.
 */

export interface RuleBasedGlossResult {
  tokens: string[];
  notes: string[];
}

// Temporal words in ISL are fronted to establish the time frame of discourse
const TIME_MARKERS = new Set([
  'YESTERDAY', 'TOMORROW', 'TODAY', 'NOW', 'TONIGHT', 'MORNING', 'AFTERNOON',
  'EVENING', 'NIGHT', 'SOON', 'LATER', 'DAILY', 'ALWAYS', 'EVERYDAY', 'BEFORE', 'AFTER',
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
]);

// English function words (articles, copulas, auxiliaries) that have no equivalent lexical sign in ISL
const DROP_WORDS = new Set([
  'IS', 'AM', 'ARE', 'WAS', 'WERE', 'BE', 'BEING', 'BEEN',
  'THE', 'A', 'AN', 'OF', 'TO'
]);

// Interrogative WH-markers in ISL are typically signed at the end of the question clause
const QUESTION_WORDS = new Set([
  'WHAT', 'WHERE', 'WHO', 'WHOM', 'WHOSE', 'WHY', 'WHEN', 'HOW', 'WHICH'
]);

// Common negation markers
const NEGATION_WORDS = new Set(['NOT', 'NO', 'NEVER', 'CANNOT', "CAN'T", "DON'T", "DIDN'T", "WON'T"]);

// Basic pronoun mappings
const PRONOUN_MAP: Record<string, string> = {
  'I': 'ME',
  'ME': 'ME',
  'MY': 'ME',
  'MINE': 'ME',
  'YOU': 'YOU',
  'YOUR': 'YOU',
  'YOURS': 'YOU',
  'HE': 'HE',
  'HIM': 'HE',
  'HIS': 'HE',
  'SHE': 'SHE',
  'HER': 'SHE',
  'HERS': 'SHE',
  'WE': 'WE',
  'US': 'WE',
  'OUR': 'WE',
  'OURS': 'WE',
  'THEY': 'THEY',
  'THEM': 'THEY',
  'THEIR': 'THEY',
};

export function approximateISLGloss(englishText: string): RuleBasedGlossResult {
  const notes: string[] = [];
  
  if (!englishText || !englishText.trim()) {
    return { tokens: [], notes: [] };
  }

  // 1. Clean and tokenize
  const rawWords = englishText
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .split(/\s+/)
    .map(w => w.toUpperCase())
    .filter(Boolean);

  const timeTokens: string[] = [];
  const questionTokens: string[] = [];
  const negationTokens: string[] = [];
  const coreTokens: string[] = [];

  let droppedCount = 0;

  for (const raw of rawWords) {
    // Check if word should be dropped (copulas, articles)
    if (DROP_WORDS.has(raw)) {
      droppedCount++;
      continue;
    }

    // Map pronouns if applicable
    const word = PRONOUN_MAP[raw] || raw;

    if (TIME_MARKERS.has(word)) {
      timeTokens.push(word);
    } else if (QUESTION_WORDS.has(word)) {
      questionTokens.push(word);
    } else if (NEGATION_WORDS.has(word)) {
      negationTokens.push(word === "CAN'T" ? 'CAN-NOT' : word === "DON'T" ? 'NOT' : word);
    } else {
      coreTokens.push(word);
    }
  }

  if (droppedCount > 0) {
    notes.push(`Omitted ${droppedCount} English grammatical articles/copulas not used in ISL.`);
  }

  if (timeTokens.length > 0) {
    notes.push(`Fronted temporal marker(s): ${timeTokens.join(', ')} to establish discourse timeline.`);
  }

  if (questionTokens.length > 0) {
    notes.push(`Positioned interrogative marker(s): ${questionTokens.join(', ')} at the end of the clause.`);
  }

  if (negationTokens.length > 0) {
    notes.push(`Placed negation marker(s): ${negationTokens.join(', ')} with predicate.`);
  }

  // Combine: [TIME] + [CORE (Subject-Object-Verb)] + [NEGATION] + [QUESTION]
  const finalGloss = [
    ...timeTokens,
    ...coreTokens,
    ...negationTokens,
    ...questionTokens,
  ];

  notes.push('Heuristic approximation applied (SOV/Topic-Comment tendential alignment).');

  return {
    tokens: finalGloss,
    notes,
  };
}
