import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { AdminSession, parseAdminSession } from '../models/admin-session.model';

/**
 * Exported so tests can target exactly this key (e.g. to prove logout only removes this one
 * entry) instead of duplicating the literal string or falling back to a blanket
 * `sessionStorage.clear()`, which would also wipe unrelated same-origin data.
 */
export const ADMIN_SESSION_STORAGE_KEY = 'prestamesta_admin_session';

/**
 * Holds the admin session in memory (Signals) and mirrors it to `sessionStorage` — never
 * `localStorage`, so the session does not outlive the browser tab. All storage access is guarded
 * by `isPlatformBrowser`: during SSR there is no `window`/`sessionStorage`, so the service simply
 * starts with no session instead of throwing.
 */
@Injectable({ providedIn: 'root' })
export class AdminSessionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly sessionSignal = signal<AdminSession | null>(this.readFromStorage());

  readonly session = this.sessionSignal.asReadonly();
  readonly admin = computed(() => this.sessionSignal()?.admin ?? null);
  readonly token = computed(() => this.sessionSignal()?.token ?? null);
  readonly isAuthenticated = computed(() => this.sessionSignal() !== null);

  set(session: AdminSession): void {
    this.sessionSignal.set(session);
    if (!this.isBrowser) {
      return;
    }
    try {
      sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // sessionStorage may be unavailable (private browsing, quota exceeded); the session still
      // works in memory for the lifetime of this page, it just won't survive a reload.
    }
  }

  clear(): void {
    this.sessionSignal.set(null);
    if (!this.isBrowser) {
      return;
    }
    try {
      sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    } catch {
      // Same rationale as above.
    }
  }

  private readFromStorage(): AdminSession | null {
    if (!this.isBrowser) {
      return null;
    }
    try {
      const raw = sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
      return raw ? parseAdminSession(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }
}
