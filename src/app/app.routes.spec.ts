import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { SeoService } from './core/services/seo.service';
import { AdminProfile } from './features/admin/auth/models/admin-session.model';
import { AdminMfaEnrollPage } from './features/admin/auth/pages/admin-mfa-enroll-page/admin-mfa-enroll-page';
import { AdminAuthService } from './features/admin/auth/services/admin-auth.service';
import { AdminMfaFlowService } from './features/admin/auth/services/admin-mfa-flow.service';
import { AdminMfaService } from './features/admin/auth/services/admin-mfa.service';
import { AdminSessionService } from './features/admin/auth/services/admin-session.service';
import { routes } from './app.routes';

/**
 * Exercises the REAL, production route config (app.routes.ts) — not a re-implemented copy — so a
 * regression in the actual guard/route wiring is caught here, not just in each guard's isolated
 * unit test. Every navigation resolves to exactly one final URL below: none of these scenarios
 * loop, even though several of them chain a guard redirect into another guard.
 */
function configure(
  admin: AdminProfile | null,
  mfaStep: 'MFA_ENROLLMENT_REQUIRED' | 'MFA_CHALLENGE_REQUIRED' | null = null,
  mfaService?: Partial<AdminMfaService>,
) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: AdminSessionService,
        useValue: {
          admin: signal(admin),
          isAuthenticated: signal(admin !== null),
          token: signal(admin ? 'jwt-token' : null),
          set: vi.fn(),
        },
      },
      {
        provide: AdminMfaFlowService,
        useValue: {
          preMfaToken: signal(mfaStep ? 'pre-mfa-token' : null),
          siguientePaso: signal(mfaStep),
          hasActiveFlow: signal(mfaStep !== null),
          start: vi.fn(),
          clear: vi.fn(),
        },
      },
      { provide: AdminAuthService, useValue: { login: vi.fn(), logout: vi.fn() } },
      { provide: SeoService, useValue: { setNoIndex: vi.fn(), updateMetadata: vi.fn() } },
      ...(mfaService ? [{ provide: AdminMfaService, useValue: mfaService }] : []),
    ],
  });
}

const SUPERADMIN: AdminProfile = { id: 1, nombre: 'Sara', email: 's@b.com', rol: 'SUPERADMIN' };
const COBRADOR: AdminProfile = { id: 2, nombre: 'Bob', email: 'b@b.com', rol: 'COBRADOR' };

describe('app routing — admin area', () => {
  it('resolves an unknown path under /admin to the 404 page, without throwing', async () => {
    configure(SUPERADMIN);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin/esto-no-existe');

    const router = TestBed.inject(Router);
    expect(router.url).toBe('/admin/esto-no-existe');
    expect(harness.routeNativeElement?.textContent).toContain('No encontramos esta página');
  });

  it('resolves an unknown top-level path to the same 404 page', async () => {
    configure(null);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/esto-tampoco-existe');

    expect(harness.routeNativeElement?.textContent).toContain('No encontramos esta página');
  });

  it('redirects an unauthenticated visitor from /admin to /admin/login with a returnUrl (single redirect, no loop)', async () => {
    configure(null);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin');

    const router = TestBed.inject(Router);
    expect(router.url).toBe('/admin/login?returnUrl=%2Fadmin');
  });

  it('redirects a COBRADOR away from /admin/solicitudes back to /admin (no loop)', async () => {
    configure(COBRADOR);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin/solicitudes');

    const router = TestBed.inject(Router);
    expect(router.url).toBe('/admin');
  });

  it('redirects a COBRADOR away from /admin/administradores back to /admin (no loop)', async () => {
    configure(COBRADOR);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin/administradores');

    const router = TestBed.inject(Router);
    expect(router.url).toBe('/admin');
  });

  it('lets a SUPERADMIN reach /admin/solicitudes and /admin/administradores directly', async () => {
    configure(SUPERADMIN);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin/administradores');

    const router = TestBed.inject(Router);
    expect(router.url).toBe('/admin/administradores');
  });
});

