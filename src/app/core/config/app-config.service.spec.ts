import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppConfigService } from './app-config.service';
import { DEFAULT_APP_CONFIG } from './app-config.model';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AppConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('starts with safe defaults before loading', () => {
    expect(service.config()).toEqual(DEFAULT_APP_CONFIG);
  });

  it('applies a valid response', async () => {
    const loadPromise = service.load();
    httpMock.expectOne('/config/app-config.json').flush({ apkVersion: '1.2.3' });
    await loadPromise;
    expect(service.config().apkVersion).toBe('1.2.3');
  });

  it('falls back to defaults when the response is malformed', async () => {
    const loadPromise = service.load();
    httpMock.expectOne('/config/app-config.json').flush('not-json-shaped-response');
    await loadPromise;
    expect(service.config()).toEqual(DEFAULT_APP_CONFIG);
  });

  it('falls back to defaults on an HTTP error instead of throwing', async () => {
    const loadPromise = service.load();
    httpMock
      .expectOne('/config/app-config.json')
      .flush('not found', { status: 404, statusText: 'Not Found' });
    await expect(loadPromise).resolves.toBeUndefined();
    expect(service.config()).toEqual(DEFAULT_APP_CONFIG);
  });
});
