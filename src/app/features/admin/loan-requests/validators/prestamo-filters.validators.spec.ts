import { NonNullableFormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { POSITIVE_INTEGER_PATTERN, fechaRangeValidator } from './prestamo-filters.validators';

describe('POSITIVE_INTEGER_PATTERN', () => {
  it.each(['1', '7', '360'])('accepts %s', (value) => {
    expect(POSITIVE_INTEGER_PATTERN.test(value)).toBe(true);
  });

  it.each(['0', '-1', '1.5', '01', 'abc', ''])('rejects %s', (value) => {
    expect(POSITIVE_INTEGER_PATTERN.test(value)).toBe(false);
  });
});

describe('fechaRangeValidator', () => {
  function group(fecha_desde: string, fecha_hasta: string) {
    return TestBed.inject(NonNullableFormBuilder).group({ fecha_desde, fecha_hasta });
  }

  it('returns null when fecha_desde is before fecha_hasta', () => {
    expect(fechaRangeValidator(group('2026-01-01', '2026-01-31'))).toBeNull();
  });

  it('returns null when fecha_desde equals fecha_hasta', () => {
    expect(fechaRangeValidator(group('2026-01-01', '2026-01-01'))).toBeNull();
  });

  it('returns fechaRange when fecha_desde is after fecha_hasta', () => {
    expect(fechaRangeValidator(group('2026-01-31', '2026-01-01'))).toEqual({ fechaRange: true });
  });

  it('returns null while either date is empty (let field validators report first)', () => {
    expect(fechaRangeValidator(group('', '2026-01-31'))).toBeNull();
    expect(fechaRangeValidator(group('2026-01-01', ''))).toBeNull();
  });
});
