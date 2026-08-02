import { describe, expect, it } from 'vitest';
import { validateDownloadUrl } from './url.validator';

describe('validateDownloadUrl', () => {
  it('accepts a well-formed https URL', () => {
    expect(validateDownloadUrl('https://github.com/example/app.apk').valid).toBe(true);
  });

  it('rejects an empty value', () => {
    const result = validateDownloadUrl('');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('empty');
  });

  it('rejects a malformed URL', () => {
    const result = validateDownloadUrl('not a url');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('malformed');
  });

  it.each(['javascript:alert(1)', 'data:text/html,hi', 'file:///etc/passwd', 'blob:https://x/y'])(
    'rejects the %s scheme',
    (value) => {
      expect(validateDownloadUrl(value).valid).toBe(false);
    },
  );

  it('rejects plain http on a non-localhost host', () => {
    const result = validateDownloadUrl('http://example.com/app.apk');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('insecure-protocol');
  });

  it('rejects embedded credentials', () => {
    const result = validateDownloadUrl('https://user:pass@example.com/app.apk');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('embedded-credentials');
  });

  it('allows http on localhost only when allowLocalhostHttp is set', () => {
    expect(validateDownloadUrl('http://localhost:4200/app.apk').valid).toBe(false);
    expect(
      validateDownloadUrl('http://localhost:4200/app.apk', { allowLocalhostHttp: true }).valid,
    ).toBe(true);
  });

  it('rejects hosts outside an explicit allow-list', () => {
    const result = validateDownloadUrl('https://evil.example/app.apk', {
      allowedHosts: ['github.com'],
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('host-not-allowed');
  });

  it('accepts hosts inside an explicit allow-list, case-insensitively', () => {
    const result = validateDownloadUrl('https://GitHub.com/app.apk', {
      allowedHosts: ['github.com'],
    });
    expect(result.valid).toBe(true);
  });
});
