import { InjectionToken } from '@angular/core';
import { AppPublicConfig } from './app-config.model';

export const APP_CONFIG = new InjectionToken<AppPublicConfig>('APP_CONFIG');
