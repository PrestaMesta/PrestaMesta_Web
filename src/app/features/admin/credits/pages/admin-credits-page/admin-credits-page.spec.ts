import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AdminRole } from '../../../auth/models/admin-session.model';
import { AdminSessionService } from '../../../auth/services/admin-session.service';
import { Credito, CreditoCreatedResponse } from '../../models/credito.model';
import { CreditoService } from '../../services/credito.service';
import { AdminCreditsPage } from './admin-credits-page';

const CREDIT: Credito = {
  id: 1,
  nombre: 'Crédito Personal Express',
  monto_minimo: '1000.00',
  monto_maximo: '20000.00',
  tasa_interes_anual: '24.00',
  plazo_meses: 12,
  creado_en: '2026-08-02T02:43:54.000Z',
};

const VALID_FORM_VALUE = {
  nombre: 'Crédito Nuevo',
  monto_minimo: '1000.00',
  monto_maximo: '20000.00',
  tasa_interes_anual: '24.00',
  plazo_meses: '12',
};

function configure(rol: AdminRole | null, list: ReturnType<typeof vi.fn>, create = vi.fn()) {
  const admin = rol ? { id: 1, nombre: 'Ana', email: 'a@b.com', rol } : null;

  TestBed.configureTestingModule({
    imports: [AdminCreditsPage],
    providers: [
      { provide: CreditoService, useValue: { list, create } },
      { provide: AdminSessionService, useValue: { admin: signal(admin) } },
    ],
  });

  return { list, create };
}

function createInstance() {
  const fixture = TestBed.createComponent(AdminCreditsPage);
  fixture.detectChanges();
  return fixture;
}

describe('AdminCreditsPage — list states', () => {
  it('shows a loading state while the list request is in flight', () => {
    const list = vi.fn().mockReturnValue(new Subject<Credito[]>());
    configure('SUPERADMIN', list);

    const fixture = createInstance();

    expect(fixture.componentInstance.status()).toBe('loading');
    expect(fixture.nativeElement.textContent).toContain('Cargando créditos');
  });

  it('renders the catalog once the list resolves', () => {
    configure('SUPERADMIN', vi.fn().mockReturnValue(of([CREDIT])));

    const fixture = createInstance();

    expect(fixture.componentInstance.status()).toBe('success');
    expect(fixture.nativeElement.textContent).toContain('Crédito Personal Express');
    expect(fixture.nativeElement.textContent).toContain('1000.00');
  });

  it('shows an empty state when the catalog has no credits', () => {
    configure('SUPERADMIN', vi.fn().mockReturnValue(of([])));

    const fixture = createInstance();

    expect(fixture.nativeElement.textContent).toContain('Aún no hay créditos registrados');
  });

  it('shows an error state and a retry action when the list request fails', () => {
    configure(
      'SUPERADMIN',
      vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 }))),
    );

    const fixture = createInstance();

    expect(fixture.componentInstance.status()).toBe('error');
    expect(fixture.nativeElement.textContent).toContain(
      'No se pudo cargar el catálogo de créditos',
    );
    expect(fixture.nativeElement.querySelector('button')).not.toBeNull();
  });

  it('shows a forbidden-specific message on a 403 (session preserved — no logout here)', () => {
    configure(
      'SUPERADMIN',
      vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 }))),
    );

    const fixture = createInstance();

    expect(fixture.componentInstance.loadErrorMessage()).toBe(
      'No tienes permiso para consultar el catálogo de créditos.',
    );
  });

  it('refresh() re-fetches the catalog', () => {
    const { list } = configure('SUPERADMIN', vi.fn().mockReturnValue(of([CREDIT])));

    const fixture = createInstance();
    fixture.componentInstance.refresh();

    expect(list).toHaveBeenCalledTimes(2);
  });
});

