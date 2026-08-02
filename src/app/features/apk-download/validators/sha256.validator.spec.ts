import { describe, expect, it } from 'vitest';
import { isValidSha256, normalizeSha256 } from './sha256.validator';

const VALID_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('isValidSha256', () => {
  it('accepts a well-formed lowercase hash', () => {
    expect(isValidSha256(VALID_HASH)).toBe(true);
  });

  it('accepts the same hash in uppercase', () => {
    expect(isValidSha256(VALID_HASH.toUpperCase())).toBe(true);
  });

  it('rejects a hash that is too short', () => {
    expect(isValidSha256(VALID_HASH.slice(0, 63))).toBe(false);
  });

  it('rejects a hash that is too long', () => {
    expect(isValidSha256(`${VALID_HASH}a`)).toBe(false);
  });

  it('rejects non-hex characters', () => {
    expect(isValidSha256(`${VALID_HASH.slice(0, 63)}z`)).toBe(false);
  });

  it('rejects a hash with internal whitespace', () => {
    const withSpace = `${VALID_HASH.slice(0, 32)} ${VALID_HASH.slice(32)}`;
    expect(isValidSha256(withSpace)).toBe(false);
  });

  it('accepts a hash with surrounding whitespace (trimmed first)', () => {
    expect(isValidSha256(`  ${VALID_HASH}  `)).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidSha256('')).toBe(false);
  });
});

describe('normalizeSha256', () => {
  it('trims and lower-cases the value', () => {
    expect(normalizeSha256(`  ${VALID_HASH.toUpperCase()}  `)).toBe(VALID_HASH);
  });
});
