import { describe, expect, it } from 'vitest';
import { DEFAULT_APP_CONFIG, parseAppConfig } from './app-config.model';

describe('parseAppConfig', () => {
  it('returns all defaults for null', () => {
    expect(parseAppConfig(null)).toEqual(DEFAULT_APP_CONFIG);
  });

  it('returns all defaults for undefined', () => {
    expect(parseAppConfig(undefined)).toEqual(DEFAULT_APP_CONFIG);
  });

  it('returns all defaults for a non-object value', () => {
    expect(parseAppConfig('not an object')).toEqual(DEFAULT_APP_CONFIG);
    expect(parseAppConfig(42)).toEqual(DEFAULT_APP_CONFIG);
  });

  it('returns all defaults for an empty object', () => {
    expect(parseAppConfig({})).toEqual(DEFAULT_APP_CONFIG);
  });

  it('accepts a fully valid config', () => {
    const raw = {
      apkDownloadUrl: 'https://github.com/example/app.apk',
      apkVersion: '1.0.0',
      apkSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      apkReleaseDate: '2026-01-01',
      apkFileSize: '10 MB',
      siteUrl: 'https://prestamesta.example.com',
      githubUrl: 'https://github.com/example/prestamesta',
      contactEmail: 'contacto@example.com',
    };
    expect(parseAppConfig(raw)).toEqual(raw);
  });

  it('falls back to defaults for missing properties, keeping the valid ones', () => {
    const result = parseAppConfig({ apkVersion: '2.0.0' });
    expect(result).toEqual({ ...DEFAULT_APP_CONFIG, apkVersion: '2.0.0' });
  });

  it('ignores non-string values for known properties', () => {
    const result = parseAppConfig({ apkVersion: 123, contactEmail: null });
    expect(result.apkVersion).toBe('');
    expect(result.contactEmail).toBe('');
  });

  it('drops unexpected properties instead of including them', () => {
    const result = parseAppConfig({ apkVersion: '1.0.0', __proto__: 'x', maliciousField: 'y' });
    expect(result).not.toHaveProperty('maliciousField');
    expect(Object.keys(result)).toEqual(Object.keys(DEFAULT_APP_CONFIG));
  });

  it('treats whitespace-only strings as not provided', () => {
    const result = parseAppConfig({ apkVersion: '   ' });
    expect(result.apkVersion).toBe('');
  });

  it('trims surrounding whitespace from valid string values', () => {
    const result = parseAppConfig({ apkVersion: '  1.0.0  ' });
    expect(result.apkVersion).toBe('1.0.0');
  });
});
