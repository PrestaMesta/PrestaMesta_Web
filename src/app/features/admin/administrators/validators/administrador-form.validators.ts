import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Mirrors utils/passwordPolicy.js — the same policy the backend actually enforces. */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_BYTES = 72;

/**
 * bcrypt (bcryptjs included) only uses the first 72 BYTES of the password; anything past that is
 * silently ignored, so the backend rejects (never truncates) a password over that limit — measured
 * in bytes, not characters, since a multi-byte UTF-8 character (accents, emoji) can push a
 * "72-character" password over the real limit. `TextEncoder` is a universal Web API available in
 * both the browser and Node's SSR runtime, so this check works identically either way.
 */
export const passwordPolicyValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value as string | null;
  if (!value) {
    return null;
  }

  const byteLength = new TextEncoder().encode(value).length;
  const meetsPolicy =
    value.length >= PASSWORD_MIN_LENGTH &&
    byteLength <= PASSWORD_MAX_BYTES &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value);

  return meetsPolicy ? null : { passwordPolicy: true };
};
