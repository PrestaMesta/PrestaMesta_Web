import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ApiConfigService } from '../../../../core/api/api-config.service';
import { AdminSessionService } from './admin-session.service';
import { AdminAuthService } from './admin-auth.service';

const LOGIN_URL = 'https://apitest.prestamesta.fun/api/v1/admin/auth/login';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let httpMock: HttpTestingController;
  let sessionService: AdminSessionService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ApiConfigService,
          useValue: { baseUrl: signal('https://apitest.prestamesta.fun/api/v1') },
        },
      ],
    });
    service = TestBed.inject(AdminAuthService);
    httpMock = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(AdminSessionService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('logs in successfully and persists the returned session', async () => {
    const resultPromise = new Promise((resolve) =>
      service.login('a@b.com', 'secret').subscribe(resolve),
    );

    const req = httpMock.expectOne(LOGIN_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'secret' });

    req.flush({
      mensaje: 'Autenticación de administrador exitosa',
      token: 'jwt-token',
      admin: { id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'SUPERADMIN' },
    });

    const admin = await resultPromise;
    expect(admin).toEqual({ id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'SUPERADMIN' });
    expect(sessionService.isAuthenticated()).toBe(true);
    expect(sessionService.token()).toBe('jwt-token');
  });

  it('does not send an Authorization header on the login request', () => {
    service.login('a@b.com', 'secret').subscribe();
    const req = httpMock.expectOne(LOGIN_URL);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({
      mensaje: 'ok',
      token: 't',
      admin: { id: 1, nombre: 'A', email: 'a@b.com', rol: 'ANALISTA' },
    });
  });

  it('propagates invalid-credentials errors without creating a session', async () => {
    let error: unknown;
    service.login('a@b.com', 'wrong').subscribe({ error: (e) => (error = e) });

    httpMock
      .expectOne(LOGIN_URL)
      .flush(
        { mensaje: 'Credenciales inválidas.', codigo: 'INVALID_CREDENTIALS' },
        { status: 401, statusText: 'Unauthorized' },
      );

    expect((error as { status: number }).status).toBe(401);
    expect(sessionService.isAuthenticated()).toBe(false);
  });

  it('logout() clears the session', () => {
    sessionService.set({
      token: 't',
      admin: { id: 1, nombre: 'A', email: 'a@b.com', rol: 'ANALISTA' },
    });
    service.logout();
    expect(sessionService.isAuthenticated()).toBe(false);
  });
});
