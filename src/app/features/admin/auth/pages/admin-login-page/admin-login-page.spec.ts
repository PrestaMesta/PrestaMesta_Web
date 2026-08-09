import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeoService } from '../../../../../core/services/seo.service';
import { AdminAuthService } from '../../services/admin-auth.service';
import { AdminLoginPage } from './admin-login-page';

describe('AdminLoginPage', () => {
  let login: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let setNoIndex: ReturnType<typeof vi.fn>;

  function configure(returnUrl: string | null = null) {
    login = vi.fn();
    setNoIndex = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AdminLoginPage],
      providers: [
        provideRouter([]),
        { provide: AdminAuthService, useValue: { login } },
        { provide: SeoService, useValue: { setNoIndex, updateMetadata: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}) },
          },
        },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  }

  function createInstance() {
    const fixture = TestBed.createComponent(AdminLoginPage);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => configure());

  it('marks the page noindex on construction', () => {
    createInstance();
    expect(setNoIndex).toHaveBeenCalledOnce();
  });

  it('shows required errors when submitted empty', async () => {
    const fixture = createInstance();
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ingresa tu correo electrónico.');
    expect(fixture.nativeElement.textContent).toContain('Ingresa tu contraseña.');
    expect(login).not.toHaveBeenCalled();
  });

  it('routes to the enrollment page when the backend says MFA_ENROLLMENT_REQUIRED', () => {
    login.mockReturnValue(
      of({
        mensaje: 'Verifica tu identidad.',
        preMfaToken: 'pre-mfa-token',
        siguientePaso: 'MFA_ENROLLMENT_REQUIRED',
        mfaEstado: 'NO_ENROLADO',
      }),
    );
    const fixture = createInstance();
    fixture.componentInstance.form.setValue({ email: 'A@B.com', password: 'secret' });

    fixture.componentInstance.onSubmit();

    expect(login).toHaveBeenCalledWith('a@b.com', 'secret');
    expect(navigate).toHaveBeenCalledWith(['/admin/mfa/enrolar'], {});
  });

  it('routes to the challenge page when the backend says MFA_CHALLENGE_REQUIRED', () => {
    login.mockReturnValue(
      of({
        mensaje: 'Verifica tu identidad.',
        preMfaToken: 'pre-mfa-token',
        siguientePaso: 'MFA_CHALLENGE_REQUIRED',
        mfaEstado: 'ACTIVO',
      }),
    );
    const fixture = createInstance();
    fixture.componentInstance.form.setValue({ email: 'a@b.com', password: 'secret' });

    fixture.componentInstance.onSubmit();

    expect(navigate).toHaveBeenCalledWith(['/admin/mfa/verificar'], {});
  });

  it('forwards a same-app returnUrl as a query param to the MFA route', () => {
    configure('/admin/creditos');
    login.mockReturnValue(
      of({
        mensaje: 'ok',
        preMfaToken: 'pre-mfa-token',
        siguientePaso: 'MFA_CHALLENGE_REQUIRED',
        mfaEstado: 'ACTIVO',
      }),
    );
    const fixture = createInstance();
    fixture.componentInstance.form.setValue({ email: 'a@b.com', password: 'secret' });

    fixture.componentInstance.onSubmit();

    expect(navigate).toHaveBeenCalledWith(['/admin/mfa/verificar'], {
      queryParams: { returnUrl: '/admin/creditos' },
    });
  });

  it('does not create a session directly — login alone never yields one', () => {
    login.mockReturnValue(
      of({
        mensaje: 'ok',
        preMfaToken: 'pre-mfa-token',
        siguientePaso: 'MFA_ENROLLMENT_REQUIRED',
        mfaEstado: 'NO_ENROLADO',
      }),
    );
    const fixture = createInstance();
    fixture.componentInstance.form.setValue({ email: 'a@b.com', password: 'secret' });

    fixture.componentInstance.onSubmit();

    // The component only ever routes to an MFA page — it never touches AdminSessionService.
    expect(navigate).not.toHaveBeenCalledWith(['/admin']);
  });

  it('shows a generic message for invalid credentials without leaking which field failed', () => {
    login.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 401, error: { codigo: 'INVALID_CREDENTIALS' } }),
      ),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'a@b.com', password: 'wrong' });

    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Correo o contraseña incorrectos.');
    expect(component.status()).toBe('idle');
  });

  it('shows a generic error message on a network/server failure', () => {
    login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'a@b.com', password: 'x' });

    component.onSubmit();

    expect(component.errorMessage()).toBe(
      'Ocurrió un error al iniciar sesión. Inténtalo de nuevo.',
    );
  });

  it('ignores a second submit while one is already in flight', () => {
    login.mockReturnValue(
      of({
        mensaje: 'ok',
        preMfaToken: 'pre-mfa-token',
        siguientePaso: 'MFA_CHALLENGE_REQUIRED',
        mfaEstado: 'ACTIVO',
      }),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'a@b.com', password: 'secret' });

    component.status.set('submitting');
    component.onSubmit();

    expect(login).not.toHaveBeenCalled();
  });
});
