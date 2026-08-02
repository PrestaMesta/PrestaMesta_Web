import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, firstValueFrom, map, of, timeout } from 'rxjs';
import { AppPublicConfig, DEFAULT_APP_CONFIG, parseAppConfig } from './app-config.model';

const CONFIG_URL = '/config/app-config.json';
const LOAD_TIMEOUT_MS = 5000;

/**
 * Loads and validates the public runtime configuration once, at application start. If the file is
 * missing, empty, malformed, or slow to respond, the app falls back to safe defaults instead of
 * failing to render — every consumer treats an unconfigured field as "feature disabled", never as
 * an error state.
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly http = inject(HttpClient);
  private readonly configSignal = signal<AppPublicConfig>(DEFAULT_APP_CONFIG);

  readonly config = this.configSignal.asReadonly();

  async load(): Promise<void> {
    const config = await firstValueFrom(
      this.http.get<unknown>(CONFIG_URL).pipe(
        timeout(LOAD_TIMEOUT_MS),
        map((raw) => parseAppConfig(raw)),
        catchError(() => of({ ...DEFAULT_APP_CONFIG })),
      ),
    );

    this.configSignal.set(config);
  }
}
