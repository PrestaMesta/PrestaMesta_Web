import { Injectable, signal } from '@angular/core';

/**
 * Placeholder consent gate for a future analytics integration. Disabled by default and never
 * sends data on its own — nothing in this app currently reads `hasConsent()` to trigger any
 * tracking. It exists only so that if analytics is added later, it is opt-in from day one rather
 * than bolted on afterwards. See docs/architecture.md for the documented extension point.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsConsentService {
  private readonly consentSignal = signal(false);

  readonly hasConsent = this.consentSignal.asReadonly();

  grantConsent(): void {
    this.consentSignal.set(true);
  }

  revokeConsent(): void {
    this.consentSignal.set(false);
  }
}
