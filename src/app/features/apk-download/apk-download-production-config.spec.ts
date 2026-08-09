import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AppConfigService } from '../../core/config/app-config.service';
import { ApkDownloadService } from './services/apk-download.service';
import { validateDownloadUrl } from './validators/url.validator';

/**
 * Reads the real `public/config/app-config.json` shipped with the app (not a fixture) to lock in
 * that the Android APK is served straight from GitHub Releases: the browser downloads it directly
 * from GitHub, so no server we run (Express/SSR, Coolify, AWS) ever streams the APK bytes.
 */
const GITHUB_RELEASE_URL =
  'https://github.com/PrestaMesta/PrestaMesta_AppMovil/releases/latest/download/prestamesta.apk';

function readProductionConfig(): Record<string, unknown> {
  const raw = readFileSync(resolve(process.cwd(), 'public/config/app-config.json'), 'utf-8');
  return JSON.parse(raw) as Record<string, unknown>;
}

describe('public/config/app-config.json — apkDownloadUrl', () => {
  it('points exactly at the GitHub Releases asset', () => {
    const config = readProductionConfig();
    expect(config['apkDownloadUrl']).toBe(GITHUB_RELEASE_URL);
  });

  it('is not a local/relative path served by this app (no server-side proxying)', () => {
    const config = readProductionConfig();
    const url = config['apkDownloadUrl'] as string;
    expect(url.startsWith('/')).toBe(false);
    expect(url).not.toContain('localhost');
  });

  it('does not point at an AWS or Coolify-hosted domain', () => {
    const config = readProductionConfig();
    const url = (config['apkDownloadUrl'] as string).toLowerCase();
    expect(url).not.toMatch(/amazonaws\.com|aws\.|coolify|apitest\.prestamesta\.fun/);
  });

  it('passes the same host allow-list the app enforces at runtime (github.com is always allowed)', () => {
    const config = readProductionConfig();
    const result = validateDownloadUrl(config['apkDownloadUrl'] as string, {
      allowedHosts: ['github.com'],
    });
    expect(result.valid).toBe(true);
  });
});

describe('ApkDownloadService with the real production config', () => {
  it('offers the GitHub Releases URL as the download link, unchanged, with no proxying', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const appConfig = TestBed.inject(AppConfigService);
    const httpMock = TestBed.inject(HttpTestingController);

    const loadPromise = appConfig.load();
    httpMock.expectOne('/config/app-config.json').flush(readProductionConfig());
    await loadPromise;

    const info = TestBed.inject(ApkDownloadService).info();
    expect(info.available).toBe(true);
    expect(info.downloadUrl).toBe(GITHUB_RELEASE_URL);
  });
});
