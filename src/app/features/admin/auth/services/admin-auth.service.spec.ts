import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ApiConfigService } from '../../../../core/api/api-config.service';
import { ADMIN_MFA_FLOW_STORAGE_KEY, AdminMfaFlowService } from './admin-mfa-flow.service';
import { ADMIN_SESSION_STORAGE_KEY, AdminSessionService } from './admin-session.service';
import { AdminAuthService } from './admin-auth.service';

const LOGIN_URL = 'https://apitest.prestamesta.fun/api/v1/admin/auth/login';

function cleanupKnownKeys(): void {
  sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  sessionStorage.removeItem(ADMIN_MFA_FLOW_STORAGE_KEY);
}

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let httpMock: HttpTestingController;
  let sessionService: AdminSessionService;
  let mfaFlow: AdminMfaFlowService;

  beforeEach(() => {
    cleanupKnownKeys();
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
    mfaFlow = TestBed.inject(AdminMfaFlowService);
  });

  afterEach(() => {
    cleanupKnownKeys();
  });

  it('logs in successfully and starts the MFA flow instead of a session (enrollment case)', async () => {
    const resultPromise = new Promise((resolve) =>
      service.login('a@b.com', 'secret').subscribe(resolve),
    );

    const req = httpMock.expectOne(LOGIN_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'secret' });

    req.flush({
      mensaje: 'Verifica tu identidad para continuar.',
      preMfaToken: 'pre-mfa-token',
      siguientePaso: 'MFA_ENROLLMENT_REQUIRED',
      mfaEstado: 'NO_ENROLADO',
    });

    const response = (await resultPromise) as { siguientePaso: string };
    expect(response.siguientePaso).toBe('MFA_ENROLLMENT_REQUIRED');
    expect(mfaFlow.preMfaToken()).toBe('pre-mfa-token');
    expect(mfaFlow.siguientePaso()).toBe('MFA_ENROLLMENT_REQUIRED');
    expect(sessionService.isAuthenticated()).toBe(false);
  });

  it('logs in successfully and starts the MFA flow instead of a session (challenge case)', async () => {
    const resultPromise = new Promise((resolve) =>
      service.login('a@b.com', 'secret').subscribe(resolve),
    );

    httpMock.expectOne(LOGIN_URL).flush({
      mensaje: 'Verifica tu identidad para continuar.',
      preMfaToken: 'pre-mfa-token-2',
      siguientePaso: 'MFA_CHALLENGE_REQUIRED',
      mfaEstado: 'ACTIVO',
    });

    await resultPromise;
    expect(mfaFlow.siguientePaso()).toBe('MFA_CHALLENGE_REQUIRED');
    expect(sessionService.isAuthenticated()).toBe(false);
  });

  it('does not send an Authorization header on the login request', () => {
    service.login('a@b.com', 'secret').subscribe();
    const req = httpMock.expectOne(LOGIN_URL);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({
      mensaje: 'ok',
      preMfaToken: 't',
      siguientePaso: 'MFA_CHALLENGE_REQUIRED',
      mfaEstado: 'ACTIVO',
    });
  });

  it('propagates invalid-credentials errors without starting an MFA flow or a session', async () => {
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
    expect(mfaFlow.hasActiveFlow()).toBe(false);
  });

  it('logout() clears both the session and any pending MFA flow', () => {
    sessionService.set({
      token: 't',
      admin: { id: 1, nombre: 'A', email: 'a@b.com', rol: 'ANALISTA' },
    });
    mfaFlow.start('pre-mfa-token', 'MFA_CHALLENGE_REQUIRED');

    service.logout();

    expect(sessionService.isAuthenticated()).toBe(false);
    expect(mfaFlow.hasActiveFlow()).toBe(false);
  });
});
