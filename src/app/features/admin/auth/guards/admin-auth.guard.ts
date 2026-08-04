import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminSessionService } from '../services/admin-session.service';

/** Blocks access to `/admin/**` for anyone without a restored or freshly logged-in session. */
export const adminAuthGuard: CanActivateFn = (_route, state) => {
  const session = inject(AdminSessionService);
  const router = inject(Router);

  if (session.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
};
