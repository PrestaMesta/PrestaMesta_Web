import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminMfaFlowService } from '../../features/admin/auth/services/admin-mfa-flow.service';
import { AdminSessionService } from '../../features/admin/auth/services/admin-session.service';
import { ADMIN_AUTH_REQUIRED } from './admin-auth.context';
import { adminAuthInterceptor } from './admin-auth.interceptor';
import { ADMIN_PRE_MFA_REQUIRED } from './admin-pre-mfa.context';

function adminAuthContext() {
  return new HttpContext().set(ADMIN_AUTH_REQUIRED, true);
}

function preMfaContext() {
  return new HttpContext().set(ADMIN_PRE_MFA_REQUIRED, true);
}

function setup(options: { token?: string | null; preMfaToken?: string | null } = {}) {
  const clearSession = vi.fn();
  const clearMfaFlow = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([adminAuthInterceptor])),
      provideHttpClientTesting(),
      provideRouter([]),
      {
        provide: AdminSessionService,
        useValue: { token: signal(options.token ?? null), clear: clearSession },
      },
      {
        provide: AdminMfaFlowService,
        useValue: {
          preMfaToken: signal(options.preMfaToken ?? null),
          clear: clearMfaFlow,
        },
      },
    ],
  });

  return {
    http: TestBed.inject(HttpClient),
    httpMock: TestBed.inject(HttpTestingController),
    router: TestBed.inject(Router),
    clearSession,
    clearMfaFlow,
  };
}

