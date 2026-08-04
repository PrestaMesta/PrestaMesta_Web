/**
 * Exact decimal-string helpers for monetary/rate fields (`monto_minimo`, `monto_maximo`,
 * `tasa_interes_anual`). These values are read from and sent to the API as strings and are never
 * parsed into a JS `number` for arithmetic — floating point cannot represent decimal fractions
 * exactly, and the backend's DECIMAL(12,2)/DECIMAL(5,2) columns demand exact precision.
 * Comparisons are done on integer "cents" derived from the string itself via BigInt, never via
 * `parseFloat`/`Number()`.
 */

/** Up to `maxIntegerDigits` digits, optionally followed by 1-2 decimal digits. No sign, no exponent. */
export function isDecimalString(value: string, maxIntegerDigits: number): boolean {
  const pattern = new RegExp(`^\\d{1,${maxIntegerDigits}}(\\.\\d{1,2})?$`);
  return pattern.test(value.trim());
}

/** Assumes `value` already passed `isDecimalString` — behavior is undefined otherwise. */
function toCents(value: string): bigint {
  const [integerPart, decimalPart = ''] = value.trim().split('.');
  const paddedDecimal = `${decimalPart}00`.slice(0, 2);
  return BigInt(integerPart) * 100n + BigInt(paddedDecimal);
}

export function isPositiveDecimalString(value: string, maxIntegerDigits: number): boolean {
  return isDecimalString(value, maxIntegerDigits) && toCents(value) > 0n;
}

/** Both `a` and `b` must already be valid decimal strings (see `isDecimalString`). */
export function isDecimalGreaterOrEqual(a: string, b: string): boolean {
  return toCents(a) >= toCents(b);
}
