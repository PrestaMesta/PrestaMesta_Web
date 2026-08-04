import { Injectable, computed, inject } from '@angular/core';
import { AppConfigService } from '../config/app-config.service';
import { resolveApiV1BaseUrl } from './resolve-api-base-url';

/**
 * Single source of truth for the API v1 base URL. Reads the origin from the public runtime
 * config (`apiBaseUrl`, see AppConfigService) so no service ever hardcodes a backend host.
 */
@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  private readonly appConfig = inject(AppConfigService);

  readonly baseUrl = computed(() => resolveApiV1BaseUrl(this.appConfig.config().apiBaseUrl));
}
