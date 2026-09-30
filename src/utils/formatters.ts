/**
 * Normalizes text for gloss matching by stripping punctuation and uppercasing.
 */
export function normalizeGlossToken(word: string): string {
  return word.trim().replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
}

/**
 * Formats a confidence score (0 to 1) into a human readable percentage.
 */
export function formatConfidence(score: number): string {
  return `${Math.round(Math.max(0, Math.min(1, score)) * 100)}%`;
}

/**
 * Debounce helper for rate-limiting UI updates.
 */
export function debounce<T extends (...args: unknown[]) => void>(func: T, waitMs: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitMs);
  };
}
