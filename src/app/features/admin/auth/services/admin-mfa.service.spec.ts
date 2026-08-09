import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiConfigService } from '../../../../core/api/api-config.service';
import { ADMIN_AUTH_REQUIRED } from '../../../../core/interceptors/admin-auth.context';
import { ADMIN_PRE_MFA_REQUIRED } from '../../../../core/interceptors/admin-pre-mfa.context';
import { AdminMfaService } from './admin-mfa.service';

const BASE_URL = 'https://apitest.prestamesta.fun/api/v1';

describe('AdminMfaService', () => {
  let service: AdminMfaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiConfigService, useValue: { baseUrl: signal(BASE_URL) } },
      ],
    });
    service = TestBed.inject(AdminMfaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('enroll() POSTs with no body and marks ADMIN_PRE_MFA_REQUIRED (never ADMIN_AUTH_REQUIRED)', () => {
    service.enroll().subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/admin/auth/mfa/enroll`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    expect(req.request.context.get(ADMIN_PRE_MFA_REQUIRED)).toBe(true);
    expect(req.request.context.get(ADMIN_AUTH_REQUIRED)).toBe(false);
    req.flush({ mensaje: 'ok', secreto: 'JBSWY3DPEHPK3PXP', otpauthUri: 'otpauth://totp/x' });
  });

  it('confirmEnrollment() sends exactly { codigo } and marks ADMIN_PRE_MFA_REQUIRED', () => {
    service.confirmEnrollment('123456').subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/admin/auth/mfa/enroll/confirm`);
    expect(req.request.body).toEqual({ codigo: '123456' });
    expect(Object.keys(req.request.body)).toEqual(['codigo']);
    expect(req.request.context.get(ADMIN_PRE_MFA_REQUIRED)).toBe(true);
    req.flush({
      mensaje: 'ok',
      token: 't',
      admin: { id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'ANALISTA' },
      codigosRecuperacion: Array(10).fill('A1B2-C3D4'),
    });
  });

  it('verifyWithTotp() sends exactly { codigo }, never codigoRecuperacion', () => {
    service.verifyWithTotp('654321').subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/admin/auth/mfa/verify`);
    expect(req.request.body).toEqual({ codigo: '654321' });
    expect(Object.keys(req.request.body)).toEqual(['codigo']);
    expect(req.request.context.get(ADMIN_PRE_MFA_REQUIRED)).toBe(true);
    req.flush({
      mensaje: 'ok',
      token: 't',
      admin: { id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'ANALISTA' },
    });
  });

  it('verifyWithRecoveryCode() sends exactly { codigoRecuperacion }, never codigo', () => {
    service.verifyWithRecoveryCode('A1B2-C3D4-E5F6-0708-090A').subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/admin/auth/mfa/verify`);
    expect(req.request.body).toEqual({ codigoRecuperacion: 'A1B2-C3D4-E5F6-0708-090A' });
    expect(Object.keys(req.request.body)).toEqual(['codigoRecuperacion']);
    req.flush({
      mensaje: 'ok',
      token: 't',
      admin: { id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'ANALISTA' },
    });
  });
});