describe('adminAuthInterceptor', () => {
  it('attaches the Bearer token to a protected request to /prestamos/creditos (no /admin prefix)', () => {
    const { http, httpMock } = setup({ token: 'jwt-token' });
    http
      .post(
        'https://apitest.prestamesta.fun/api/v1/prestamos/creditos',
        {},
        { context: adminAuthContext() },
      )
      .subscribe();

    const req = httpMock.expectOne('https://apitest.prestamesta.fun/api/v1/prestamos/creditos');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush({});
  });

  it('attaches the Bearer token to a protected request to /admin/prestamos', () => {
    const { http, httpMock } = setup({ token: 'jwt-token' });
    http
      .get('https://apitest.prestamesta.fun/api/v1/admin/prestamos', {
        context: adminAuthContext(),
      })
      .subscribe();

    const req = httpMock.expectOne('https://apitest.prestamesta.fun/api/v1/admin/prestamos');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush({});
  });

  it('does NOT attach Authorization to the login request (unmarked, even with a token present)', () => {
    const { http, httpMock } = setup({ token: 'jwt-token', preMfaToken: 'pre-mfa-token' });
    http
      .post('https://apitest.prestamesta.fun/api/v1/admin/auth/login', {
        email: 'a@b.com',
        password: 'x',
      })
      .subscribe();

    const req = httpMock.expectOne('https://apitest.prestamesta.fun/api/v1/admin/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('does not attach Authorization to an unmarked third-party URL', () => {
    const { http, httpMock } = setup({ token: 'jwt-token' });
    http.get('https://third-party.example.com/pixel.gif').subscribe();

    const req = httpMock.expectOne('https://third-party.example.com/pixel.gif');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('does not attach Authorization to an unmarked request, even to an admin-shaped URL', () => {
    const { http, httpMock } = setup({ token: 'jwt-token' });
    http.get('https://apitest.prestamesta.fun/api/v1/admin/prestamos').subscribe();

    const req = httpMock.expectOne('https://apitest.prestamesta.fun/api/v1/admin/prestamos');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  describe('ADMIN_PRE_MFA_REQUIRED', () => {
    it('attaches the preMfaToken (not the session token) to POST .../mfa/enroll', () => {
      const { http, httpMock } = setup({ token: 'jwt-token', preMfaToken: 'pre-mfa-token' });
      http
        .post(
          'https://apitest.prestamesta.fun/api/v1/admin/auth/mfa/enroll',
          {},
          { context: preMfaContext() },
        )
        .subscribe();

      const req = httpMock.expectOne(
        'https://apitest.prestamesta.fun/api/v1/admin/auth/mfa/enroll',
      );
      expect(req.request.headers.get('Authorization')).toBe('Bearer pre-mfa-token');
      req.flush({});
    });

    it('attaches the preMfaToken to POST .../mfa/enroll/confirm', () => {
      const { http, httpMock } = setup({ preMfaToken: 'pre-mfa-token' });
      http
        .post(
          'https://apitest.prestamesta.fun/api/v1/admin/auth/mfa/enroll/confirm',
          { codigo: '123456' },
          { context: preMfaContext() },
        )
        .subscribe();

      const req = httpMock.expectOne(
        'https://apitest.prestamesta.fun/api/v1/admin/auth/mfa/enroll/confirm',
      );
      expect(req.request.headers.get('Authorization')).toBe('Bearer pre-mfa-token');
      req.flush({});
    });

    it('attaches the preMfaToken to POST .../mfa/verify', () => {
      const { http, httpMock } = setup({ preMfaToken: 'pre-mfa-token' });
      http
        .post(
          'https://apitest.prestamesta.fun/api/v1/admin/auth/mfa/verify',
          { codigo: '123456' },
          { context: preMfaContext() },
        )
        .subscribe();

      const req = httpMock.expectOne(
        'https://apitest.prestamesta.fun/api/v1/admin/auth/mfa/verify',
      );
      expect(req.request.headers.get('Authorization')).toBe('Bearer pre-mfa-token');
      req.flush({});
    });

    it('never attaches a preMfaToken to a request marked ADMIN_AUTH_REQUIRED', () => {
      const { http, httpMock } = setup({ token: 'jwt-token', preMfaToken: 'pre-mfa-token' });
      http
        .get('https://apitest.prestamesta.fun/api/v1/admin/prestamos', {
          context: adminAuthContext(),
        })
        .subscribe();

      const req = httpMock.expectOne('https://apitest.prestamesta.fun/api/v1/admin/prestamos');
      expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
      req.flush({});
    });

    it('never attaches the full session token to a request marked ADMIN_PRE_MFA_REQUIRED', () => {
      const { http, httpMock } = setup({ token: 'jwt-token', preMfaToken: 'pre-mfa-token' });
      http
        .post(
          'https://apitest.prestamesta.fun/api/v1/admin/auth/mfa/verify',
          {},
          { context: preMfaContext() },
        )
        .subscribe();

      const req = httpMock.expectOne(
        'https://apitest.prestamesta.fun/api/v1/admin/auth/mfa/verify',
      );
      expect(req.request.headers.get('Authorization')).toBe('Bearer pre-mfa-token');
      req.flush({});
    });

    it('throws if a request is marked with both ADMIN_AUTH_REQUIRED and ADMIN_PRE_MFA_REQUIRED', () => {
      const { http } = setup({ token: 'jwt-token', preMfaToken: 'pre-mfa-token' });
      const context = new HttpContext()
        .set(ADMIN_AUTH_REQUIRED, true)
        .set(ADMIN_PRE_MFA_REQUIRED, true);

      let capturedError: unknown;
      http
        .get('https://apitest.prestamesta.fun/api/v1/admin/prestamos', { context })
        .subscribe({ error: (error: unknown) => (capturedError = error) });

      expect((capturedError as Error)?.message).toMatch(/mutually exclusive/);
    });

    it('clears the MFA flow (not the session) and redirects to /admin/login on TOKEN_EXPIRED for a pre-MFA request', () => {
      const { http, httpMock, router, clearSession, clearMfaFlow } = setup({
        preMfaToken: 'pre-mfa-token',
      });
      vi.spyOn(router, 'navigate').mockResolvedValue(true);

      http
        .post(
          'https://apitest.prestamesta.fun/api/v1/admin/auth/mfa/verify',
          {},
          { context: preMfaContext() },
        )
        .subscribe({ error: () => undefined });

      httpMock
        .expectOne('https://apitest.prestamesta.fun/api/v1/admin/auth/mfa/verify')
        .flush(
          { mensaje: 'Expirado', codigo: 'TOKEN_EXPIRED' },
          { status: 401, statusText: 'Unauthorized' },
        );

      expect(clearMfaFlow).toHaveBeenCalledOnce();
      expect(clearSession).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/login'], {
        queryParams: { mfaExpired: '1' },
      });
    });

    it('clears the MFA flow on TOKEN_INVALID for a pre-MFA request', () => {
      const { http, httpMock, router, clearMfaFlow } = setup({ preMfaToken: 'pre-mfa-token' });
      vi.spyOn(router, 'navigate').mockResolvedValue(true);

      http
        .post(
          'https://apitest.prestamesta.fun/api/v1/admin/auth/mfa/enroll',
          {},
          { context: preMfaContext() },
        )
        .subscribe({ error: () => undefined });

      httpMock
        .expectOne('https://apitest.prestamesta.fun/api/v1/admin/auth/mfa/enroll')
        .flush(
          { mensaje: 'Inválido', codigo: 'TOKEN_INVALID' },
          { status: 401, statusText: 'Unauthorized' },
        );

      expect(clearMfaFlow).toHaveBeenCalledOnce();
    });

    it('does not clear the MFA flow on a 409 (business error, not a token error)', () => {
      const { http, httpMock, clearMfaFlow } = setup({ preMfaToken: 'pre-mfa-token' });

      http
        .post(
          'https://apitest.prestamesta.fun/api/v1/admin/auth/mfa/enroll',
          {},
          { context: preMfaContext() },
        )
        .subscribe({ error: () => undefined });

      httpMock
        .expectOne('https://apitest.prestamesta.fun/api/v1/admin/auth/mfa/enroll')
        .flush(
          { mensaje: 'Ya activo', codigo: 'MFA_CHALLENGE_REQUIRED' },
          { status: 409, statusText: 'Conflict' },
        );

      expect(clearMfaFlow).not.toHaveBeenCalled();
    });
  });

  describe('on 401 responses to a marked request', () => {
    let harness: ReturnType<typeof setup>;

    beforeEach(() => {
      harness = setup({ token: 'jwt-token' });
      vi.spyOn(harness.router, 'navigate').mockResolvedValue(true);
    });

    it('logs out and redirects on TOKEN_EXPIRED', () => {
      harness.http
        .get('https://apitest.prestamesta.fun/api/v1/admin/prestamos', {
          context: adminAuthContext(),
        })
        .subscribe({ error: () => undefined });

      harness.httpMock
        .expectOne('https://apitest.prestamesta.fun/api/v1/admin/prestamos')
        .flush(
          { mensaje: 'Expirado', codigo: 'TOKEN_EXPIRED' },
          { status: 401, statusText: 'Unauthorized' },
        );

      expect(harness.clearSession).toHaveBeenCalledOnce();
      expect(harness.router.navigate).toHaveBeenCalledWith(['/admin/login'], {
        queryParams: { sessionExpired: '1' },
      });
    });

    it('logs out and redirects on TOKEN_INVALID', () => {
      harness.http
        .get('https://apitest.prestamesta.fun/api/v1/admin/prestamos', {
          context: adminAuthContext(),
        })
        .subscribe({ error: () => undefined });

      harness.httpMock
        .expectOne('https://apitest.prestamesta.fun/api/v1/admin/prestamos')
        .flush(
          { mensaje: 'Inválido', codigo: 'TOKEN_INVALID' },
          { status: 401, statusText: 'Unauthorized' },
        );

      expect(harness.clearSession).toHaveBeenCalledOnce();
    });
  });

  it('preserves the session on a 403 (authenticated but forbidden)', () => {
    const { http, httpMock, clearSession } = setup({ token: 'jwt-token' });
    http
      .get('https://apitest.prestamesta.fun/api/v1/admin/administradores', {
        context: adminAuthContext(),
      })
      .subscribe({ error: () => undefined });

    httpMock
      .expectOne('https://apitest.prestamesta.fun/api/v1/admin/administradores')
      .flush(
        { mensaje: 'Sin permiso', codigo: 'FORBIDDEN' },
        { status: 403, statusText: 'Forbidden' },
      );

    expect(clearSession).not.toHaveBeenCalled();
  });

  it('preserves the session on a 500', () => {
    const { http, httpMock, clearSession } = setup({ token: 'jwt-token' });
    http
      .get('https://apitest.prestamesta.fun/api/v1/admin/prestamos', {
        context: adminAuthContext(),
      })
      .subscribe({ error: () => undefined });

    httpMock
      .expectOne('https://apitest.prestamesta.fun/api/v1/admin/prestamos')
      .flush(
        { mensaje: 'Error interno', codigo: 'INTERNAL_ERROR' },
        { status: 500, statusText: 'Server Error' },
      );

    expect(clearSession).not.toHaveBeenCalled();
  });
});
