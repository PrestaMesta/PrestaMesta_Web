export interface UrlValidationOptions {
  /** Allows `http://localhost` / `http://127.0.0.1` in addition to HTTPS. */
  readonly allowLocalhostHttp?: boolean;
  /** When non-empty, the URL's hostname must exactly match one of these (case-insensitive). */
  readonly allowedHosts?: readonly string[];
}

export interface UrlValidationResult {
  readonly valid: boolean;
  readonly reason?: string;
}

const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Pure validation for a publicly configured download URL. Never throws — a malformed or
 * malicious value simply comes back `{ valid: false }` so the caller can treat the download as
 * "not available" instead of crashing or navigating somewhere unsafe.
 *
 * This intentionally allow-lists `https:` (plus `http:` on localhost during local development)
 * rather than block-listing dangerous schemes one by one — `javascript:`, `data:`, `file:` and
 * `blob:` are all rejected simply by not being `https:`.
 */
export function validateDownloadUrl(
  value: string,
  options: UrlValidationOptions = {},
): UrlValidationResult {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: 'empty' };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { valid: false, reason: 'malformed' };
  }

  if (url.username || url.password) {
    return { valid: false, reason: 'embedded-credentials' };
  }

  const isLocalhostHttp =
    url.protocol === 'http:' &&
    options.allowLocalhostHttp === true &&
    LOCALHOST_HOSTNAMES.has(url.hostname.toLowerCase());

  if (url.protocol !== 'https:' && !isLocalhostHttp) {
    return { valid: false, reason: 'insecure-protocol' };
  }

  if (options.allowedHosts && options.allowedHosts.length > 0) {
    const hostname = url.hostname.toLowerCase();
    const allowed = options.allowedHosts.some((host) => host.toLowerCase() === hostname);
    if (!allowed) {
      return { valid: false, reason: 'host-not-allowed' };
    }
  }

  return { valid: true };
}