describe('app routing — mandatory MFA (Checkpoint 6C)', () => {
  it('redirects /admin/mfa/enrolar to /admin/login when there is no pending MFA flow', async () => {
    configure(null, null);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin/mfa/enrolar');

    expect(TestBed.inject(Router).url).toBe('/admin/login');
  });

  it('redirects /admin/mfa/verificar to /admin/login when there is no pending MFA flow', async () => {
    configure(null, null);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin/mfa/verificar');

    expect(TestBed.inject(Router).url).toBe('/admin/login');
  });

  it('lets an admin mid-enrollment reach /admin/mfa/enrolar', async () => {
    configure(null, 'MFA_ENROLLMENT_REQUIRED');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin/mfa/enrolar');

    expect(TestBed.inject(Router).url).toBe('/admin/mfa/enrolar');
  });

  it('lets an admin mid-challenge reach /admin/mfa/verificar', async () => {
    configure(null, 'MFA_CHALLENGE_REQUIRED');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin/mfa/verificar');

    expect(TestBed.inject(Router).url).toBe('/admin/mfa/verificar');
  });

  it('redirects a fully authenticated admin away from an MFA route, to /admin (no loop)', async () => {
    configure(SUPERADMIN, 'MFA_ENROLLMENT_REQUIRED');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin/mfa/enrolar');

    expect(TestBed.inject(Router).url).toBe('/admin');
  });

  it('a preMfaToken alone cannot open /admin — it is not a session', async () => {
    configure(null, 'MFA_CHALLENGE_REQUIRED');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin');

    expect(TestBed.inject(Router).url).toBe('/admin/login?returnUrl=%2Fadmin');
  });

  it('a preMfaToken alone cannot open /admin/creditos or /admin/administradores', async () => {
    configure(null, 'MFA_CHALLENGE_REQUIRED');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin/administradores');

    expect(TestBed.inject(Router).url).toBe('/admin/login?returnUrl=%2Fadmin%2Fadministradores');
  });
});

describe('app routing — CanDeactivate guard on /admin/mfa/enrolar (hotfix)', () => {
  const ADMIN_PROFILE = { id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'ANALISTA' as const };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function enterCodesPendingState() {
    configure(null, 'MFA_ENROLLMENT_REQUIRED', {
      enroll: vi.fn().mockReturnValue(
        of({
          mensaje: 'ok',
          secreto: 'JBSWY3DPEHPK3PXP',
          otpauthUri: 'otpauth://totp/x',
        }),
      ),
      confirmEnrollment: vi.fn().mockReturnValue(
        of({
          mensaje: 'ok',
          token: 'jwt',
          admin: ADMIN_PROFILE,
          codigosRecuperacion: Array(10).fill('CODE'),
        }),
      ),
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/mfa/enrolar');

    const component = harness.routeDebugElement?.componentInstance as AdminMfaEnrollPage;
    component.form.setValue({ codigo: '123456' });
    component.confirmEnrollment();
    expect(component.recoveryCodes()).not.toBeNull();

    return { harness, component };
  }

  it('blocks Router-driven navigation away while recovery codes are pending, if the admin cancels the prompt', async () => {
    const { harness } = await enterCodesPendingState();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    await harness.navigateByUrl('/admin/mfa/verificar');

    expect(TestBed.inject(Router).url).toBe('/admin/mfa/enrolar');
  });

  it('confirming the prompt allows the Router navigation through and abandons the pending codes (no session ever created)', async () => {
    const { harness, component } = await enterCodesPendingState();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await harness.navigateByUrl('/admin/login');

    expect(TestBed.inject(Router).url).toBe('/admin/login');
    expect(component.recoveryCodes()).toBeNull();
    expect(component.pendingSession()).toBeNull();
    expect(TestBed.inject(AdminSessionService).isAuthenticated()).toBe(false);
  });

  it('does not prompt at all, and navigates freely, once there are no recovery codes pending', async () => {
    configure(null, 'MFA_ENROLLMENT_REQUIRED', {
      enroll: vi
        .fn()
        .mockReturnValue(
          of({ mensaje: 'ok', secreto: 'JBSWY3DPEHPK3PXP', otpauthUri: 'otpauth://totp/x' }),
        ),
      confirmEnrollment: vi.fn(),
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/mfa/enrolar');
    const confirmSpy = vi.spyOn(window, 'confirm');

    await harness.navigateByUrl('/admin/login');

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toBe('/admin/login');
  });
});
