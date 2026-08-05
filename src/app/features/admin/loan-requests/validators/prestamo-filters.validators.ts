import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Mirrors cliente_id/credito_id in filtrosAdminPrestamoSchema: z.coerce.number().int().positive(). */
export const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

/**
 * Mirrors filtrosAdminPrestamoSchema's cross-field refine: fecha_desde <= fecha_hasta. Both
 * values are `YYYY-MM-DD` strings from `<input type="date">`, directly comparable
 * lexicographically in that format — comparing them as strings avoids constructing a `Date` (and
 * the timezone ambiguity that comes with it) for a check the backend itself does as a plain
 * string comparison, not a date computation.
 */
export function fechaRangeValidator(group: AbstractControl): ValidationErrors | null {
  const desde = group.get('fecha_desde')?.value as string | null;
  const hasta = group.get('fecha_hasta')?.value as string | null;

  if (!desde || !hasta) {
    return null;
  }

  return desde <= hasta ? null : { fechaRange: true };
}
