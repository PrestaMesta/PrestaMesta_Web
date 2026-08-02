import { Injectable } from '@angular/core';

const SIMULATED_LATENCY_MS = 500;

/**
 * This delivery ships no configured backend endpoint for the launch-notification form (see
 * `server/` for a reference Express implementation and docs/decisions/007-form-backend.md for
 * why it isn't wired in). `submit()` therefore only simulates the round trip: it never sends the
 * email anywhere and never stores it.
 */
@Injectable({ providedIn: 'root' })
export class LaunchNotificationService {
  async submit(_email: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
  }
}
