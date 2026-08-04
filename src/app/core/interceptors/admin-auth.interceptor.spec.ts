import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminSessionService } from '../../features/admin/auth/services/admin-session.service';
import { ADMIN_AUTH_REQUIRED } from './admin-auth.context';
import { adminAuthInterceptor } from './admin-auth.interceptor';

function adminAuthContext() {
  return new HttpContext().set(ADMIN_AUTH_REQUIRED, true);
}

function setup(token: string | null) {
  const clear = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([adminAuthInterceptor])),
      provideHttpClientTesting(),
      provideRouter([]),
      { provide: AdminSessionService, useValue: { token: signal(token), clear } },
    ],
  });

  return {
    http: TestBed.inject(HttpClient),
    httpMock: TestBed.inject(HttpTestingController),
    router: TestBed.inject(Router),
    clear,
  };
}

describe('adminAuthInterceptor', () => {
  it('attaches the Bearer token to a protected request to /prestamos/creditos (no /admin prefix)', () => {
    const { http, httpMock } = setup('jwt-token');
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
    const { http, httpMock } = setup('jwt-token');
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
    const { http, httpMock } = setup('jwt-token');
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
    const { http, httpMock } = setup('jwt-token');
    http.get('https://third-party.example.com/pixel.gif').subscribe();

    const req = httpMock.expectOne('https://third-party.example.com/pixel.gif');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('does not attach Authorization to an unmarked request, even to an admin-shaped URL', () => {
    const { http, httpMock } = setup('jwt-token');
    http.get('https://apitest.prestamesta.fun/api/v1/admin/prestamos').subscribe();

    const req = httpMock.expectOne('https://apitest.prestamesta.fun/api/v1/admin/prestamos');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  describe('on 401 responses to a marked request', () => {
    let harness: ReturnType<typeof setup>;

    beforeEach(() => {
      harness = setup('jwt-token');
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

      expect(harness.clear).toHaveBeenCalledOnce();
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

      expect(harness.clear).toHaveBeenCalledOnce();
    });
  });

  it('preserves the session on a 403 (authenticated but forbidden)', () => {
    const { http, httpMock, clear } = setup('jwt-token');
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

    expect(clear).not.toHaveBeenCalled();
  });

  it('preserves the session on a 500', () => {
    const { http, httpMock, clear } = setup('jwt-token');
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

    expect(clear).not.toHaveBeenCalled();
  });
});
