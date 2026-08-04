import { describe, expect, it } from 'vitest';
import { CreditoFormValue } from '../models/credito.model';
import { toCreditoCreateRequestBody } from './credito-request.mapper';

const VALID_FORM_VALUE: CreditoFormValue = {
  nombre: 'Crédito Personal Express',
  monto_minimo: '1000.00',
  monto_maximo: '20000.00',
  tasa_interes_anual: '24.00',
  plazo_meses: '12',
};

describe('toCreditoCreateRequestBody', () => {
  it('converts the canonical decimal/integer strings into the exact JSON body the API expects', () => {
    expect(toCreditoCreateRequestBody(VALID_FORM_VALUE)).toEqual({
      nombre: 'Crédito Personal Express',
      monto_minimo: 1000,
      monto_maximo: 20000,
      tasa_interes_anual: 24,
      plazo_meses: 12,
    });
  });

  it('sends JSON numbers, never strings, for monto_minimo/monto_maximo/tasa_interes_anual', () => {
    const body = toCreditoCreateRequestBody(VALID_FORM_VALUE);
    expect(typeof body.monto_minimo).toBe('number');
    expect(typeof body.monto_maximo).toBe('number');
    expect(typeof body.tasa_interes_anual).toBe('number');
  });

  it('sends a JSON integer for plazo_meses', () => {
    const body = toCreditoCreateRequestBody(VALID_FORM_VALUE);
    expect(Number.isInteger(body.plazo_meses)).toBe(true);
    expect(body.plazo_meses).toBe(12);
  });

  it('preserves a value like 1000.50 exactly as 1000.5, never truncated', () => {
    const body = toCreditoCreateRequestBody({ ...VALID_FORM_VALUE, monto_minimo: '1000.50' });
    expect(body.monto_minimo).toBe(1000.5);
  });

  it('produces exactly the five contract keys — no additional properties', () => {
    const body = toCreditoCreateRequestBody(VALID_FORM_VALUE);
    expect(Object.keys(body).sort()).toEqual([
      'monto_maximo',
      'monto_minimo',
      'nombre',
      'plazo_meses',
      'tasa_interes_anual',
    ]);
  });

  it('trims the nombre field', () => {
    const body = toCreditoCreateRequestBody({ ...VALID_FORM_VALUE, nombre: '  Crédito  ' });
    expect(body.nombre).toBe('Crédito');
  });

  it.each([
    ['empty nombre', { ...VALID_FORM_VALUE, nombre: '   ' }],
    ['malformed monto_minimo', { ...VALID_FORM_VALUE, monto_minimo: 'abc' }],
    ['more than 2 decimals in monto_minimo', { ...VALID_FORM_VALUE, monto_minimo: '1000.999' }],
    ['negative monto_maximo', { ...VALID_FORM_VALUE, monto_maximo: '-20000.00' }],
    ['malformed tasa_interes_anual', { ...VALID_FORM_VALUE, tasa_interes_anual: '1e10' }],
    ['non-integer plazo_meses', { ...VALID_FORM_VALUE, plazo_meses: '12.5' }],
    ['zero plazo_meses', { ...VALID_FORM_VALUE, plazo_meses: '0' }],
    ['empty plazo_meses', { ...VALID_FORM_VALUE, plazo_meses: '' }],
  ])('throws instead of producing a body for %s', (_label, formValue) => {
    expect(() => toCreditoCreateRequestBody(formValue)).toThrow();
  });
});
