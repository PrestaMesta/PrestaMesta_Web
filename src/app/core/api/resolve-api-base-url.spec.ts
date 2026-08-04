import { describe, expect, it } from 'vitest';
import { resolveApiV1BaseUrl } from './resolve-api-base-url';

describe('resolveApiV1BaseUrl', () => {
  it('returns an empty string when the origin is not configured', () => {
    expect(resolveApiV1BaseUrl('')).toBe('');
    expect(resolveApiV1BaseUrl('   ')).toBe('');
  });

  it('appends /api/v1 exactly once to a bare origin', () => {
    expect(resolveApiV1BaseUrl('https://apitest.prestamesta.fun')).toBe(
      'https://apitest.prestamesta.fun/api/v1',
    );
  });

  it('strips one or more trailing slashes before appending', () => {
    expect(resolveApiV1BaseUrl('https://apitest.prestamesta.fun/')).toBe(
      'https://apitest.prestamesta.fun/api/v1',
    );
    expect(resolveApiV1BaseUrl('https://apitest.prestamesta.fun///')).toBe(
      'https://apitest.prestamesta.fun/api/v1',
    );
  });

  it('trims surrounding whitespace', () => {
    expect(resolveApiV1BaseUrl('  https://apitest.prestamesta.fun  ')).toBe(
      'https://apitest.prestamesta.fun/api/v1',
    );
  });
});
