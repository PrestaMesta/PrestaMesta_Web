/**
 * Builds the API v1 base URL from a configured origin. Mirrors the sibling Flutter app's
 * `api_client.dart` convention: the configured value is the origin only (no path), and `/api/v1`
 * is appended exactly once here — never inlined as a string literal inside individual services.
 * Returns an empty string when no origin is configured, so callers can treat "unconfigured" as a
 * distinct, safely-degraded state instead of guessing at a fallback host.
 */
export function resolveApiV1BaseUrl(origin: string): string {
  const trimmed = origin.trim().replace(/\/+$/, '');
  return trimmed.length > 0 ? `${trimmed}/api/v1` : '';
}
