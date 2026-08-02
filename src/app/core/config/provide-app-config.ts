import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { APP_CONFIG } from './app-config.token';
import { AppConfigService } from './app-config.service';

/**
 * Wires `AppConfigService` to run before the app renders (so the UI never flashes an
 * "unconfigured" state into a "configured" one) and exposes the loaded value through `APP_CONFIG`
 * for components that just want the plain, read-only config object.
 */
export function provideAppConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => inject(AppConfigService).load()),
    {
      provide: APP_CONFIG,
      useFactory: () => inject(AppConfigService).config(),
    },
  ]);
}
