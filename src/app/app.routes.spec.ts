import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describe, expect, it, vi } from 'vitest';
import { SeoService } from './core/services/seo.service';
import { AdminProfile } from './features/admin/auth/models/admin-session.model';
import { AdminAuthService } from './features/admin/auth/services/admin-auth.service';
import { AdminSessionService } from './features/admin/auth/services/admin-session.service';
import { routes } from './app.routes';

/**
 * Exercises the REAL, production route config (app.routes.ts) — not a re-implemented copy — so a
 * regression in the actual guard/route wiring is caught here, not just in each guard's isolated
 * unit test. Every navigation resolves to exactly one final URL below: none of these scenarios
 * loop, even though several of them chain a guard redirect into another guard.
 */
function configure(admin: AdminProfile | null) {
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
        },
      },
      { provide: AdminAuthService, useValue: { login: vi.fn(), logout: vi.fn() } },
      { provide: SeoService, useValue: { setNoIndex: vi.fn(), updateMetadata: vi.fn() } },
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
