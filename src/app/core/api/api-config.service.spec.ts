import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AppConfigService } from '../config/app-config.service';
import { DEFAULT_APP_CONFIG } from '../config/app-config.model';
import { ApiConfigService } from './api-config.service';

function configure(apiBaseUrl: string) {
  const configSignal = signal({ ...DEFAULT_APP_CONFIG, apiBaseUrl });
  TestBed.configureTestingModule({
    providers: [{ provide: AppConfigService, useValue: { config: configSignal } }],
  });
  return TestBed.inject(ApiConfigService);
}

describe('ApiConfigService', () => {
  it('is empty when no origin is configured', () => {
    expect(configure('').baseUrl()).toBe('');
  });

  it('appends /api/v1 to the configured origin', () => {
    expect(configure('https://apitest.prestamesta.fun').baseUrl()).toBe(
      'https://apitest.prestamesta.fun/api/v1',
    );
  });
});
