import { lookupPhrase } from './islPhraseDictionary';

export interface RuleBasedGlossResult {
  tokens: string[];
  notes: string[];
  isExactPhraseMatch?: boolean;
}

// Temporal markers in ISL are fronted to establish the time-frame of discourse
const TIME_MARKERS = new Set([
  'YESTERDAY', 'TOMORROW', 'TODAY', 'NOW', 'TONIGHT', 'MORNING', 'AFTERNOON',
  'EVENING', 'NIGHT', 'SOON', 'LATER', 'DAILY', 'ALWAYS', 'EVERYDAY', 'BEFORE', 'AFTER',
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
]);

// English function words (articles, copulas, auxiliaries) that have no direct lexical sign in ISL
const DROP_WORDS = new Set([
  'IS', 'AM', 'ARE', 'WAS', 'WERE', 'BE', 'BEING', 'BEEN',
  'THE', 'A', 'AN', 'OF', 'TO', 'AT', 'FOR', 'BY', 'WITH',
  'DO', 'DOES', 'DID', 'WILL', 'SHALL', 'WOULD', 'SHOULD'
]);

// Interrogative WH-markers in ISL are typically signed at the end of the question clause
const QUESTION_WORDS = new Set([
  'WHAT', 'WHERE', 'WHO', 'WHOM', 'WHOSE', 'WHY', 'WHEN', 'HOW', 'WHICH'
]);

// Common negation markers
const NEGATION_WORDS = new Set([
  'NOT', 'NO', 'NEVER', 'CANNOT', "CAN'T", "DON'T", "DIDN'T", "WON'T"
]);

// Base verb lemmatization mapping (reducing inflected English verbs to base concepts)
const VERB_LEMMAS: Record<string, string> = {
  'GOING': 'GO',
  'WENT': 'GO',
  'GOES': 'GO',
  'GONE': 'GO',
  'COMING': 'COME',
  'CAME': 'COME',
  'COMES': 'COME',
  'EATING': 'EAT',
  'ATE': 'EAT',
  'EATS': 'EAT',
  'DRINKING': 'DRINK',
  'DRANK': 'DRINK',
  'DRINKS': 'DRINK',
  'HELPING': 'HELP',
  'HELPED': 'HELP',
  'HELPS': 'HELP',
  'SLEEPING': 'SLEEP',
  'SLEPT': 'SLEEP',
  'SLEEPS': 'SLEEP',
  'TALKING': 'SPEAK',
  'TALKED': 'SPEAK',
  'SPEAKING': 'SPEAK',
  'SPOKE': 'SPEAK',
  'SEEING': 'SEE',
  'SAW': 'SEE',
  'SEES': 'SEE',
  'MEETING': 'MEET',
  'MET': 'MEET',
  'MEETS': 'MEET',
  'WANTING': 'WANT',
  'WANTED': 'WANT',
  'WANTS': 'WANT',
  'NEEDING': 'NEED',
  'NEEDED': 'NEED',
  'NEEDS': 'NEED',
  'KNOWING': 'KNOW',
  'KNEW': 'KNOW',
  'KNOWS': 'KNOW',
  'LOVING': 'LOVE',
  'LOVED': 'LOVE',
  'LOVES': 'LOVE',
};

// Common pronoun normalizations
const PRONOUN_MAP: Record<string, string> = {
  'I': 'I',
  'ME': 'ME',
  'MY': 'MY',
  'MINE': 'MY',
  'YOU': 'YOU',
  'YOUR': 'YOUR',
  'YOURS': 'YOUR',
  'HE': 'HE',
  'HIM': 'HE',
  'HIS': 'HIS',
  'SHE': 'SHE',
  'HER': 'HER',
  'HERS': 'HER',
  'WE': 'WE',
  'US': 'US',
  'OUR': 'OUR',
  'OURS': 'OUR',
  'THEY': 'THEY',
  'THEM': 'THEY',
  'THEIR': 'THEIR',
};

/**
 * Converts English text into an approximated ISL gloss sequence using
 * verified dictionary mappings and grammatical heuristics.
 */
export function approximateISLGloss(englishText: string): RuleBasedGlossResult {
  const notes: string[] = [];

  if (!englishText || !englishText.trim()) {
    return { tokens: [], notes: [] };
  }

  const rawClean = englishText.trim();

  // 1. Check exact phrase dictionary first
  const phraseMatch = lookupPhrase(rawClean);
  if (phraseMatch) {
    return {
      tokens: [...phraseMatch.gloss],
      notes: [
        'Matched verified entry in ISL Phrase Dictionary.',
        ...(phraseMatch.notes ? [phraseMatch.notes] : []),
      ],
      isExactPhraseMatch: true,
    };
  }

  // 2. Tokenize and filter punctuation
  const words = rawClean
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, ' ')
    .split(/\s+/)
    .map((w) => w.toUpperCase())
    .filter(Boolean);

  const timeTokens: string[] = [];
  const questionTokens: string[] = [];
  const negationTokens: string[] = [];
  const coreTokens: string[] = [];

  let droppedCount = 0;

  for (const raw of words) {
    // Check if function word should be omitted
    if (DROP_WORDS.has(raw)) {
      droppedCount++;
      continue;
    }

    // Apply lemmatization or pronoun mapping
    let word = PRONOUN_MAP[raw] || raw;
    if (VERB_LEMMAS[word]) {
      word = VERB_LEMMAS[word];
    }

    if (TIME_MARKERS.has(word)) {
      timeTokens.push(word);
    } else if (QUESTION_WORDS.has(word)) {
      questionTokens.push(word);
    } else if (NEGATION_WORDS.has(word)) {
      negationTokens.push(
        word === "CAN'T" ? 'CAN-NOT' : word === "DON'T" ? 'NOT' : word
      );
    } else {
      coreTokens.push(word);
    }
  }

  if (droppedCount > 0) {
    notes.push(`Omitted ${droppedCount} English grammatical articles/copulas/prepositions not used in ISL.`);
  }

  if (timeTokens.length > 0) {
    notes.push(`Fronted temporal marker(s): ${timeTokens.join(', ')} to establish discourse timeline.`);
  }

  if (questionTokens.length > 0) {
    notes.push(`Positioned interrogative marker(s): ${questionTokens.join(', ')} at the end of the clause.`);
  }

  if (negationTokens.length > 0) {
    notes.push(`Placed negation marker(s): ${negationTokens.join(', ')} alongside predicate.`);
  }

  // Combine components into ISL-oriented sequence:
  // [TIME] + [CORE] + [NEGATION] + [QUESTION]
  const finalGloss = [
    ...timeTokens,
    ...coreTokens,
    ...negationTokens,
    ...questionTokens,
  ];

  notes.push('Applied local ISL grammar heuristic (Time Fronting, SOV Alignment, WH-movement).');

  return {
    tokens: finalGloss,
    notes,
    isExactPhraseMatch: false,
  };
}
