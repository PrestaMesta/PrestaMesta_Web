import { HttpContextToken } from '@angular/common/http';

/**
 * Explicit per-request opt-in for `adminAuthInterceptor` to attach the admin `preMfaToken`
 * (short-lived, MFA-flow-only credential from AdminMfaFlowService) as the Bearer token, instead
 * of the full session token that ADMIN_AUTH_REQUIRED attaches. Mutually exclusive with
 * ADMIN_AUTH_REQUIRED — a request cannot simultaneously need "not yet MFA-verified" and "fully
 * authenticated" credentials, and the interceptor throws if both are set on the same request.
 * Only the three MFA-flow endpoints (`mfa/enroll`, `mfa/enroll/confirm`, `mfa/verify`) ever set
 * this.
 *
 * Usage in an MFA-flow service:
 * ```ts
 * this.http.post(url, body, { context: new HttpContext().set(ADMIN_PRE_MFA_REQUIRED, true) });
 * ```
 */
export const ADMIN_PRE_MFA_REQUIRED = new HttpContextToken<boolean>(() => false);
