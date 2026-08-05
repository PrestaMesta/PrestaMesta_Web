import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import {
  PrestamoAdminListItem,
  PrestamoAdminListResponse,
} from '../../models/prestamo-admin.model';
import { PrestamoAdminService } from '../../services/prestamo-admin.service';
import { AdminRequestsPage } from './admin-requests-page';

const ITEM: PrestamoAdminListItem = {
  id: 1,
  cliente: { id: 7, nombre: 'Juan Pérez', email: 'juan@example.com' },
  credito: { id: 1, nombre: 'Crédito Personal Express' },
  monto_solicitado: '10000.00',
  monto_total_a_pagar: '12400.00',
  saldo_pendiente: '12400.00',
  estado: 'PENDIENTE',
  fecha_solicitud: '2026-08-02T20:46:06.000Z',
  fecha_decision: null,
};

function page(
  items: PrestamoAdminListItem[],
  overrides?: Partial<PrestamoAdminListResponse['pagination']>,
) {
  return {
    data: items,
    pagination: {
      page: 1,
      limit: 20,
      total: items.length,
      totalPages: items.length > 0 ? 1 : 0,
      ...overrides,
    },
  };
}

function configure(list: ReturnType<typeof vi.fn>) {
  TestBed.configureTestingModule({
    imports: [AdminRequestsPage],
    providers: [provideRouter([]), { provide: PrestamoAdminService, useValue: { list } }],
  });

  return { list };
}

function createInstance() {
  const fixture = TestBed.createComponent(AdminRequestsPage);
  fixture.detectChanges();
  return fixture;
}

describe('AdminRequestsPage — list states', () => {
  it('shows a loading state while the request is in flight', () => {
    configure(vi.fn().mockReturnValue(new Subject()));
    const fixture = createInstance();

    expect(fixture.componentInstance.status()).toBe('loading');
    expect(fixture.nativeElement.textContent).toContain('Cargando solicitudes');
  });

  it('renders the list once it resolves', () => {
    configure(vi.fn().mockReturnValue(of(page([ITEM]))));
    const fixture = createInstance();

    expect(fixture.componentInstance.status()).toBe('success');
    expect(fixture.nativeElement.textContent).toContain('Juan Pérez');
    expect(fixture.nativeElement.textContent).toContain('Crédito Personal Express');
    expect(fixture.nativeElement.textContent).toContain('10000.00');
  });

  it('shows an empty state when there are no matching requests', () => {
    configure(vi.fn().mockReturnValue(of(page([]))));
    const fixture = createInstance();

    expect(fixture.nativeElement.textContent).toContain('No hay solicitudes que coincidan');
  });

  it('shows a generic error state on a 500', () => {
    configure(vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 }))));
    const fixture = createInstance();

    expect(fixture.componentInstance.status()).toBe('error');
    expect(fixture.nativeElement.textContent).toContain(
      'No se pudo cargar el listado de solicitudes',
    );
  });

  it('shows a forbidden-specific error message on a 403 (session preserved — no logout here)', () => {
    configure(vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 }))));
    const fixture = createInstance();

    expect(fixture.componentInstance.loadErrorMessage()).toBe(
      'No tienes permiso para consultar las solicitudes.',
    );
  });

  it('refresh() re-fetches the list', () => {
    const { list } = configure(vi.fn().mockReturnValue(of(page([ITEM]))));
    const fixture = createInstance();

    fixture.componentInstance.refresh();

    expect(list).toHaveBeenCalledTimes(2);
  });
});

describe('AdminRequestsPage — filters', () => {
  it('always sends page and limit, with no optional filters by default', () => {
    const { list } = configure(vi.fn().mockReturnValue(of(page([ITEM]))));
    createInstance();

    expect(list).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('blocks applying filters with an invalid cliente_id and does not re-fetch', () => {
    const { list } = configure(vi.fn().mockReturnValue(of(page([ITEM]))));
    const fixture = createInstance();
    fixture.componentInstance.filtersForm.controls.cliente_id.setValue('abc');

    fixture.componentInstance.applyFilters();

    expect(list).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.filtersForm.controls.cliente_id.touched).toBe(true);
  });

  it('blocks applying filters when fecha_desde is after fecha_hasta', () => {
    const { list } = configure(vi.fn().mockReturnValue(of(page([ITEM]))));
    const fixture = createInstance();
    fixture.componentInstance.filtersForm.patchValue({
      fecha_desde: '2026-02-01',
      fecha_hasta: '2026-01-01',
    });

    fixture.componentInstance.applyFilters();

    expect(list).toHaveBeenCalledTimes(1);
  });

  it('applies only the supported filters and resets to page 1', () => {
    const { list } = configure(vi.fn().mockReturnValue(of(page([ITEM]))));
    const fixture = createInstance();
    fixture.componentInstance.filtersForm.setValue({
      estado: 'PENDIENTE',
      cliente_id: '7',
      credito_id: '1',
      fecha_desde: '2026-01-01',
      fecha_hasta: '2026-01-31',
    });

    fixture.componentInstance.applyFilters();

    expect(list).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      estado: 'PENDIENTE',
      cliente_id: 7,
      credito_id: 1,
      fecha_desde: '2026-01-01',
      fecha_hasta: '2026-01-31',
    });
  });

  it('clearFilters() resets the form and re-fetches with no filters', () => {
    const { list } = configure(vi.fn().mockReturnValue(of(page([ITEM]))));
    const fixture = createInstance();
    fixture.componentInstance.filtersForm.patchValue({ estado: 'APROBADO' });
    fixture.componentInstance.applyFilters();

    fixture.componentInstance.clearFilters();

    expect(list).toHaveBeenLastCalledWith({ page: 1, limit: 20 });
  });
});

describe('AdminRequestsPage — pagination', () => {
  it('goToPage() moves to a valid page', () => {
    const { list } = configure(
      vi.fn().mockReturnValue(of(page([ITEM], { page: 1, totalPages: 3, total: 45 }))),
    );
    const fixture = createInstance();

    fixture.componentInstance.goToPage(2);

    expect(list).toHaveBeenLastCalledWith({ page: 2, limit: 20 });
  });

  it('ignores a page below 1', () => {
    const { list } = configure(vi.fn().mockReturnValue(of(page([ITEM]))));
    const fixture = createInstance();

    fixture.componentInstance.goToPage(0);

    expect(list).toHaveBeenCalledTimes(1);
  });

  it('ignores a page beyond totalPages', () => {
    const { list } = configure(
      vi.fn().mockReturnValue(of(page([ITEM], { page: 1, totalPages: 1 }))),
    );
    const fixture = createInstance();

    fixture.componentInstance.goToPage(2);

    expect(list).toHaveBeenCalledTimes(1);
  });
});
