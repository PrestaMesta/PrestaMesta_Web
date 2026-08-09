import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeoService } from '../../../../../core/services/seo.service';
import { AdminMfaFlowService } from '../../services/admin-mfa-flow.service';
import { AdminMfaService } from '../../services/admin-mfa.service';
import { AdminSessionService } from '../../services/admin-session.service';
import { AdminMfaVerifyPage } from './admin-mfa-verify-page';

const ADMIN = { id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'SUPERADMIN' as const };
const SESSION_RESPONSE = { mensaje: 'ok', token: 'jwt', admin: ADMIN };

describe('AdminMfaVerifyPage', () => {
  let verifyWithTotp: ReturnType<typeof vi.fn>;
  let verifyWithRecoveryCode: ReturnType<typeof vi.fn>;
  let mfaFlowStart: ReturnType<typeof vi.fn>;
  let mfaFlowClear: ReturnType<typeof vi.fn>;
  let sessionSet: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let setNoIndex: ReturnType<typeof vi.fn>;

  function configure(returnUrl: string | null = null) {
    verifyWithTotp = vi.fn();
    verifyWithRecoveryCode = vi.fn();
    mfaFlowStart = vi.fn();
    mfaFlowClear = vi.fn();
    sessionSet = vi.fn();
    setNoIndex = vi.fn();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AdminMfaVerifyPage],
      providers: [
        provideRouter([]),
        { provide: AdminMfaService, useValue: { verifyWithTotp, verifyWithRecoveryCode } },
        {
          provide: AdminMfaFlowService,
          useValue: {
            preMfaToken: () => 'pre-mfa-token',
            start: mfaFlowStart,
            clear: mfaFlowClear,
          },
        },
        { provide: AdminSessionService, useValue: { set: sessionSet } },
        { provide: SeoService, useValue: { setNoIndex, updateMetadata: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}),
              queryParams: returnUrl ? { returnUrl } : {},
            },
          },
        },
      ],
    });

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  }

  function createInstance() {
    const fixture = TestBed.createComponent(AdminMfaVerifyPage);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => configure());

  it('marks the page noindex on construction', () => {
    createInstance();
    expect(setNoIndex).toHaveBeenCalledOnce();
  });

  it('defaults to the TOTP method', () => {
    const fixture = createInstance();
    expect(fixture.componentInstance.method()).toBe('totp');
  });

  it('verifies with a TOTP code, creates the session, and clears the MFA flow', () => {
    verifyWithTotp.mockReturnValue(of(SESSION_RESPONSE));
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.totpForm.setValue({ codigo: '123456' });

    component.submit();

    expect(verifyWithTotp).toHaveBeenCalledWith('123456');
    expect(sessionSet).toHaveBeenCalledWith({ token: 'jwt', admin: ADMIN });
    expect(mfaFlowClear).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith('/admin');
  });

  it('verifies with a recovery code when that method is selected', () => {
    verifyWithRecoveryCode.mockReturnValue(of(SESSION_RESPONSE));
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.selectMethod('recovery');
    component.recoveryForm.setValue({ codigoRecuperacion: 'A1B2-C3D4-E5F6-0708-090A' });

    component.submit();

    expect(verifyWithRecoveryCode).toHaveBeenCalledWith('A1B2-C3D4-E5F6-0708-090A');
    expect(verifyWithTotp).not.toHaveBeenCalled();
    expect(sessionSet).toHaveBeenCalled();
  });

  it('follows a safe returnUrl on success', () => {
    configure('/admin/solicitudes');
    verifyWithTotp.mockReturnValue(of(SESSION_RESPONSE));
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.totpForm.setValue({ codigo: '123456' });

    component.submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/admin/solicitudes');
  });

  it('ignores an external returnUrl (open-redirect guard)', () => {
    configure('https://evil.example.com');
    verifyWithTotp.mockReturnValue(of(SESSION_RESPONSE));
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.totpForm.setValue({ codigo: '123456' });

    component.submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/admin');
  });

  it.each([
    ['MFA_INVALID_CODE', 'no es válido'],
    ['MFA_CODE_REUSED', 'ya fue utilizado'],
    ['RECOVERY_CODE_ALREADY_USED', 'ya fue utilizado'],
    ['MFA_RATE_LIMITED', 'Demasiados intentos'],
  ])(
    'shows a prudent message for %s without leaking backend details',
    (codigo, expectedFragment) => {
      verifyWithTotp.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 401, error: { mensaje: 'x', codigo } })),
      );
      const fixture = createInstance();
      const component = fixture.componentInstance;
      component.totpForm.setValue({ codigo: '123456' });

      component.submit();

      expect(component.errorMessage()).toContain(expectedFragment);
      expect(sessionSet).not.toHaveBeenCalled();
    },
  );

  it('redirects to /admin/mfa/enrolar on MFA_ENROLLMENT_REQUIRED', () => {
    verifyWithTotp.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { mensaje: 'x', codigo: 'MFA_ENROLLMENT_REQUIRED' },
          }),
      ),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.totpForm.setValue({ codigo: '123456' });

    component.submit();

    expect(mfaFlowStart).toHaveBeenCalledWith('pre-mfa-token', 'MFA_ENROLLMENT_REQUIRED');
    expect(navigate).toHaveBeenCalledWith(['/admin/mfa/enrolar'], { queryParams: {} });
  });

  it('does not show a local error on TOKEN_EXPIRED — the interceptor already redirects', () => {
    verifyWithTotp.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({ status: 401, error: { mensaje: 'x', codigo: 'TOKEN_EXPIRED' } }),
      ),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.totpForm.setValue({ codigo: '123456' });

    component.submit();

    expect(component.errorMessage()).toBe('');
  });

  it('blocks a second submission while one is already in flight', () => {
    verifyWithTotp.mockReturnValue(of(SESSION_RESPONSE));
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.totpForm.setValue({ codigo: '123456' });

    component.status.set('submitting');
    component.submit();

    expect(verifyWithTotp).not.toHaveBeenCalled();
  });

  it('rejects an invalid TOTP format before calling the backend', () => {
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.totpForm.setValue({ codigo: 'abc' });

    component.submit();

    expect(verifyWithTotp).not.toHaveBeenCalled();
  });

  it('requires a non-empty recovery code before calling the backend', () => {
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.selectMethod('recovery');
    component.recoveryForm.setValue({ codigoRecuperacion: '' });

    component.submit();

    expect(verifyWithRecoveryCode).not.toHaveBeenCalled();
  });
});
