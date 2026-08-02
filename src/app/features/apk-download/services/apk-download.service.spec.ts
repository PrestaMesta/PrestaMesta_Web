import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppConfigService } from '../../../core/config/app-config.service';
import { AppPublicConfig, DEFAULT_APP_CONFIG } from '../../../core/config/app-config.model';
import { ApkDownloadService } from './apk-download.service';

const VALID_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

function configure(overrides: Partial<AppPublicConfig>) {
  const configSignal = signal<AppPublicConfig>({ ...DEFAULT_APP_CONFIG, ...overrides });

  TestBed.configureTestingModule({
    providers: [{ provide: AppConfigService, useValue: { config: configSignal } }],
  });

  return TestBed.inject(ApkDownloadService);
}

describe('ApkDownloadService', () => {
  it('reports unavailable when no URL is configured', () => {
    const service = configure({});
    expect(service.info().available).toBe(false);
  });

  it('reports available for a valid https URL from an allowed host', () => {
    const service = configure({
      apkDownloadUrl: 'https://github.com/example/app.apk',
      apkVersion: '1.0.0',
      apkSha256: VALID_HASH,
    });
    const info = service.info();
    expect(info.available).toBe(true);
    expect(info.version).toBe('1.0.0');
    expect(info.hashAvailable).toBe(true);
    expect(info.sha256).toBe(VALID_HASH);
  });

  it('reports unavailable for an insecure (http) URL', () => {
    const service = configure({ apkDownloadUrl: 'http://example.com/app.apk' });
    expect(service.info().available).toBe(false);
  });

  it('reports unavailable for a host outside the allow-list', () => {
    const service = configure({ apkDownloadUrl: 'https://not-allowed.example/app.apk' });
    expect(service.info().available).toBe(false);
  });

  it('allows the configured siteUrl host in addition to github.com', () => {
    const service = configure({
      apkDownloadUrl: 'https://prestamesta.example.com/app.apk',
      siteUrl: 'https://prestamesta.example.com',
    });
    expect(service.info().available).toBe(true);
  });

  it('treats an available download with an invalid hash as hashAvailable: false', () => {
    const service = configure({
      apkDownloadUrl: 'https://github.com/example/app.apk',
      apkSha256: 'too-short',
    });
    const info = service.info();
    expect(info.available).toBe(true);
    expect(info.hashAvailable).toBe(false);
    expect(info.sha256).toBe('');
  });

  describe('copyHash', () => {
    const originalClipboard = navigator.clipboard;

    afterEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
      });
    });

    it('returns false when there is no valid hash to copy', async () => {
      const service = configure({});
      expect(await service.copyHash()).toBe(false);
    });

    it('returns true and writes the hash when the clipboard API succeeds', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

      const service = configure({
        apkDownloadUrl: 'https://github.com/example/app.apk',
        apkSha256: VALID_HASH,
      });

      expect(await service.copyHash()).toBe(true);
      expect(writeText).toHaveBeenCalledWith(VALID_HASH);
    });

    it('returns false when the clipboard API rejects', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('denied'));
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

      const service = configure({
        apkDownloadUrl: 'https://github.com/example/app.apk',
        apkSha256: VALID_HASH,
      });

      expect(await service.copyHash()).toBe(false);
    });
  });
});
