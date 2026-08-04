import { CreditoCreateRequestBody, CreditoFormValue } from '../models/credito.model';
import { isDecimalString } from '../utils/decimal.util';
import { INTEGER_PLAZO_PATTERN } from '../validators/credito-form.validators';

// monto_minimo/monto_maximo are DECIMAL(12,2); tasa_interes_anual is DECIMAL(5,2) — see
// migrations/003_creditos.sql on the backend.
const MONTO_MAX_INTEGER_DIGITS = 10;
const TASA_MAX_INTEGER_DIGITS = 3;

/**
 * The single place a monto/tasa/plazo string becomes a JSON `number`, run only at the HTTP
 * boundary (called from `CreditoService.create()`). Each field is checked against its canonical
 * decimal/integer string format first — `Number(...)` is then a direct format-to-number cast of an
 * already-validated fixed-scale string, not a parse-and-compute step, so it never risks the
 * precision loss `parseFloat` would introduce (e.g. "1000.50" becomes exactly `1000.5`, never
 * truncated). Throws if a field isn't in its canonical form — the form's own validators
 * (credito-form.validators.ts) must guarantee that before `create()` is ever called, so reaching
 * this catch is a bug in the caller, not a user input case to recover from gracefully.
 */
export function toCreditoCreateRequestBody(form: CreditoFormValue): CreditoCreateRequestBody {
  const nombre = form.nombre.trim();
  if (nombre.length === 0) {
    throw new Error('nombre no puede estar vacío.');
  }
  if (!isDecimalString(form.monto_minimo, MONTO_MAX_INTEGER_DIGITS)) {
    throw new Error('monto_minimo no es un decimal válido.');
  }
  if (!isDecimalString(form.monto_maximo, MONTO_MAX_INTEGER_DIGITS)) {
    throw new Error('monto_maximo no es un decimal válido.');
  }
  if (!isDecimalString(form.tasa_interes_anual, TASA_MAX_INTEGER_DIGITS)) {
    throw new Error('tasa_interes_anual no es un decimal válido.');
  }
  if (!INTEGER_PLAZO_PATTERN.test(form.plazo_meses)) {
    throw new Error('plazo_meses no es un entero válido.');
  }

  return {
    nombre,
    monto_minimo: Number(form.monto_minimo),
    monto_maximo: Number(form.monto_maximo),
    tasa_interes_anual: Number(form.tasa_interes_anual),
    plazo_meses: Number.parseInt(form.plazo_meses, 10),
  };
}