describe('AdminCreditsPage — role gating', () => {
  it('shows the create form for SUPERADMIN', () => {
    configure('SUPERADMIN', vi.fn().mockReturnValue(of([CREDIT])));
    const fixture = createInstance();

    expect(fixture.componentInstance.canCreate()).toBe(true);
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
  });

  it('shows the create form for ANALISTA', () => {
    configure('ANALISTA', vi.fn().mockReturnValue(of([CREDIT])));
    const fixture = createInstance();

    expect(fixture.componentInstance.canCreate()).toBe(true);
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
  });

  it('never renders the create form for COBRADOR, even if onSubmit() were called directly', () => {
    const { create } = configure('COBRADOR', vi.fn().mockReturnValue(of([CREDIT])));
    const fixture = createInstance();

    expect(fixture.componentInstance.canCreate()).toBe(false);
    expect(fixture.nativeElement.querySelector('form')).toBeNull();

    fixture.componentInstance.form.setValue(VALID_FORM_VALUE);
    fixture.componentInstance.onSubmit();

    expect(create).not.toHaveBeenCalled();
  });
});

describe('AdminCreditsPage — accessible status regions', () => {
  it('the top-level error banner is a persistent node, never removed/recreated, so it is reliably announced', () => {
    const { create } = configure(
      'SUPERADMIN',
      vi.fn().mockReturnValue(of([CREDIT])),
      vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 }))),
    );
    const fixture = createInstance();

    const assertiveBefore = fixture.nativeElement.querySelector('[aria-live="assertive"]');
    expect(assertiveBefore).not.toBeNull();
    expect(assertiveBefore.textContent.trim()).toBe('');

    fixture.componentInstance.form.setValue(VALID_FORM_VALUE);
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    const assertiveAfter = fixture.nativeElement.querySelector('[aria-live="assertive"]');
    expect(assertiveAfter).toBe(assertiveBefore);
    expect(assertiveAfter.textContent.trim().length).toBeGreaterThan(0);
    expect(create).toHaveBeenCalledOnce();
  });
});

describe('AdminCreditsPage — create flow', () => {
  it('does nothing when submitted with an invalid form', () => {
    const { create } = configure('SUPERADMIN', vi.fn().mockReturnValue(of([CREDIT])));
    const fixture = createInstance();

    fixture.componentInstance.onSubmit();

    expect(create).not.toHaveBeenCalled();
  });

  it('passes the raw form strings to CreditoService.create() — number conversion is the service/mapper boundary, not the component', () => {
    const response: CreditoCreatedResponse = { mensaje: 'ok', creditoId: 2 };
    const { list, create } = configure(
      'SUPERADMIN',
      vi.fn().mockReturnValue(of([CREDIT])),
      vi.fn().mockReturnValue(of(response)),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue(VALID_FORM_VALUE);

    component.onSubmit();

    expect(create).toHaveBeenCalledWith(VALID_FORM_VALUE);
    expect(typeof create.mock.calls[0][0].monto_minimo).toBe('string');
    expect(typeof create.mock.calls[0][0].plazo_meses).toBe('string');
    expect(list).toHaveBeenCalledTimes(2);
    expect(component.formStatus()).toBe('idle');
    expect(component.formSuccessMessage()).toBe('Crédito creado con éxito.');
  });

  it('blocks a second submit while one is already in flight (no double submission)', () => {
    const create = vi.fn().mockReturnValue(new Subject<CreditoCreatedResponse>());
    configure('SUPERADMIN', vi.fn().mockReturnValue(of([CREDIT])), create);
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue(VALID_FORM_VALUE);

    component.onSubmit();
    component.onSubmit();

    expect(create).toHaveBeenCalledTimes(1);
  });

  it('shows "acceso denegado" on a 403 and keeps the session (no logout side effect here)', () => {
    const create = vi
      .fn()
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    configure('SUPERADMIN', vi.fn().mockReturnValue(of([CREDIT])), create);
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue(VALID_FORM_VALUE);

    component.onSubmit();

    expect(component.formErrorMessage()).toBe('No tienes permiso para crear créditos.');
    expect(component.formStatus()).toBe('idle');
  });

  it('shows a generic error message on a non-403 failure', () => {
    const create = vi
      .fn()
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    configure('SUPERADMIN', vi.fn().mockReturnValue(of([CREDIT])), create);
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue(VALID_FORM_VALUE);

    component.onSubmit();

    expect(component.formErrorMessage()).toBe('No se pudo crear el crédito. Inténtalo de nuevo.');
  });
});
