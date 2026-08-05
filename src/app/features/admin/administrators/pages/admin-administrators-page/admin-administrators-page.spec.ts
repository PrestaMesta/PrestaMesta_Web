import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AdminRole } from '../../../auth/models/admin-session.model';
import { CrearAdministradorResponse } from '../../models/administrador.model';
import { AdministradorService } from '../../services/administrador.service';
import { AdminAdministratorsPage } from './admin-administrators-page';

const VALID_VALUE: { nombre: string; email: string; password: string; rol: '' | AdminRole } = {
  nombre: 'Nuevo Analista',
  email: 'Analista@Prestamesta.com',
  password: 'SegurA123456',
  rol: 'ANALISTA',
};

function configure(create: ReturnType<typeof vi.fn> = vi.fn()) {
  TestBed.configureTestingModule({
    imports: [AdminAdministratorsPage],
    providers: [{ provide: AdministradorService, useValue: { create } }],
  });

  return { create };
}

function createInstance() {
  const fixture = TestBed.createComponent(AdminAdministratorsPage);
  fixture.detectChanges();
  return fixture;
}

describe('AdminAdministratorsPage — fields and roles', () => {
  it('offers exactly the three real roles, no invented ones', () => {
    configure();
    const fixture = createInstance();

    expect(fixture.componentInstance.roleOptions).toEqual(['SUPERADMIN', 'ANALISTA', 'COBRADOR']);
  });

  it('does nothing when submitted empty — required errors on every field', () => {
    const { create } = configure();
    const fixture = createInstance();

    fixture.componentInstance.requestConfirmation();
    fixture.detectChanges();

    expect(create).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Ingresa el nombre del administrador.');
    expect(fixture.nativeElement.textContent).toContain('Ingresa un correo electrónico.');
    expect(fixture.nativeElement.textContent).toContain('Ingresa una contraseña.');
    expect(fixture.nativeElement.textContent).toContain('Selecciona un rol.');
  });

  it('rejects a password that does not meet the policy', () => {
    const { create } = configure();
    const fixture = createInstance();
    fixture.componentInstance.form.setValue({ ...VALID_VALUE, password: 'short' });

    fixture.componentInstance.requestConfirmation();

    expect(create).not.toHaveBeenCalled();
    expect(fixture.componentInstance.pendingSubmission()).toBeNull();
  });

  it('rejects an invalid email format', () => {
    const { create } = configure();
    const fixture = createInstance();
    fixture.componentInstance.form.setValue({ ...VALID_VALUE, email: 'not-an-email' });

    fixture.componentInstance.requestConfirmation();

    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a nombre over 150 characters', () => {
    const { create } = configure();
    const fixture = createInstance();
    fixture.componentInstance.form.setValue({ ...VALID_VALUE, nombre: 'x'.repeat(151) });

    fixture.componentInstance.requestConfirmation();

    expect(create).not.toHaveBeenCalled();
  });
});

