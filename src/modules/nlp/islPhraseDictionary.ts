/**
 * ISL Phrase Dictionary & Linguistic Lexicon
 *
 * Dedicated translation dictionary containing verified English to Indian Sign Language (ISL)
 * gloss mappings. Easily expandable by linguists and contributors.
 *
 * Keys are normalized lower-case English strings without punctuation.
 * Values are arrays of standardized ISL gloss tokens in grammatical order.
 */

export interface PhraseMapping {
  gloss: string[];
  category: 'greeting' | 'query' | 'emergency' | 'courtesy' | 'daily' | 'medical';
  notes?: string;
}

export const ISL_PHRASE_DICTIONARY: Record<string, PhraseMapping> = {
  // --- Greetings & Introductions ---
  'hello': {
    gloss: ['HELLO'],
    category: 'greeting',
    notes: 'Standard single-hand open palm wave or greeting.',
  },
  'namaste': {
    gloss: ['NAMASTE'],
    category: 'greeting',
    notes: 'Dual palms pressed together in front of torso.',
  },
  'good morning': {
    gloss: ['MORNING', 'GOOD'],
    category: 'greeting',
    notes: 'Temporal marker fronted.',
  },
  'good afternoon': {
    gloss: ['AFTERNOON', 'GOOD'],
    category: 'greeting',
  },
  'good evening': {
    gloss: ['EVENING', 'GOOD'],
    category: 'greeting',
  },
  'good night': {
    gloss: ['NIGHT', 'GOOD'],
    category: 'greeting',
  },
  'how are you': {
    gloss: ['YOU', 'HOW'],
    category: 'query',
    notes: 'Question word WH-HOW placed at end.',
  },
  'what is your name': {
    gloss: ['YOUR', 'NAME', 'WHAT'],
    category: 'query',
    notes: 'Copula dropped, WH-WHAT placed at end.',
  },
  'my name is': {
    gloss: ['MY', 'NAME'],
    category: 'greeting',
    notes: 'Followed by fingerspelling of name.',
  },
  'nice to meet you': {
    gloss: ['MEET', 'YOU', 'NICE'],
    category: 'courtesy',
  },
  'welcome': {
    gloss: ['WELCOME'],
    category: 'courtesy',
  },

  // --- Courtesies & Common Responses ---
  'thank you': {
    gloss: ['THANK-YOU'],
    category: 'courtesy',
  },
  'thank you very much': {
    gloss: ['THANK-YOU'],
    category: 'courtesy',
  },
  'thanks': {
    gloss: ['THANK-YOU'],
    category: 'courtesy',
  },
  'please': {
    gloss: ['PLEASE'],
    category: 'courtesy',
  },
  'sorry': {
    gloss: ['SORRY'],
    category: 'courtesy',
  },
  'excuse me': {
    gloss: ['PLEASE', 'EXCUSE'],
    category: 'courtesy',
  },
  'yes': {
    gloss: ['YES'],
    category: 'daily',
  },
  'no': {
    gloss: ['NO'],
    category: 'daily',
  },
  'i understand': {
    gloss: ['I', 'UNDERSTAND'],
    category: 'daily',
  },
  'i do not understand': {
    gloss: ['I', 'UNDERSTAND', 'NOT'],
    category: 'daily',
    notes: 'Negation NOT placed with verb.',
  },

  // --- Common Daily Life & Activities ---
  'i am going to school tomorrow': {
    gloss: ['TOMORROW', 'I', 'GO', 'SCHOOL'],
    category: 'daily',
    notes: 'Temporal TOMORROW fronted, copula omitted, SOV structure.',
  },
  'i will go to school tomorrow': {
    gloss: ['TOMORROW', 'I', 'GO', 'SCHOOL'],
    category: 'daily',
    notes: 'Future auxiliary will dropped in favor of temporal marker.',
  },
  'see you tomorrow': {
    gloss: ['TOMORROW', 'YOU', 'MEET'],
    category: 'greeting',
  },
  'i need water please': {
    gloss: ['WATER', 'I', 'NEED', 'PLEASE'],
    category: 'daily',
  },
  'i want water': {
    gloss: ['WATER', 'I', 'WANT'],
    category: 'daily',
  },
  'i am hungry': {
    gloss: ['HUNGRY', 'I'],
    category: 'daily',
  },
  'i want food': {
    gloss: ['FOOD', 'I', 'WANT'],
    category: 'daily',
  },

  // --- Queries & Locations ---
  'where is the hospital': {
    gloss: ['HOSPITAL', 'WHERE'],
    category: 'query',
    notes: 'Topic HOSPITAL first, question word WHERE at end.',
  },
  'where is the bathroom': {
    gloss: ['BATHROOM', 'WHERE'],
    category: 'query',
  },
  'where is the toilet': {
    gloss: ['TOILET', 'WHERE'],
    category: 'query',
  },
  'where is the railway station': {
    gloss: ['TRAIN', 'STATION', 'WHERE'],
    category: 'query',
  },
  'where is the bus stop': {
    gloss: ['BUS', 'STOP', 'WHERE'],
    category: 'query',
  },
  'what time is it': {
    gloss: ['TIME', 'WHAT'],
    category: 'query',
  },
  'how much does this cost': {
    gloss: ['MONEY', 'HOW-MUCH'],
    category: 'query',
  },
  'who are you': {
    gloss: ['YOU', 'WHO'],
    category: 'query',
  },

  // --- Medical & Emergency ---
  'doctor please help me': {
    gloss: ['DOCTOR', 'HELP', 'PLEASE'],
    category: 'medical',
    notes: 'Direct imperative request.',
  },
  'i need a doctor': {
    gloss: ['DOCTOR', 'I', 'NEED'],
    category: 'medical',
  },
  'call an ambulance': {
    gloss: ['AMBULANCE', 'CALL', 'NOW'],
    category: 'emergency',
  },
  'please help me': {
    gloss: ['HELP', 'PLEASE'],
    category: 'emergency',
  },
  'help me': {
    gloss: ['HELP', 'ME'],
    category: 'emergency',
  },
  'i am in pain': {
    gloss: ['PAIN', 'I', 'HAVE'],
    category: 'medical',
  },
  'call the police': {
    gloss: ['POLICE', 'CALL', 'NOW'],
    category: 'emergency',
  },
  'danger': {
    gloss: ['DANGER'],
    category: 'emergency',
  },
};

/**
 * Searches the dictionary for exact or normalized match.
 */
export function lookupPhrase(text: string): PhraseMapping | null {
  if (!text) return null;
  const clean = text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return ISL_PHRASE_DICTIONARY[clean] || null;
}
