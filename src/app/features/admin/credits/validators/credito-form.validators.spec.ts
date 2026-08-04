import { FormControl, FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  INTEGER_PLAZO_PATTERN,
  decimalValidator,
  montoRangeValidator,
  positiveDecimalValidator,
} from './credito-form.validators';

describe('decimalValidator', () => {
  const validator = decimalValidator(10);

  it('returns null for an empty value (delegated to Validators.required)', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('returns null for a valid decimal', () => {
    expect(validator(new FormControl('1000.00'))).toBeNull();
  });

  it('returns decimalFormat for more than 2 decimal places', () => {
    expect(validator(new FormControl('1000.999'))).toEqual({ decimalFormat: true });
  });

  it('returns decimalFormat for a negative value', () => {
    expect(validator(new FormControl('-1000'))).toEqual({ decimalFormat: true });
  });
});

describe('positiveDecimalValidator', () => {
  const validator = positiveDecimalValidator(10);

  it('returns null for an empty value', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('returns null for a positive value', () => {
    expect(validator(new FormControl('0.01'))).toBeNull();
  });

  it('returns mustBePositive for zero', () => {
    expect(validator(new FormControl('0.00'))).toEqual({ mustBePositive: true });
  });

  it('defers to decimalValidator for a malformed value (no double-reporting)', () => {
    expect(validator(new FormControl('not-a-number'))).toBeNull();
  });
});

describe('INTEGER_PLAZO_PATTERN', () => {
  it.each(['1', '12', '360'])('accepts %s', (value) => {
    expect(INTEGER_PLAZO_PATTERN.test(value)).toBe(true);
  });

  it.each(['0', '-1', '1.5', '01', 'abc', ''])('rejects %s', (value) => {
    expect(INTEGER_PLAZO_PATTERN.test(value)).toBe(false);
  });
});

describe('montoRangeValidator', () => {
  function group(monto_minimo: string, monto_maximo: string): FormGroup {
    return TestBed.inject(NonNullableFormBuilder).group({ monto_minimo, monto_maximo });
  }

  it('returns null when monto_maximo > monto_minimo', () => {
    expect(montoRangeValidator(group('1000.00', '20000.00'))).toBeNull();
  });

  it('returns null when monto_maximo === monto_minimo', () => {
    expect(montoRangeValidator(group('1000.00', '1000.00'))).toBeNull();
  });

  it('returns montoRange when monto_maximo < monto_minimo', () => {
    expect(montoRangeValidator(group('20000.00', '1000.00'))).toEqual({ montoRange: true });
  });

  it('returns null while either field is empty or malformed (let field validators report first)', () => {
    expect(montoRangeValidator(group('', '20000.00'))).toBeNull();
    expect(montoRangeValidator(group('1000.00', ''))).toBeNull();
    expect(montoRangeValidator(group('abc', '20000.00'))).toBeNull();
  });
});