describe('AdminAdministratorsPage — confirmation flow', () => {
  it('requires confirmation before sending the request', () => {
    const { create } = configure();
    const fixture = createInstance();
    fixture.componentInstance.form.setValue(VALID_VALUE);

    fixture.componentInstance.requestConfirmation();

    expect(create).not.toHaveBeenCalled();
    expect(fixture.componentInstance.pendingSubmission()).not.toBeNull();
  });

  it('moves focus into the confirmation panel when it opens', async () => {
    const { create } = configure();
    const fixture = createInstance();
    fixture.componentInstance.form.setValue(VALID_VALUE);

    fixture.componentInstance.requestConfirmation();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(create).not.toHaveBeenCalled();
    const panel = fixture.nativeElement.querySelector('[tabindex="-1"]');
    expect(panel).not.toBeNull();
    expect(document.activeElement).toBe(panel);
  });

  it('shows nombre/email/rol in the confirmation panel but never the password', () => {
    configure();
    const fixture = createInstance();
    fixture.componentInstance.form.setValue(VALID_VALUE);

    fixture.componentInstance.requestConfirmation();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nuevo Analista');
    expect(text).toContain('analista@prestamesta.com');
    expect(text).toContain('ANALISTA');
    expect(text).not.toContain('SegurA123456');
  });

  it('normalizes the email (trim + lowercase) before building the pending submission', () => {
    configure();
    const fixture = createInstance();
    fixture.componentInstance.form.setValue({
      ...VALID_VALUE,
      email: '  Analista@Prestamesta.com  ',
    });

    fixture.componentInstance.requestConfirmation();

    expect(fixture.componentInstance.pendingSubmission()?.email).toBe('analista@prestamesta.com');
  });

  it('cancelConfirmation() dismisses the panel without calling the service', () => {
    const { create } = configure();
    const fixture = createInstance();
    fixture.componentInstance.form.setValue(VALID_VALUE);
    fixture.componentInstance.requestConfirmation();

    fixture.componentInstance.cancelConfirmation();

    expect(fixture.componentInstance.pendingSubmission()).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it('confirmCreate() sends the exact body (rol allowed to be SUPERADMIN too)', () => {
    const response: CrearAdministradorResponse = {
      mensaje: 'Administrador creado exitosamente',
      adminId: 2,
      rol: 'SUPERADMIN',
    };
    const { create } = configure(vi.fn().mockReturnValue(of(response)));
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ ...VALID_VALUE, rol: 'SUPERADMIN' });
    component.requestConfirmation();

    component.confirmCreate();

    expect(create).toHaveBeenCalledWith({
      nombre: 'Nuevo Analista',
      email: 'analista@prestamesta.com',
      password: 'SegurA123456',
      rol: 'SUPERADMIN',
    });
  });

  it('shows a success message built only from the real response, and resets the form', () => {
    const response: CrearAdministradorResponse = {
      mensaje: 'Administrador creado exitosamente',
      adminId: 7,
      rol: 'ANALISTA',
    };
    configure(vi.fn().mockReturnValue(of(response)));
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue(VALID_VALUE);
    component.requestConfirmation();

    component.confirmCreate();

    expect(component.formSuccessMessage()).toBe(
      'Administrador creado exitosamente (ID 7, rol ANALISTA).',
    );
    expect(component.pendingSubmission()).toBeNull();
    expect(component.form.getRawValue()).toEqual({
      nombre: '',
      email: '',
      password: '',
      rol: '',
    });
  });

  it('blocks a second confirm while one is already in flight (no double submission)', () => {
    const create = vi.fn().mockReturnValue(new Subject<CrearAdministradorResponse>());
    configure(create);
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue(VALID_VALUE);
    component.requestConfirmation();

    component.confirmCreate();
    component.confirmCreate();

    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe('AdminAdministratorsPage — error handling', () => {
  function submitAndFail(status: number) {
    const create = vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
    configure(create);
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue(VALID_VALUE);
    component.requestConfirmation();
    component.confirmCreate();
    return component;
  }

  it('shows a validation-specific message on a 400', () => {
    const component = submitAndFail(400);
    expect(component.formErrorMessage()).toBe(
      'Los datos enviados no son válidos. Revisa el formulario e inténtalo de nuevo.',
    );
  });

  it('shows a forbidden message on a 403 (session preserved)', () => {
    const component = submitAndFail(403);
    expect(component.formErrorMessage()).toBe('No tienes permiso para crear administradores.');
  });

  it('shows an email-already-exists message on a 409', () => {
    const component = submitAndFail(409);
    expect(component.formErrorMessage()).toBe(
      'Ese correo ya está registrado para un administrador.',
    );
  });

  it('shows a generic message on a 500', () => {
    const component = submitAndFail(500);
    expect(component.formErrorMessage()).toBe(
      'No se pudo crear el administrador. Inténtalo de nuevo.',
    );
  });

  it('dismisses the confirmation panel after any error, so the admin edits the form again', () => {
    const component = submitAndFail(409);
    expect(component.pendingSubmission()).toBeNull();
  });
});

describe('AdminAdministratorsPage — SSR compatibility', () => {
  it('constructs and renders without throwing when PLATFORM_ID is "server"', () => {
    const create = vi.fn();
    TestBed.configureTestingModule({
      imports: [AdminAdministratorsPage],
      providers: [
        { provide: AdministradorService, useValue: { create } },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    expect(() => {
      const fixture = TestBed.createComponent(AdminAdministratorsPage);
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('the password policy check (TextEncoder-based) still works under a server platform id', () => {
    const create = vi.fn();
    TestBed.configureTestingModule({
      imports: [AdminAdministratorsPage],
      providers: [
        { provide: AdministradorService, useValue: { create } },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const fixture = TestBed.createComponent(AdminAdministratorsPage);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ ...VALID_VALUE, password: 'short' });

    fixture.componentInstance.requestConfirmation();

    expect(create).not.toHaveBeenCalled();
  });
});
