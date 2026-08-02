import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { provideAppConfig } from './core/config/provide-app-config';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    // Event replay is intentionally not enabled: it requires Angular's inline hydration
    // bootstrap script, which a strict `script-src 'self'` CSP (see src/server.ts) blocks by
    // design. See docs/decisions and docs/security.md for the reasoning and the trade-off.
    provideClientHydration(withNoIncrementalHydration()),
    provideHttpClient(withFetch()),
    provideAppConfig(),
  ],
};
