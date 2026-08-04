import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminSessionService } from '../services/admin-session.service';

/** Restricts a route to SUPERADMIN — currently only `/admin/administradores`. */
export const adminSuperadminGuard: CanActivateFn = () => {
  const session = inject(AdminSessionService);
  const router = inject(Router);

  if (session.admin()?.rol === 'SUPERADMIN') {
    return true;
  }

  return router.createUrlTree(['/admin']);
};
