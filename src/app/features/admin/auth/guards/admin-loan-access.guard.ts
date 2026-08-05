import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminSessionService } from '../services/admin-session.service';

/**
 * Restricts `/admin/solicitudes/**` to SUPERADMIN/ANALISTA — adminPrestamoRoutes.js gives
 * COBRADOR no access at all to loan requests (list, detail, or the approve/reject transition),
 * unlike the créditos catalog where COBRADOR can read but not write. The backend remains the
 * actual authority (autorizarRoles re-checks the role from DB on every request); this guard only
 * avoids sending a COBRADOR into a page that would 403 on its very first request.
 */
export const adminLoanAccessGuard: CanActivateFn = () => {
  const session = inject(AdminSessionService);
  const router = inject(Router);

  const rol = session.admin()?.rol;
  if (rol === 'SUPERADMIN' || rol === 'ANALISTA') {
    return true;
  }

  return router.createUrlTree(['/admin']);
};
