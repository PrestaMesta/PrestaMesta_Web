import { describe, expect, it } from 'vitest';
import { emailFormatValidator, isValidEmailFormat, normalizeEmail } from './email.validator';

describe('isValidEmailFormat', () => {
  it.each(['persona@example.com', 'a.b+c@sub.example.mx', 'x@y.co'])('accepts %s', (value) => {
    expect(isValidEmailFormat(value)).toBe(true);
  });

  it.each([
    '',
    'no-at-sign.com',
    'missing-domain@',
    '@missing-local.com',
    'has spaces@example.com',
  ])('rejects %s', (value) => {
    expect(isValidEmailFormat(value)).toBe(false);
  });

  it('rejects values longer than 254 characters', () => {
    const longLocal = 'a'.repeat(250);
    expect(isValidEmailFormat(`${longLocal}@example.com`)).toBe(false);
  });
});

describe('normalizeEmail', () => {
  it('trims and lower-cases the value', () => {
    expect(normalizeEmail('  Persona@Example.COM  ')).toBe('persona@example.com');
  });
});

describe('emailFormatValidator', () => {
  it('returns null for an empty value (delegated to Validators.required)', () => {
    expect(emailFormatValidator({ value: '' } as never)).toBeNull();
  });

  it('returns null for a valid email', () => {
    expect(emailFormatValidator({ value: 'demo@example.com' } as never)).toBeNull();
  });

  it('returns an emailFormat error for an invalid email', () => {
    expect(emailFormatValidator({ value: 'not-an-email' } as never)).toEqual({
      emailFormat: true,
    });
  });
});
