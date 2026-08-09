import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MfaSiguientePaso } from '../models/admin-mfa.model';
import { AdminMfaFlowService } from '../services/admin-mfa-flow.service';
import { AdminSessionService } from '../services/admin-session.service';

const STEP_PATHS: Record<MfaSiguientePaso, string> = {
  MFA_ENROLLMENT_REQUIRED: '/admin/mfa/enrolar',
  MFA_CHALLENGE_REQUIRED: '/admin/mfa/verificar',
};

/**
 * Guards `/admin/mfa/enrolar` and `/admin/mfa/verificar`. A `preMfaToken` only proves "password
 * was correct" — it must never substitute for a real admin session, so this guard (not
 * `adminAuthGuard`) is what actually protects these two routes.
 */
export function adminMfaStepGuard(step: MfaSiguientePaso): CanActivateFn {
  return () => {
    const session = inject(AdminSessionService);
    const mfaFlow = inject(AdminMfaFlowService);
    const router = inject(Router);

    // A fully authenticated admin has nothing left to do here — send them to the dashboard
    // instead of leaving a normal session stuck on an MFA step.
    if (session.isAuthenticated()) {
      return router.createUrlTree(['/admin']);
    }

    const activeStep = mfaFlow.siguientePaso();
    if (!activeStep) {
      return router.createUrlTree(['/admin/login']);
    }

    // The backend authoritatively decided the step at login time; if this route no longer
    // matches it (e.g. a stale bookmark, or a step change discovered mid-flow), send the admin
    // to the one that does instead of letting them hit a route that can only 409.
    return activeStep === step ? true : router.createUrlTree([STEP_PATHS[activeStep]]);
  };
}
