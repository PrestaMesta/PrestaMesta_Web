const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

/**
 * Mirrors the frontend's email format check (see
 * src/app/features/launch-notification/validators/email.validator.ts) so the two independent
 * validations stay intentionally simple and consistent, without sharing a build across the two
 * otherwise-separate codebases.
 */
export function isValidEmail(value) {
  if (typeof value !== 'string') {
    return false;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(trimmed);
}

/** Any non-empty value in the honeypot field means the submitter is very likely a bot. */
export function isHoneypotFilled(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
