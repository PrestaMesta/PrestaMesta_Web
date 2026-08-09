import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UrlTree, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AdminMfaFlowService } from '../services/admin-mfa-flow.service';
import { AdminSessionService } from '../services/admin-session.service';
import { adminMfaStepGuard } from './admin-mfa-flow.guard';

function runGuard(
  step: 'MFA_ENROLLMENT_REQUIRED' | 'MFA_CHALLENGE_REQUIRED',
  options: {
    isAuthenticated?: boolean;
    activeStep?: 'MFA_ENROLLMENT_REQUIRED' | 'MFA_CHALLENGE_REQUIRED' | null;
  },
) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AdminSessionService,
        useValue: { isAuthenticated: signal(options.isAuthenticated ?? false) },
      },
      {
        provide: AdminMfaFlowService,
        useValue: { siguientePaso: signal(options.activeStep ?? null) },
      },
    ],
  });

  return TestBed.runInInjectionContext(() => adminMfaStepGuard(step)({} as never, {} as never));
}

describe('adminMfaStepGuard', () => {
  it('allows access when the pending flow matches the guarded step', () => {
    expect(runGuard('MFA_ENROLLMENT_REQUIRED', { activeStep: 'MFA_ENROLLMENT_REQUIRED' })).toBe(
      true,
    );
    expect(runGuard('MFA_CHALLENGE_REQUIRED', { activeStep: 'MFA_CHALLENGE_REQUIRED' })).toBe(true);
  });

  it('redirects to /admin/login when there is no preMfaToken/active flow at all', () => {
    const result = runGuard('MFA_ENROLLMENT_REQUIRED', { activeStep: null }) as UrlTree;
    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/admin/login');
  });

  it('redirects a fully authenticated admin away from an MFA route, to /admin', () => {
    const result = runGuard('MFA_ENROLLMENT_REQUIRED', {
      isAuthenticated: true,
      activeStep: 'MFA_ENROLLMENT_REQUIRED',
    }) as UrlTree;
    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/admin');
  });

  it('redirects /admin/mfa/enrolar to /admin/mfa/verificar when the real step is CHALLENGE', () => {
    const result = runGuard('MFA_ENROLLMENT_REQUIRED', {
      activeStep: 'MFA_CHALLENGE_REQUIRED',
    }) as UrlTree;
    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/admin/mfa/verificar');
  });

  it('redirects /admin/mfa/verificar to /admin/mfa/enrolar when the real step is ENROLLMENT', () => {
    const result = runGuard('MFA_CHALLENGE_REQUIRED', {
      activeStep: 'MFA_ENROLLMENT_REQUIRED',
    }) as UrlTree;
    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/admin/mfa/enrolar');
  });
});
