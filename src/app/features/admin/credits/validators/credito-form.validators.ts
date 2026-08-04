import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import {
  isDecimalGreaterOrEqual,
  isDecimalString,
  isPositiveDecimalString,
} from '../utils/decimal.util';

/** Mirrors the backend's `crearCreditoSchema` format expectations (validators/prestamoValidators.js). */
export function decimalValidator(maxIntegerDigits: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }
    return isDecimalString(value, maxIntegerDigits) ? null : { decimalFormat: true };
  };
}

/** Mirrors `.positive()` on monto_minimo/monto_maximo. Assumes format is already valid — if not,
 * `decimalValidator` reports that instead so the two errors never compete for the same field. */
export function positiveDecimalValidator(maxIntegerDigits: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value || !isDecimalString(value, maxIntegerDigits)) {
      return null;
    }
    return isPositiveDecimalString(value, maxIntegerDigits) ? null : { mustBePositive: true };
  };
}

/** plazo_meses is a true integer (SMALLINT UNSIGNED, CHECK > 0) — no leading zeros, no sign. */
export const INTEGER_PLAZO_PATTERN = /^[1-9]\d*$/;

/**
 * Mirrors the backend's cross-field refine: `monto_maximo >= monto_minimo`. Attached at the
 * FormGroup level (Angular has no cross-field control validator), but the error is only surfaced
 * next to `monto_maximo` in the template — same place the backend's `path: ['monto_maximo']`
 * points to.
 */
export function montoRangeValidator(group: AbstractControl): ValidationErrors | null {
  const min = group.get('monto_minimo')?.value as string | null;
  const max = group.get('monto_maximo')?.value as string | null;

  if (!min || !max || !isDecimalString(min, 10) || !isDecimalString(max, 10)) {
    return null;
  }

  return isDecimalGreaterOrEqual(max, min) ? null : { montoRange: true };
}
