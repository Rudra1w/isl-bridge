import { getSignEntry, getAllSignEntries } from './signDictionary';
import { ResolvedSign, SignEntry } from './types';

/**
 * Normalizes an asset path with Vite's BASE_URL to support sub-path deployments (e.g. GitHub Pages).
 */
export function formatAssetUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const basePath = import.meta.env.BASE_URL || '/';
  const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${cleanBase}${cleanPath}`;
}

export class SignAssetResolver {
  private static instance: SignAssetResolver;

  private constructor() {}

  public static getInstance(): SignAssetResolver {
    if (!SignAssetResolver.instance) {
      SignAssetResolver.instance = new SignAssetResolver();
    }
    return SignAssetResolver.instance;
  }

  /**
   * Resolves an individual sign token to a visual representation:
   * 1. Checks local verified sign dictionary
   * 2. If not found, checks for fingerspelled entity FS(...)
   * 3. If completely missing, marks as isAvailable: false with "Sign asset unavailable"
   */
  public resolveToken(token: string, sequenceIndex = 0): ResolvedSign {
    const raw = (token || '').trim().toUpperCase();

    // 1. Handle explicit fingerspelling token: FS(NAME)
    if (raw.startsWith('FS(') && raw.endsWith(')')) {
      const entity = raw.slice(3, -1);
      return {
        id: `resolved-${sequenceIndex}-${raw}`,
        token: raw,
        label: entity,
        type: 'fingerspell',
        src: '',
        durationMs: 1400,
        isAvailable: true,
        isFingerspelled: true,
        description: `Fingerspelled name or term: ${entity}`,
        source: 'ISL Two-Hand Manual Alphabet',
        attribution: 'ISL Bridge Fingerspeller',
      };
    }

    // 2. Lookup in local sign dictionary
    const entry = getSignEntry(raw);
    if (entry) {
      return {
        id: `resolved-${sequenceIndex}-${raw}`,
        token: entry.token,
        label: entry.label,
        type: entry.type,
        src: formatAssetUrl(entry.src),
        durationMs: entry.durationMs || 1500,
        isAvailable: true,
        isFingerspelled: false,
        category: entry.category,
        description: entry.description,
        source: entry.source || 'Local ISL Library',
        license: entry.license || 'Open Access',
        attribution: entry.attribution || 'ISL Bridge',
      };
    }

    // 3. Single-character letter check (for manual alphabet fingerspelling)
    if (raw.length === 1 && /^[A-Z0-9]$/.test(raw)) {
      return {
        id: `resolved-${sequenceIndex}-char-${raw}`,
        token: raw,
        label: raw,
        type: 'fingerspell',
        src: '',
        durationMs: 1200,
        isAvailable: true,
        isFingerspelled: true,
        category: 'alphabet',
        description: `ISL manual alphabet letter ${raw}`,
        source: 'ISL Manual Alphabet',
      };
    }

    // 4. Unknown Sign Fallback (Do NOT pretend an unrelated image is the sign!)
    return {
      id: `resolved-${sequenceIndex}-unavailable-${raw}`,
      token: raw,
      label: raw,
      type: 'svg',
      src: '',
      durationMs: 1500,
      isAvailable: false,
      isFingerspelled: false,
      note: 'Sign asset unavailable',
      description: `No verified visual ISL sign found for "${raw}". Contributor asset needed.`,
      source: 'Unassigned',
    };
  }

  /**
   * Resolves an entire sequence of gloss tokens into sequential visual signs.
   */
  public resolveSequence(tokens: string[]): ResolvedSign[] {
    const results: ResolvedSign[] = [];

    tokens.forEach((token, idx) => {
      const clean = token.trim();
      if (!clean) return;

      const resolved = this.resolveToken(clean, idx);

      // If an unknown word is received and cannot be found as a whole sign,
      // optionally decompose into fingerspelling tokens so communication doesn't fail
      if (!resolved.isAvailable && clean.length > 1 && !clean.includes(' ')) {
        const letters = clean.replace(/[^A-Z0-9]/g, '').split('');
        if (letters.length > 0) {
          letters.forEach((letter, letterIdx) => {
            results.push({
              id: `resolved-${idx}-decomp-${letterIdx}-${letter}`,
              token: letter,
              label: letter,
              type: 'fingerspell',
              src: '',
              durationMs: 1000,
              isAvailable: true,
              isFingerspelled: true,
              category: 'alphabet',
              description: `Fingerspelling letter for "${clean}"`,
              note: letterIdx === 0 ? `Fingerspelled: ${clean}` : undefined,
            });
          });
          return;
        }
      }

      results.push(resolved);
    });

    return results;
  }

  /**
   * Search / filter signs in the dictionary
   */
  public search(query: string, category?: string): SignEntry[] {
    const all = this.getAll();
    const cleanQuery = (query || '').toLowerCase().trim();

    return all.filter((entry) => {
      const matchesQuery =
        !cleanQuery ||
        entry.token.toLowerCase().includes(cleanQuery) ||
        entry.label.toLowerCase().includes(cleanQuery) ||
        (entry.description && entry.description.toLowerCase().includes(cleanQuery));

      const matchesCat =
        !category || category === 'all' || entry.category === category;

      return matchesQuery && matchesCat;
    });
  }

  public getAll(): SignEntry[] {
    return getAllSignEntries().map((entry) => ({
      ...entry,
      src: formatAssetUrl(entry.src),
    }));
  }
}

export const signAssetResolver = SignAssetResolver.getInstance();
