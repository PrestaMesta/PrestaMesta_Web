import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { AdminMfaFlow, MfaSiguientePaso, parseAdminMfaFlow } from '../models/admin-mfa.model';

/**
 * Exported so tests can target exactly this key, and so it's obviously distinct from
 * ADMIN_SESSION_STORAGE_KEY — the two must never collide or be read interchangeably.
 */
export const ADMIN_MFA_FLOW_STORAGE_KEY = 'prestamesta_admin_mfa_flow';

/**
 * Holds, at most, the short-lived `preMfaToken` and `siguientePaso` returned by
 * POST /admin/auth/login while an admin is mid-way through mandatory MFA (enrollment or
 * challenge). Deliberately separate from AdminSessionService: a `preMfaToken` only proves
 * "password was correct" — it is never a valid admin session, and merging the two storages
 * would risk some future caller reading `session.token()` and treating an unverified login as a
 * real one. Mirrored to sessionStorage under its own key (never `sessionStorage.clear()`, which
 * would also wipe unrelated same-origin data — see AdminSessionService for the same rule) so a
 * page refresh mid-flow doesn't force restarting the login. Guarded by `isPlatformBrowser` for
 * SSR safety, same pattern as AdminSessionService.
 */
@Injectable({ providedIn: 'root' })
export class AdminMfaFlowService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly flowSignal = signal<AdminMfaFlow | null>(this.readFromStorage());

  readonly flow = this.flowSignal.asReadonly();
  readonly preMfaToken = computed(() => this.flowSignal()?.preMfaToken ?? null);
  readonly siguientePaso = computed(() => this.flowSignal()?.siguientePaso ?? null);
  readonly hasActiveFlow = computed(() => this.flowSignal() !== null);

  /** Starts (or overwrites) the pending MFA flow — called after login, and after a backend
   * response reveals the account's real MFA state differs from what login last reported. */
  start(preMfaToken: string, siguientePaso: MfaSiguientePaso): void {
    const flow: AdminMfaFlow = { preMfaToken, siguientePaso };
    this.flowSignal.set(flow);
    if (!this.isBrowser) {
      return;
    }
    try {
      sessionStorage.setItem(ADMIN_MFA_FLOW_STORAGE_KEY, JSON.stringify(flow));
    } catch {
      // sessionStorage may be unavailable (private browsing, quota exceeded); the flow still
      // works in memory for the lifetime of this page, it just won't survive a reload.
    }
  }

  /** Called on MFA completion, explicit cancellation, logout, or TOKEN_INVALID/TOKEN_EXPIRED. */
  clear(): void {
    this.flowSignal.set(null);
    if (!this.isBrowser) {
      return;
    }
    try {
      sessionStorage.removeItem(ADMIN_MFA_FLOW_STORAGE_KEY);
    } catch {
      // Same rationale as above.
    }
  }

  private readFromStorage(): AdminMfaFlow | null {
    if (!this.isBrowser) {
      return null;
    }
    try {
      const raw = sessionStorage.getItem(ADMIN_MFA_FLOW_STORAGE_KEY);
      return raw ? parseAdminMfaFlow(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }
}
