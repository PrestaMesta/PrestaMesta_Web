import { HttpContextToken } from '@angular/common/http';

/**
 * Explicit per-request opt-in for `adminAuthInterceptor` to attach the admin Bearer token.
 * Deliberately NOT inferred from the URL: some admin-protected endpoints don't live under
 * `/admin` (e.g. `POST /prestamos/creditos`), and some `/admin` endpoints are public
 * (`POST /admin/auth/login`) — so only the calling service, which knows whether the endpoint is
 * protected, can decide this correctly.
 *
 * Usage in an admin-protected service:
 * ```ts
 * this.http.get(url, { context: new HttpContext().set(ADMIN_AUTH_REQUIRED, true) });
 * ```
 */
export const ADMIN_AUTH_REQUIRED = new HttpContextToken<boolean>(() => false);
