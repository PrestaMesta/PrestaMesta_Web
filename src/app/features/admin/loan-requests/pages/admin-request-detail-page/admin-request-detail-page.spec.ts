import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { AdminRole } from '../../../auth/models/admin-session.model';
import { AdminSessionService } from '../../../auth/services/admin-session.service';
import { CambiarEstadoResponse, PrestamoAdminDetalle } from '../../models/prestamo-admin.model';
import { PrestamoAdminService } from '../../services/prestamo-admin.service';
import { AdminRequestDetailPage } from './admin-request-detail-page';

const DETALLE: PrestamoAdminDetalle = {
  id: 1,
  cliente: { id: 7, nombre: 'Juan Pérez', email: 'juan@example.com', telefono: '8711234567' },
  credito: {
    id: 1,
    nombre: 'Crédito Personal Express',
    monto_minimo: '1000.00',
    monto_maximo: '20000.00',
    tasa_interes_anual: '24.00',
    plazo_meses: 12,
    creado_en: '2026-08-02T02:43:54.000Z',
  },
  monto_solicitado: '10000.00',
  monto_total_a_pagar: '12400.00',
  saldo_pendiente: '12400.00',
  estado: 'PENDIENTE',
  fecha_solicitud: '2026-08-02T20:46:06.000Z',
  fecha_decision: null,
  aval: null,
};

const AVAL = {
  id: 5,
  nombre: 'Roberto Gómez',
  telefono: '8711234567',
  direccion: 'Av. Morelos #450, Centro',
  ingreso_mensual: '15000.00',
};

function configure(
  options: {
    id?: string;
    rol?: AdminRole;
    getById?: ReturnType<typeof vi.fn>;
    cambiarEstado?: ReturnType<typeof vi.fn>;
  } = {},
) {
  const getById = options.getById ?? vi.fn().mockReturnValue(of(DETALLE));
  const cambiarEstado = options.cambiarEstado ?? vi.fn();
  const admin = { id: 1, nombre: 'Ana', email: 'a@b.com', rol: options.rol ?? 'SUPERADMIN' };

  TestBed.configureTestingModule({
    imports: [AdminRequestDetailPage],
    providers: [
      provideRouter([]),
      { provide: PrestamoAdminService, useValue: { getById, cambiarEstado } },
      { provide: AdminSessionService, useValue: { admin: signal(admin) } },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap({ id: options.id ?? '1' }) } },
      },
    ],
  });

  return { getById, cambiarEstado };
}

function createInstance() {
  const fixture = TestBed.createComponent(AdminRequestDetailPage);
  fixture.detectChanges();
  return fixture;
}

describe('AdminRequestDetailPage — loading the detail', () => {
  it('shows a loading state while the request is in flight', () => {
    configure({ getById: vi.fn().mockReturnValue(new Subject()) });
    const fixture = createInstance();

    expect(fixture.componentInstance.status()).toBe('loading');
    expect(fixture.nativeElement.textContent).toContain('Cargando solicitud');
  });

  it('renders cliente, crédito and solicitud data once resolved', () => {
    configure();
    const fixture = createInstance();

    expect(fixture.componentInstance.status()).toBe('success');
    expect(fixture.nativeElement.textContent).toContain('Juan Pérez');
    expect(fixture.nativeElement.textContent).toContain('juan@example.com');
    expect(fixture.nativeElement.textContent).toContain('Crédito Personal Express');
    expect(fixture.nativeElement.textContent).toContain('10000.00');
  });

  it('shows "sin aval" copy when the loan has no aval', () => {
    configure();
    const fixture = createInstance();

    expect(fixture.nativeElement.textContent).toContain('no tiene aval registrado');
  });

  it('renders the aval fields when the loan has one', () => {
    configure({ getById: vi.fn().mockReturnValue(of({ ...DETALLE, aval: AVAL })) });
    const fixture = createInstance();

    expect(fixture.nativeElement.textContent).toContain('Roberto Gómez');
    expect(fixture.nativeElement.textContent).toContain('Av. Morelos #450, Centro');
  });

  it('does not request the API for a non-numeric id, and shows a not-found state', () => {
    const { getById } = configure({ id: 'not-a-number' });
    const fixture = createInstance();

    expect(getById).not.toHaveBeenCalled();
    expect(fixture.componentInstance.status()).toBe('notFound');
  });

  it('shows a not-found state on a 404 LOAN_NOT_FOUND', () => {
    configure({
      getById: vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 }))),
    });
    const fixture = createInstance();

    expect(fixture.componentInstance.status()).toBe('notFound');
  });

  it('shows a generic error state on a 500', () => {
    configure({
      getById: vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 }))),
    });
    const fixture = createInstance();

    expect(fixture.componentInstance.status()).toBe('error');
  });

  it('shows a forbidden-specific message on a 403 (session preserved)', () => {
    configure({
      getById: vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 }))),
    });
    const fixture = createInstance();

    expect(fixture.componentInstance.loadErrorMessage()).toBe(
      'No tienes permiso para consultar esta solicitud.',
    );
  });

  it('refresh() re-fetches the detail', () => {
    const { getById } = configure();
    const fixture = createInstance();

    fixture.componentInstance.refresh();

    expect(getById).toHaveBeenCalledTimes(2);
  });
});

