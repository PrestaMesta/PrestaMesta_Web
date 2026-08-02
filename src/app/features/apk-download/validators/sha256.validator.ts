const SHA256_PATTERN = /^[a-f0-9]{64}$/i;

/**
 * Checks that a value is exactly 64 hex characters (a well-formed SHA-256 digest), case
 * insensitively. Does not compute or verify any hash itself — no custom crypto here.
 */
export function isValidSha256(value: string): boolean {
  return SHA256_PATTERN.test(value.trim());
}

/** Normalizes a hash for display/comparison: trims whitespace and lower-cases it. */
export function normalizeSha256(value: string): string {
  return value.trim().toLowerCase();
}
