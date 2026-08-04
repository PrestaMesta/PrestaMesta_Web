import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { isApiErrorEnvelope } from '../api/api-error.model';
import { AdminSessionService } from '../../features/admin/auth/services/admin-session.service';
import { ADMIN_AUTH_REQUIRED } from './admin-auth.context';

/**
 * Attaches `Authorization: Bearer <token>` only to requests explicitly marked with
 * `ADMIN_AUTH_REQUIRED` (see admin-auth.context.ts) — never inferred from the URL, since some
 * admin-protected endpoints don't live under `/admin` and the public login endpoint does. On a
 * 401 with `codigo` TOKEN_EXPIRED or TOKEN_INVALID it logs the admin out and sends them back to
 * `/admin/login`; a 403 (authenticated but not permitted) or a 500 must NOT touch the session,
 * since neither of those means the token itself is invalid.
 */
export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(AdminSessionService);
  const router = inject(Router);

  const requiresAdminAuth = req.context.get(ADMIN_AUTH_REQUIRED);
  const token = session.token();

  const outgoing =
    requiresAdminAuth && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (requiresAdminAuth && error instanceof HttpErrorResponse && error.status === 401) {
        const codigo = isApiErrorEnvelope(error.error) ? error.error.codigo : undefined;
        if (codigo === 'TOKEN_EXPIRED' || codigo === 'TOKEN_INVALID') {
          session.clear();
          void router.navigate(['/admin/login'], { queryParams: { sessionExpired: '1' } });
        }
      }
      return throwError(() => error);
    }),
  );
};