describe('AdminRequestDetailPage — role gating', () => {
  it('shows Aprobar/Rechazar for SUPERADMIN when PENDIENTE', () => {
    configure({ rol: 'SUPERADMIN' });
    const fixture = createInstance();

    expect(fixture.componentInstance.canDecide()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Aprobar');
    expect(fixture.nativeElement.textContent).toContain('Rechazar');
  });

  it('shows Aprobar/Rechazar for ANALISTA when PENDIENTE', () => {
    configure({ rol: 'ANALISTA' });
    const fixture = createInstance();

    expect(fixture.componentInstance.canDecide()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Aprobar');
  });

  it('never shows Aprobar/Rechazar for COBRADOR (defense in depth; route guard is the primary gate)', () => {
    configure({ rol: 'COBRADOR' });
    const fixture = createInstance();

    expect(fixture.componentInstance.canDecide()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('Aprobar');
    expect(fixture.nativeElement.textContent).not.toContain('Rechazar');
  });

  it('does not show Aprobar/Rechazar when the loan is no longer PENDIENTE', () => {
    configure({ getById: vi.fn().mockReturnValue(of({ ...DETALLE, estado: 'APROBADO' })) });
    const fixture = createInstance();

    expect(fixture.nativeElement.textContent).not.toContain('Aprobar');
  });
});

describe('AdminRequestDetailPage — approve/reject flow', () => {
  it('requires confirmation before sending the PATCH', () => {
    const { cambiarEstado } = configure();
    const fixture = createInstance();

    fixture.componentInstance.startAction('APROBADO');

    expect(cambiarEstado).not.toHaveBeenCalled();
    expect(fixture.componentInstance.pendingAction()).toBe('APROBADO');
  });

  it('cancelAction() dismisses the confirmation without calling the service', () => {
    const { cambiarEstado } = configure();
    const fixture = createInstance();
    fixture.componentInstance.startAction('RECHAZADO');

    fixture.componentInstance.cancelAction();

    expect(fixture.componentInstance.pendingAction()).toBeNull();
    expect(cambiarEstado).not.toHaveBeenCalled();
  });

  it('confirmAction() approves with the exact id and body, then refreshes the detail', () => {
    const response: CambiarEstadoResponse = {
      mensaje: 'El prestamo #1 ha sido aprobado exitosamente.',
    };
    const { cambiarEstado, getById } = configure({
      cambiarEstado: vi.fn().mockReturnValue(of(response)),
    });
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.startAction('APROBADO');

    component.confirmAction();

    expect(cambiarEstado).toHaveBeenCalledWith(1, { estado: 'APROBADO', motivo: undefined });
    expect(component.pendingAction()).toBeNull();
    expect(component.actionSuccessMessage()).toBe(response.mensaje);
    expect(getById).toHaveBeenCalledTimes(2);
  });

  it('sends a trimmed motivo when supplied', () => {
    const { cambiarEstado } = configure({
      cambiarEstado: vi.fn().mockReturnValue(of({ mensaje: 'ok' })),
    });
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.startAction('RECHAZADO');
    component.motivoForm.setValue({ motivo: '  No cumple perfil  ' });

    component.confirmAction();

    expect(cambiarEstado).toHaveBeenCalledWith(1, {
      estado: 'RECHAZADO',
      motivo: 'No cumple perfil',
    });
  });

  it('blocks a second confirm while one is already in flight (no double submission)', () => {
    const cambiarEstado = vi.fn().mockReturnValue(new Subject<CambiarEstadoResponse>());
    configure({ cambiarEstado });
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.startAction('APROBADO');

    component.confirmAction();
    component.confirmAction();

    expect(cambiarEstado).toHaveBeenCalledTimes(1);
  });

  it('shows a specific message and reloads on a 409 INVALID_TRANSITION race', () => {
    const { getById } = configure({
      cambiarEstado: vi
        .fn()
        .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 }))),
    });
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.startAction('APROBADO');

    component.confirmAction();

    expect(component.actionErrorMessage()).toBe('Esta solicitud ya no está pendiente de revisión.');
    expect(component.pendingAction()).toBeNull();
    expect(getById).toHaveBeenCalledTimes(2);
  });

  it('shows a LOAN_NOT_FOUND-specific message on a 404', () => {
    configure({
      cambiarEstado: vi
        .fn()
        .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 }))),
    });
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.startAction('APROBADO');

    component.confirmAction();

    expect(component.actionErrorMessage()).toBe('Esta solicitud ya no existe.');
  });

  it('shows a forbidden message on a 403 (session preserved, no logout)', () => {
    configure({
      cambiarEstado: vi
        .fn()
        .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 }))),
    });
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.startAction('APROBADO');

    component.confirmAction();

    expect(component.actionErrorMessage()).toBe('No tienes permiso para esta acción.');
  });

  it('shows a generic message on a 500', () => {
    configure({
      cambiarEstado: vi
        .fn()
        .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 }))),
    });
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.startAction('APROBADO');

    component.confirmAction();

    expect(component.actionErrorMessage()).toBe(
      'No se pudo actualizar la solicitud. Inténtalo de nuevo.',
    );
  });
});
