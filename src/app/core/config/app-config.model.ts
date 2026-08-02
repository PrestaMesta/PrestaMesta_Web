/**
 * Public runtime configuration for PrestaMesta_Web.
 *
 * Everything in this shape ends up readable inside the compiled Angular bundle and inside the
 * plain JSON file served from `public/config/app-config.json`. None of these fields may ever hold
 * a secret, token, or credential — a download URL, a version string, or a SHA-256 hash are public
 * information by nature, not secrets.
 */
export interface AppPublicConfig {
  readonly apkDownloadUrl: string;
  readonly apkVersion: string;
  readonly apkSha256: string;
  readonly apkReleaseDate: string;
  readonly apkFileSize: string;
  readonly siteUrl: string;
  readonly githubUrl: string;
  readonly contactEmail: string;
}

export const DEFAULT_APP_CONFIG: AppPublicConfig = {
  apkDownloadUrl: '',
  apkVersion: '',
  apkSha256: '',
  apkReleaseDate: '',
  apkFileSize: '',
  siteUrl: '',
  githubUrl: '',
  contactEmail: '',
};

const CONFIG_KEYS = Object.keys(DEFAULT_APP_CONFIG) as readonly (keyof AppPublicConfig)[];

/**
 * Pure transformation: turns an arbitrary unknown value (parsed JSON, possibly malformed,
 * partial, or `null`) into a safe, fully-defaulted `AppPublicConfig`. Never throws. Unknown
 * properties are dropped and non-string values fall back to the default for that field, so a
 * broken or tampered config file can only ever degrade the UI, never break it.
 */
export function parseAppConfig(raw: unknown): AppPublicConfig {
  if (typeof raw !== 'object' || raw === null) {
    return { ...DEFAULT_APP_CONFIG };
  }

  const source = raw as Record<string, unknown>;
  const result = { ...DEFAULT_APP_CONFIG };

  for (const key of CONFIG_KEYS) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      (result as Record<string, string>)[key] = value.trim();
    }
  }

  return result;
}
