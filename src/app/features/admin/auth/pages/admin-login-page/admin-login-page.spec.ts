import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminAuthService } from '../../services/admin-auth.service';
import { AdminLoginPage } from './admin-login-page';

describe('AdminLoginPage', () => {
  let login: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.fn>;

  function configure(returnUrl: string | null = null) {
    login = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AdminLoginPage],
      providers: [
        provideRouter([]),
        { provide: AdminAuthService, useValue: { login } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}) },
          },
        },
      ],
    });
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  }

  function createInstance() {
    const fixture = TestBed.createComponent(AdminLoginPage);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => configure());

  it('shows required errors when submitted empty', async () => {
    const fixture = createInstance();
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ingresa tu correo electrónico.');
    expect(fixture.nativeElement.textContent).toContain('Ingresa tu contraseña.');
    expect(login).not.toHaveBeenCalled();
  });

  it('logs in successfully and navigates to /admin by default', () => {
    login.mockReturnValue(of({ id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'SUPERADMIN' }));
    const fixture = createInstance();
    fixture.componentInstance.form.setValue({ email: 'A@B.com', password: 'secret' });

    fixture.componentInstance.onSubmit();

    expect(login).toHaveBeenCalledWith('a@b.com', 'secret');
    expect(navigateByUrl).toHaveBeenCalledWith('/admin');
  });

  it('follows a same-app returnUrl on success', () => {
    configure('/admin/creditos');
    login.mockReturnValue(of({ id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'ANALISTA' }));
    const fixture = createInstance();
    fixture.componentInstance.form.setValue({ email: 'a@b.com', password: 'secret' });

    fixture.componentInstance.onSubmit();

    expect(navigateByUrl).toHaveBeenCalledWith('/admin/creditos');
  });

  it('ignores an external returnUrl (open-redirect guard)', () => {
    configure('https://evil.example.com');
    login.mockReturnValue(of({ id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'ANALISTA' }));
    const fixture = createInstance();
    fixture.componentInstance.form.setValue({ email: 'a@b.com', password: 'secret' });

    fixture.componentInstance.onSubmit();

    expect(navigateByUrl).toHaveBeenCalledWith('/admin');
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
    login.mockReturnValue(of({ id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'ANALISTA' }));
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'a@b.com', password: 'secret' });

    component.status.set('submitting');
    component.onSubmit();

    expect(login).not.toHaveBeenCalled();
  });
});
