import { describe, expect, it } from 'vitest';
import { isDecimalGreaterOrEqual, isDecimalString, isPositiveDecimalString } from './decimal.util';

describe('isDecimalString', () => {
  it('accepts integers and up to 2 decimal places', () => {
    expect(isDecimalString('1000', 10)).toBe(true);
    expect(isDecimalString('1000.5', 10)).toBe(true);
    expect(isDecimalString('1000.50', 10)).toBe(true);
    expect(isDecimalString('0', 10)).toBe(true);
    expect(isDecimalString('0.00', 10)).toBe(true);
  });

  it('rejects more than 2 decimal places', () => {
    expect(isDecimalString('1000.500', 10)).toBe(false);
  });

  it('rejects more integer digits than allowed (mirrors DECIMAL(5,2) for tasa_interes_anual)', () => {
    expect(isDecimalString('999.99', 3)).toBe(true);
    expect(isDecimalString('1000.00', 3)).toBe(false);
  });

  it('rejects negative numbers, empty strings, and non-numeric input', () => {
    expect(isDecimalString('-1000', 10)).toBe(false);
    expect(isDecimalString('', 10)).toBe(false);
    expect(isDecimalString('abc', 10)).toBe(false);
    expect(isDecimalString('.50', 10)).toBe(false);
    expect(isDecimalString('1000.', 10)).toBe(false);
  });

  it('trims surrounding whitespace before matching', () => {
    expect(isDecimalString('  1000.00  ', 10)).toBe(true);
  });
});

describe('isPositiveDecimalString', () => {
  it('accepts values greater than zero', () => {
    expect(isPositiveDecimalString('0.01', 10)).toBe(true);
    expect(isPositiveDecimalString('1000.00', 10)).toBe(true);
  });

  it('rejects zero', () => {
    expect(isPositiveDecimalString('0', 10)).toBe(false);
    expect(isPositiveDecimalString('0.00', 10)).toBe(false);
  });

  it('rejects a malformed value instead of throwing', () => {
    expect(isPositiveDecimalString('not-a-number', 10)).toBe(false);
  });
});

describe('isDecimalGreaterOrEqual', () => {
  it('returns true when a > b', () => {
    expect(isDecimalGreaterOrEqual('20000.00', '1000.00')).toBe(true);
  });

  it('returns true when a === b', () => {
    expect(isDecimalGreaterOrEqual('1000.00', '1000.00')).toBe(true);
    expect(isDecimalGreaterOrEqual('1000', '1000.00')).toBe(true);
  });

  it('returns false when a < b', () => {
    expect(isDecimalGreaterOrEqual('999.99', '1000.00')).toBe(false);
  });

  it('compares exactly at scale that would lose precision as a double', () => {
    // 4000000000.10 - 4000000000.09 is not reliably representable in IEEE-754 doubles;
    // the BigInt-cents comparison must still get this right.
    expect(isDecimalGreaterOrEqual('4000000000.10', '4000000000.09')).toBe(true);
    expect(isDecimalGreaterOrEqual('4000000000.09', '4000000000.10')).toBe(false);
  });
});
