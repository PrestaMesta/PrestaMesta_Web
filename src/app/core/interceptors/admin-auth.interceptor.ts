import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { isApiErrorEnvelope } from '../api/api-error.model';
import { AdminMfaFlowService } from '../../features/admin/auth/services/admin-mfa-flow.service';
import { AdminSessionService } from '../../features/admin/auth/services/admin-session.service';
import { ADMIN_AUTH_REQUIRED } from './admin-auth.context';
import { ADMIN_PRE_MFA_REQUIRED } from './admin-pre-mfa.context';

/**
 * Attaches an `Authorization: Bearer <token>` header only to requests explicitly marked with
 * exactly one of ADMIN_AUTH_REQUIRED (full session token) or ADMIN_PRE_MFA_REQUIRED (short-lived
 * preMfaToken) — never inferred from the URL, since some admin-protected endpoints don't live
 * under `/admin` and the public login endpoint does. The two marks are mutually exclusive by
 * construction: a request is either fully authenticated or mid-MFA-flow, never both.
 *
 * On a 401 with `codigo` TOKEN_EXPIRED or TOKEN_INVALID it clears whichever credential the
 * request used (session or MFA flow) and sends the admin back to `/admin/login`; a 403
 * (authenticated but not permitted) or a 500 must NOT touch either credential, since neither of
 * those means the token itself is invalid.
 */
export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(AdminSessionService);
  const mfaFlow = inject(AdminMfaFlowService);
  const router = inject(Router);

  const requiresAdminAuth = req.context.get(ADMIN_AUTH_REQUIRED);
  const requiresPreMfa = req.context.get(ADMIN_PRE_MFA_REQUIRED);

  if (requiresAdminAuth && requiresPreMfa) {
    throw new Error(
      'ADMIN_AUTH_REQUIRED and ADMIN_PRE_MFA_REQUIRED are mutually exclusive on the same request.',
    );
  }

  const bearerToken = requiresAdminAuth
    ? session.token()
    : requiresPreMfa
      ? mfaFlow.preMfaToken()
      : null;

  const outgoing = bearerToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${bearerToken}` } })
    : req;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        const codigo = isApiErrorEnvelope(error.error) ? error.error.codigo : undefined;
        const isTokenError = codigo === 'TOKEN_EXPIRED' || codigo === 'TOKEN_INVALID';

        if (requiresAdminAuth && isTokenError) {
          session.clear();
          void router.navigate(['/admin/login'], { queryParams: { sessionExpired: '1' } });
        } else if (requiresPreMfa && isTokenError) {
          mfaFlow.clear();
          void router.navigate(['/admin/login'], { queryParams: { mfaExpired: '1' } });
        }
      }
      return throwError(() => error);
    }),
  );
};
