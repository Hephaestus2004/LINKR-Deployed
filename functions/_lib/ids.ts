// functions/_lib/ids.ts
// Crockford Base32 8-character ID generator and validator adhering to 03_DATA_SCHEMA.md

// Crockford Base32 alphabet (omits I, L, O, U to prevent visual confusion and accidental profanity)
export const CROCKFORD_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';

/**
 * Normalizes an ID: converts to lowercase, replaces common visual confusions
 */
export function normalizeId(raw: string): string {
  if (!raw) return '';
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/i|l/g, '1')
    .replace(/o/g, '0');
}

/**
 * Validates if a string adheres to the 8-character Crockford Base32 ID format
 */
export function isValidId(id: string): boolean {
  return /^[0-9a-km-z]{7,10}$/i.test(id);
}

/**
 * Generates an 8-character random Crockford Base32 ID using crypto.getRandomValues
 */
export function generateRandomId(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CROCKFORD_ALPHABET[bytes[i] % CROCKFORD_ALPHABET.length];
  }
  return result;
}
